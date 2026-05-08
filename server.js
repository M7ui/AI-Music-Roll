import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import os from 'node:os';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const CFG_FILE = path.join(__dir, '.ai_piano_roll_cfg.json');
const PUBLIC = path.join(__dir, 'public');
const VOCAL = path.join(__dir, 'vocal');
const PORT = 8765;
const START_TIME = Date.now();

const LOGS = [];
function log(level, msg) {
  const entry = { time: new Date().toISOString(), level, msg };
  LOGS.push(entry);
  if (LOGS.length > 500) LOGS.shift();
  console.log(`[${level}] ${msg}`);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.wav':  'audio/wav',
  '.mp3':  'audio/mpeg',
  '.ogg':  'audio/ogg',
  '.m4a':  'audio/mp4',
  '.aac':  'audio/aac',
  '.flac': 'audio/flac',
};

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CFG_FILE, 'utf-8')); }
  catch { return null; }
}

function saveConfig(cfg) {
  fs.writeFileSync(CFG_FILE, JSON.stringify(cfg, null, 2));
}

function testConnect(config) {
  return new Promise((resolve, reject) => {
    const baseUrl = config.base_url || 'https://api.openai.com/v1';
    const fullUrl = new URL(baseUrl);
    const endpoint = '/chat/completions';
    fullUrl.pathname = fullUrl.pathname.replace(/\/?$/, '') + endpoint;

    const payload = JSON.stringify({
      model: config.model || 'gpt-4o',
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 5,
    });

    const isHttps = fullUrl.protocol === 'https:';
    const transport = isHttps ? https : http;
    const isLocal = config.provider === 'local';

    const opts = {
      hostname: fullUrl.hostname,
      port: fullUrl.port || (isHttps ? 443 : 80),
      path: fullUrl.pathname + fullUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: isLocal ? 30000 : 15000,
    };

    if (!isLocal && config.api_key) {
      opts.headers['Authorization'] = `Bearer ${config.api_key}`;
    }

    const t0 = Date.now();
    const hreq = transport.request(opts, (hres) => {
      let data = '';
      hres.on('data', c => data += c);
      hres.on('end', () => {
        const ms = Date.now() - t0;
        if (hres.statusCode >= 400) {
          reject(new Error(`HTTP ${hres.statusCode}: ${data.slice(0,200)}`));
        } else {
          resolve({ ok: true, ms, model: config.model });
        }
      });
    });
    hreq.on('error', e => reject(new Error(`连接失败: ${e.message}`)));
    hreq.on('timeout', () => { hreq.destroy(); reject(new Error('连接超时')); });
    hreq.write(payload);
    hreq.end();
  });
}

function sendSSE(res, data) {
  try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch(e) {}
}

