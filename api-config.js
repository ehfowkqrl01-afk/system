(function () {
  "use strict";

  var STORAGE_KEY = "starlogis-chatbot-config";

  function loadConfig() {
    var saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (e) {
      saved = {};
    }

    var external = window.CHATBOT_CONFIG || {};
    return {
      apiKey: external.apiKey || saved.apiKey || "",
      model: external.model || saved.model || "gpt-4o-mini",
      proxyUrl: external.proxyUrl || saved.proxyUrl || "",
      imageModel: external.imageModel || saved.imageModel || "dall-e-3"
    };
  }

  function saveConfig(partial) {
    var current = loadConfig();
    var next = Object.assign({}, current, partial);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  function hasValidConfig(config) {
    config = config || loadConfig();
    return Boolean(config.apiKey && config.apiKey.startsWith("sk-"));
  }

  function resolveLocalProxyBase() {
    if (location.protocol === "file:") return "";
    var host = location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") return "";
    if (location.port === "3001") return location.origin;
    return location.protocol + "//" + host + ":3001";
  }

  function normalizeProxyEndpoint(raw, endpoint) {
    var base = (raw || "").trim();
    if (!base) {
      base = resolveLocalProxyBase();
      if (!base) return "";
      return base.replace(/\/$/, "") + endpoint;
    }

    if (/\/api\/images\/?$/i.test(base)) {
      return endpoint === "/api/images"
        ? base.replace(/\/$/, "")
        : base.replace(/\/api\/images\/?$/i, "/api/chat");
    }

    if (/\/api\/chat\/?$/i.test(base)) {
      return endpoint === "/api/chat"
        ? base.replace(/\/$/, "")
        : base.replace(/\/api\/chat\/?$/i, "/api/images");
    }

    return base.replace(/\/$/, "") + endpoint;
  }

  function getChatProxyUrl(config) {
    config = config || loadConfig();
    return normalizeProxyEndpoint(config.proxyUrl, "/api/chat");
  }

  function getImageProxyUrl(config) {
    config = config || loadConfig();
    return normalizeProxyEndpoint(config.proxyUrl, "/api/images");
  }

  function parseApiError(data, fallback) {
    if (!data) return fallback;
    if (typeof data === "string") return data;
    if (typeof data.error === "string") return data.error;
    if (data.error && data.error.message) return data.error.message;
    if (data.message) return data.message;
    return fallback;
  }

  window.StarLogisAPI = {
    STORAGE_KEY: STORAGE_KEY,
    loadConfig: loadConfig,
    saveConfig: saveConfig,
    hasValidConfig: hasValidConfig,
    getChatProxyUrl: getChatProxyUrl,
    getImageProxyUrl: getImageProxyUrl,
    parseApiError: parseApiError
  };
})();
