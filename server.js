import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const CFG_FILE = path.join(__dir, '.ai_piano_roll_cfg.json');
const PUBLIC = path.join(__dir, 'public');
const VOCAL = path.join(__dir, 'vocal');
const PORT = 8765;

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
  console.log(`\n  AI Piano Roll running → http://localhost:${PORT}\n`);
});