async function proxyChatStream(req, res, body) {
  const cfg = loadConfig();
  if (!cfg || !cfg.base_url) {
    sendSSE(res, { type: 'error', message: '请先配置 API(Base URL / Model / API Key)' });
    sendSSE(res, { type: 'done' });
    res.end();
    return;
  }

  const baseUrl = cfg.base_url;
  let fullUrl;
  try {
    fullUrl = new URL(baseUrl);
  } catch(e) {
    sendSSE(res, { type: 'error', message: 'Base URL 格式无效: ' + e.message });
    sendSSE(res, { type: 'done' });
    res.end();
    return;
  }

  const endpoint = '/chat/completions';
  fullUrl.pathname = fullUrl.pathname.replace(/\/?$/, '') + endpoint;

  const bodyToSend = {
    model: cfg.model || 'gpt-4o',
    messages: body.messages || [],
    tools: body.tools,
    stream: true,
  };

  let payload;
  try {
    payload = JSON.stringify(bodyToSend);
  } catch(e) {
    sendSSE(res, { type: 'error', message: '请求体序列化失败' });
    sendSSE(res, { type: 'done' });
    res.end();
    return;
  }

  const isHttps = fullUrl.protocol === 'https:';
  const transport = isHttps ? https : http;
  const isLocal = cfg.provider === 'local';

  const opts = {
    hostname: fullUrl.hostname,
    port: fullUrl.port || (isHttps ? 443 : 80),
    path: fullUrl.pathname + fullUrl.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
    timeout: isLocal ? 300000 : 180000,
  };

  if (!isLocal && cfg.api_key) {
    opts.headers['Authorization'] = `Bearer ${cfg.api_key}`;
  }

  let hreq = null;
  let ended = false;

  function endStream(event) {
    if (ended) return;
    ended = true;
    if (event) sendSSE(res, event);
    sendSSE(res, { type: 'done' });
    try { res.end(); } catch(e) {}
  }

  req.on('close', () => {
    if (hreq && !ended) hreq.destroy();
  });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  try {
    hreq = transport.request(opts, (hres) => {
      const statusCode = hres.statusCode;

      if (statusCode >= 400) {
        let errData = '';
        hres.on('data', c => errData += c);
        hres.on('end', () => {
          let errMsg = `API ${statusCode}`;
          try {
            const parsed = JSON.parse(errData);
            errMsg = parsed.error?.message || parsed.error?.code || errMsg;
          } catch(e) {}
          endStream({ type: 'error', message: errMsg });
        });
        hres.on('error', () => endStream({ type: 'error', message: 'API 响应错误' }));
        return;
      }

      let buffer = '';
      const toolCalls = {};
      let reasoningContent = '';

      hres.on('data', (chunk) => {
        try {
          buffer += chunk.toString();
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            const lines = part.split('\n');
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const choice = parsed.choices && parsed.choices[0];
                if (!choice) continue;
                const delta = choice.delta || {};

                if (delta.reasoning_content) {
                  reasoningContent += delta.reasoning_content;
                  sendSSE(res, { type: 'reasoning', content: delta.reasoning_content });
                }

                if (delta.content) {
                  sendSSE(res, { type: 'text', content: delta.content });
                }

                if (delta.tool_calls) {
                  for (const tc of delta.tool_calls) {
                    const idx = tc.index;
                    if (!toolCalls[idx]) {
                      toolCalls[idx] = { id: tc.id || '', type: 'function', function: { name: '', arguments: '' } };
                    }
                    if (tc.id) toolCalls[idx].id = tc.id;
                    if (tc.function) {
                      if (tc.function.name) toolCalls[idx].function.name += tc.function.name;
                      if (tc.function.arguments) toolCalls[idx].function.arguments += tc.function.arguments;
                    }
                  }
                }
              } catch(e) { /* skip malformed chunk */ }
            }
          }
        } catch(e) { /* buffer parse error, ignore */ }
      });

      hres.on('end', () => {
        try {
          const tcArray = Object.values(toolCalls);
          if (tcArray.length > 0) {
            sendSSE(res, { type: 'tool_calls', message: { role: 'assistant', content: null, reasoning_content: reasoningContent, tool_calls: tcArray } });
          } else if (reasoningContent) {
            sendSSE(res, { type: 'reasoning_done', content: reasoningContent });
          }
        } catch(e) {}
        endStream();
      });

      hres.on('error', (e) => {
        endStream({ type: 'error', message: 'API 响应错误: ' + e.message });
      });
    });

    hreq.on('error', (e) => {
      endStream({ type: 'error', message: '连接失败: ' + e.message });
    });

    hreq.on('timeout', () => {
      hreq.destroy();
      endStream({ type: 'error', message: '请求超时' });
    });

    hreq.write(payload);
    hreq.end();
  } catch(e) {
    endStream({ type: 'error', message: '服务器内部错误: ' + e.message });
  }
}

