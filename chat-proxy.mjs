/**
 * 로컬 CORS 프록시 (선택)
 * 사용법: node chat-proxy.mjs
 * 챗봇 설정 > 프록시 URL: http://localhost:3001/api/chat
 */
import http from "http";
import { readFileSync, existsSync } from "fs";
import { join, extname } from "path";
import { fileURLToPath } from "url";

const PORT = 3001;
const ROOT = fileURLToPath(new URL(".", import.meta.url));
const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json"
};

function serveStatic(req, res) {
  let path = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const file = join(ROOT, path);
  if (!existsSync(file)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const ext = extname(file);
  res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
  res.end(readFileSync(file));
}

function parseUpstreamError(text) {
  try {
    const data = JSON.parse(text);
    if (typeof data.error === "string") return data.error;
    if (data.error && data.error.message) return data.error.message;
    if (data.message) return data.message;
  } catch (_) {
    /* ignore */
  }
  return text || "upstream request failed";
}

function buildImageBody({ model, prompt, n, size, quality, response_format }) {
  const body = { model, prompt, n, size };
  if (quality) body.quality = quality;
  if (response_format && !/^gpt-image/i.test(model || "")) {
    body.response_format = response_format;
  }
  return body;
}

async function imageBufferFromResponse(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (_) {
    return null;
  }

  const item = data.data && data.data[0];
  if (!item) return null;

  if (item.b64_json) {
    return Buffer.from(item.b64_json, "base64");
  }

  if (item.url) {
    const imgRes = await fetch(item.url);
    if (!imgRes.ok) return null;
    return Buffer.from(await imgRes.arrayBuffer());
  }

  return null;
}

async function normalizeImageResponse(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (_) {
    return text;
  }

  const item = data.data && data.data[0];
  if (!item || item.b64_json || !item.url) {
    return text;
  }

  try {
    const imgRes = await fetch(item.url);
    if (!imgRes.ok) return text;
    item.b64_json = Buffer.from(await imgRes.arrayBuffer()).toString("base64");
    delete item.url;
    return JSON.stringify(data);
  } catch (_) {
    return text;
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/api/chat" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", async () => {
      try {
        const { apiKey, model, messages, temperature, max_tokens } = JSON.parse(body);
        const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + apiKey
          },
          body: JSON.stringify({ model, messages, temperature, max_tokens })
        });
        const data = await upstream.text();
        if (!upstream.ok) {
          res.writeHead(upstream.status, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: parseUpstreamError(data) }));
          return;
        }
        res.writeHead(upstream.status, { "Content-Type": "application/json" });
        res.end(data);
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (req.url === "/api/images" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", async () => {
      try {
        const { apiKey, model, prompt, n, size, quality, response_format, returnBinary } = JSON.parse(body);
        if (!apiKey) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "apiKey is required" }));
          return;
        }
        if (!prompt) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "prompt is required" }));
          return;
        }

        const upstream = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + apiKey
          },
          body: JSON.stringify(buildImageBody({
            model: model || "dall-e-3",
            prompt,
            n: n || 1,
            size: size || "1024x1024",
            quality,
            response_format: response_format || "b64_json"
          }))
        });
        let data = await upstream.text();
        if (!upstream.ok) {
          res.writeHead(upstream.status, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: parseUpstreamError(data) }));
          return;
        }

        if (returnBinary) {
          const buffer = await imageBufferFromResponse(data);
          if (!buffer) {
            res.writeHead(502, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "이미지 데이터를 변환하지 못했습니다." }));
            return;
          }
          res.writeHead(200, {
            "Content-Type": "image/png",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store"
          });
          res.end(buffer);
          return;
        }

        data = await normalizeImageResponse(data);
        res.writeHead(upstream.status, { "Content-Type": "application/json" });
        res.end(data);
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (req.url.startsWith("/api/images/embed") && req.method === "GET") {
    try {
      const url = new URL(req.url, "http://localhost");
      const imageUrl = url.searchParams.get("url");
      if (!imageUrl) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "url is required" }));
        return;
      }
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) {
        res.writeHead(imgRes.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "failed to fetch image" }));
        return;
      }
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ b64_json: buffer.toString("base64") }));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (req.url.startsWith("/api/bike") && req.method === "GET") {
    try {
      const url = new URL(req.url, "http://localhost");
      const line = url.searchParams.get("line");
      const code = url.searchParams.get("code");
      if (!line || !code) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("line and code required");
        return;
      }
      const upstreamUrl =
        "http://www.dtro.or.kr/open_content_new/ko/OpenApi/bikelist.php?LINE_NUM=" +
        encodeURIComponent(line) +
        "&STD_CODE=" +
        encodeURIComponent(code);
      const upstream = await fetch(upstreamUrl);
      const data = await upstream.text();
      res.writeHead(upstream.status, {
        "Content-Type": "application/xml; charset=utf-8"
      });
      res.end(data);
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(err.message);
    }
    return;
  }

  if (req.method === "GET") {
    serveStatic(req, res);
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log("Chat proxy: http://localhost:" + PORT);
  console.log("Chat API:   http://localhost:" + PORT + "/api/chat");
  console.log("Image API:  http://localhost:" + PORT + "/api/images");
});