function proxyChat(req, body) {
  return new Promise((resolve, reject) => {
    const cfg = loadConfig();
    if (!cfg.base_url) return reject(new Error('请先配置 API Base URL'));

    const baseUrl = cfg.base_url;
    const fullUrl = new URL(baseUrl);
    const endpoint = '/chat/completions';
    fullUrl.pathname = fullUrl.pathname.replace(/\/?$/, '') + endpoint;

    const bodyWithModel = { ...body, model: cfg.model || 'gpt-4o' };
    const payload = JSON.stringify(bodyWithModel);

    const isHttps = fullUrl.protocol === 'https:';
    const transport = isHttps ? https : http;
    const isLocal = cfg.provider === 'local';

    const opts = {
      hostname: fullUrl.hostname,
      port: fullUrl.port || (isHttps ? 443 : 80),
      path: fullUrl.pathname + fullUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: isLocal ? 300000 : 180000,
    };

    if (!isLocal && cfg.api_key) {
      opts.headers['Authorization'] = `Bearer ${cfg.api_key}`;
    }

    const hreq = transport.request(opts, (hres) => {
      let data = '';
      hres.on('data', c => data += c);
      hres.on('end', () => {
        if (hres.statusCode >= 400) {
          reject(new Error(`API ${hres.statusCode}: ${data.slice(0,300)}`));
        } else {
          resolve(JSON.parse(data));
        }
      });
    });
    hreq.on('error', reject);
    hreq.on('timeout', () => { hreq.destroy(); reject(new Error('Request timeout')); });
    hreq.write(payload);
    hreq.end();
  });
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
}

function midiGenerate(notes, bpm) {
  return new Promise((resolve, reject) => {
    const input = JSON.stringify({ notes, bpm });
    const script = path.join(__dir, 'midi_gen.py');
    const py = spawn('python', [script], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    const chunks = [];
    let errData = '';

    py.stdout.on('data', c => chunks.push(c));
    py.stderr.on('data', c => errData += c.toString());
    py.on('error', e => reject(new Error('无法启动 Python: ' + e.message)));
    py.on('close', code => {
      if (code !== 0) {
        reject(new Error('MIDI 生成失败 (exit ' + code + '): ' + errData));
      } else {
        resolve(Buffer.concat(chunks));
      }
    });

    py.stdin.write(input);
    py.stdin.end();
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204); res.end(); return;
  }

  const reqUrl = new URL(req.url, `http://localhost:${PORT}`);

  try {
    if (req.method === 'POST' && reqUrl.pathname === '/api/config') {
      const body = await readBody(req);
      const cfg = JSON.parse(body);
      if (cfg.provider === 'cloud' && !cfg.api_key) throw new Error('云端模式需要填写 API Key');
      saveConfig(cfg);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    }
    else if (req.method === 'GET' && reqUrl.pathname === '/api/config') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(loadConfig() || {}));
    }
    else if (req.method === 'POST' && reqUrl.pathname === '/api/test') {
      const body = await readBody(req);
      const cfg = JSON.parse(body);
      if (cfg.provider === 'cloud' && !cfg.api_key) throw new Error('云端模式需要填写 API Key');
      const result = await testConnect(cfg);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    }
    else if (req.method === 'POST' && reqUrl.pathname === '/api/chat') {
      const body = await readBody(req);
      const parsed = JSON.parse(body);
      if (parsed.stream) {
        await proxyChatStream(req, res, parsed);
      } else {
        const result = await proxyChat(req, parsed);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      }
    }
    else if (req.method === 'POST' && reqUrl.pathname === '/api/midi') {
      try {
        const body = await readBody(req);
        const { notes, bpm } = JSON.parse(body);
        log('info', `MIDI generating ${(notes||[]).length} notes @ ${bpm||120} BPM`);
        const data = await midiGenerate(notes || [], bpm || 120);
        log('info', `MIDI done (${data.length} bytes)`);
        res.writeHead(200, {
          'Content-Type': 'audio/midi',
          'Content-Disposition': 'attachment; filename="ai-piano-roll.mid"',
        });
        res.end(data);
      } catch(e) {
        log('error', `MIDI failed: ${e.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    }
    else if (req.method === 'GET' && reqUrl.pathname === '/api/state') {
      const cfg = loadConfig();
      const used = process.memoryUsage();
      const uptime = Math.round((Date.now() - START_TIME) / 1000);
      const mins = Math.floor(uptime / 60), secs = uptime % 60;

      let midiStatus = 'unknown';
      try {
        const { spawn } = await import('node:child_process');
        const check = spawn('python', ['-c', 'import struct'], { stdio: 'pipe', windowsHide: true });
        await new Promise((resolve, reject) => { check.on('close', code => code === 0 ? resolve() : reject()); });
        midiStatus = 'ok';
      } catch { midiStatus = 'error'; }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        server: {
          status: 'running',
          uptime: `${mins}m ${secs}s`,
          started: new Date(START_TIME).toISOString(),
          port: PORT,
          node: process.version,
          platform: process.platform,
          arch: process.arch,
        },
        memory: {
          rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
        },
        midi: {
          status: midiStatus,
          generator: 'midi_gen.py (Python)',
        },
        config: {
          configured: !!cfg,
          provider: cfg?.provider || 'none',
          model: cfg?.model || 'none',
        },
        logs: LOGS.length,
      }));
    }
    else if (req.method === 'GET' && reqUrl.pathname === '/api/terminal') {
      const limit = parseInt(reqUrl.searchParams.get('n') || '100');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(LOGS.slice(-limit)));
    }
    else if (req.method === 'GET' && reqUrl.pathname === '/api/api') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        endpoints: [
          { method: 'POST', path: '/api/chat',    desc: 'AI 聊天（支持 stream）', stream: true },
          { method: 'POST', path: '/api/midi',    desc: '生成并下载 MIDI 文件', body: '{ notes, bpm }' },
          { method: 'POST', path: '/api/config',  desc: '保存 API 配置', body: '{ provider, base_url, api_key, model }' },
          { method: 'GET',  path: '/api/config',  desc: '读取当前配置' },
          { method: 'POST', path: '/api/test',    desc: '测试 API 连接', body: '{ provider, base_url, api_key, model }' },
          { method: 'GET',  path: '/api/techniques', desc: '获取音乐知识库 (MD)' },
          { method: 'GET',  path: '/api/state',   desc: '服务运行状态' },
          { method: 'GET',  path: '/api/terminal', desc: '服务器运行日志 (?n=条数)' },
          { method: 'GET',  path: '/api/api',     desc: 'API 接口列表' },
          { method: 'GET',  path: '/vocal/',      desc: '音色文件列表 / 音频文件' },
          { method: 'GET',  path: '/',            desc: '静态文件服务 (public/)' },
        ],
      }));
    }
    else if (req.method === 'GET' && reqUrl.pathname === '/api/techniques') {
      const techFile = path.join(__dir, 'prompts', 'techniques.md');
      try {
        const content = fs.readFileSync(techFile, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(content);
      } catch(e) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Techniques file not found' }));
      }
    }
    else if (reqUrl.pathname.startsWith('/vocal/')) {
      const fileName = path.basename(reqUrl.pathname);
      const f = path.join(VOCAL, fileName);
      const stat = fs.statSync(f);
      if (stat.isDirectory()) {
        const AUDIO_EXTS = ['.wav', '.mp3', '.ogg', '.m4a', '.aac', '.flac'];
        const files = fs.readdirSync(f).filter(x => {
          const ext = path.extname(x).toLowerCase();
          return AUDIO_EXTS.includes(ext);
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ files }));
      } else {
        serveFile(res, f);
      }
    }
    else {
      let filePath = path.join(PUBLIC, reqUrl.pathname === '/' ? 'index.html' : reqUrl.pathname);
      serveFile(res, filePath);
    }
  } catch (e) {
    log('error', `${req.method} ${reqUrl.pathname} → ${e.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e.message }));
  }
});

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => data += c);
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

server.listen(PORT, () => {
  log('info', `Server started on port ${PORT}`);
  console.log(`\n  AI Piano Roll running → http://localhost:${PORT}\n`);
});
