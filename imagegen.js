(function () {
  "use strict";

  var api = window.StarLogisAPI;
  if (!api) return;

  var IDOL_STYLE_WRAPPER =
    "Korean female idol aesthetic, youthful and stylish, photorealistic, high quality, soft natural lighting. Scene: ";

  var blobUrls = [];

  var imagegenToggle = document.getElementById("imagegenToggle");
  var imagegenPanel = document.getElementById("imagegenPanel");
  var imagegenForm = document.getElementById("imagegenForm");
  var imagegenPrompt = document.getElementById("imagegenPrompt");
  var imagegenSize = document.getElementById("imagegenSize");
  var imagegenSubmit = document.getElementById("imagegenSubmit");
  var imagegenStatus = document.getElementById("imagegenStatus");
  var imagegenGallery = document.getElementById("imagegenGallery");
  var imagegenNoKey = document.getElementById("imagegenNoKey");
  var imagegenBody = document.getElementById("imagegenBody");
  var imagegenOpenChat = document.getElementById("imagegenOpenChat");

  if (!imagegenToggle || !imagegenPanel || !imagegenForm) return;

  function setStatus(text, type) {
    if (!imagegenStatus) return;
    imagegenStatus.textContent = text || "";
    imagegenStatus.className = "imagegen-status" + (type ? " " + type : "");
  }

  function getConfig() {
    return api.loadConfig();
  }

  function hasValidConfig(config) {
    return api.hasValidConfig(config || getConfig());
  }

  function updateKeyView() {
    var ok = hasValidConfig();
    if (imagegenNoKey) imagegenNoKey.hidden = ok;
    if (imagegenBody) imagegenBody.hidden = !ok;
  }

  function buildImageBody(config, prompt, options) {
    options = options || {};
    var model = options.model || config.imageModel || "dall-e-3";
    var body = {
      model: model,
      prompt: prompt,
      n: 1,
      size: options.size || (imagegenSize && imagegenSize.value) || "1024x1024",
      response_format: "b64_json"
    };
    if (model.indexOf("dall-e-3") !== -1) {
      body.quality = options.quality || "standard";
    }
    return body;
  }

  function registerBlobUrl(url) {
    if (url && url.indexOf("blob:") === 0) {
      blobUrls.push(url);
    }
    return url;
  }

  function base64ToObjectUrl(b64, mime) {
    var binary = atob(b64);
    var len = binary.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return registerBlobUrl(URL.createObjectURL(new Blob([bytes], { type: mime || "image/png" })));
  }

  function extractImageSrc(data) {
    if (!data || !data.data || !data.data[0]) {
      throw new Error("이미지 데이터를 받지 못했습니다.");
    }
    var item = data.data[0];
    if (item.b64_json) {
      return base64ToObjectUrl(item.b64_json, "image/png");
    }
    if (item.url) {
      return item.url;
    }
    throw new Error("이미지 URL 또는 데이터가 없습니다.");
  }

  async function fetchImageViaProxy(proxyUrl, config, payload) {
    var res = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        Object.assign(
          {
            apiKey: config.apiKey,
            returnBinary: true
          },
          payload
        )
      )
    });

    if (!res.ok) {
      var errText = await res.text();
      var errMsg = "이미지 생성에 실패했습니다.";
      try {
        var errJson = JSON.parse(errText);
        errMsg = api.parseApiError(errJson, errMsg);
      } catch (_) {
        if (errText) errMsg = errText.slice(0, 200);
      }
      throw new Error(errMsg);
    }

    var contentType = res.headers.get("content-type") || "";
    if (contentType.indexOf("image/") !== -1) {
      var blob = await res.blob();
      return registerBlobUrl(URL.createObjectURL(blob));
    }

    var proxyData = await res.json().catch(function () {
      return null;
    });
    if (!proxyData) {
      throw new Error("프록시 응답을 해석하지 못했습니다.");
    }
    return extractImageSrc(proxyData);
  }

  async function fetchImageDirect(config, payload) {
    var res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + config.apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      var errData = await res.json().catch(function () {
        return {};
      });
      throw new Error(api.parseApiError(errData, "이미지 생성에 실패했습니다."));
    }

    var data = await res.json();
    return extractImageSrc(data);
  }

  async function preloadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        resolve(src);
      };
      img.onerror = function () {
        reject(new Error("생성된 이미지를 화면에 표시하지 못했습니다."));
      };
      img.src = src;
    });
  }

  async function generateImage(prompt) {
    var config = getConfig();
    if (!hasValidConfig(config)) {
      throw new Error("API 키가 설정되지 않았습니다. 챗봇 설정에서 OpenAI API 키를 입력해 주세요.");
    }

    var fullPrompt = IDOL_STYLE_WRAPPER + prompt;
    var proxyUrl = api.getImageProxyUrl(config);
    var payload = buildImageBody(config, fullPrompt);

    if (proxyUrl) {
      try {
        return await fetchImageViaProxy(proxyUrl, config, payload);
      } catch (proxyErr) {
        throw new Error(
          proxyErr.message +
            " (프록시 확인: node chat-proxy.mjs 실행 후 프록시 URL을 http://localhost:3001/api/chat 로 설정)"
        );
      }
    }

    if (window.location.protocol === "file:") {
      throw new Error(
        "file:// 로는 이미지 API를 호출할 수 없습니다. node chat-proxy.mjs 실행 후 http://localhost:3001 로 접속하세요."
      );
    }

    try {
      return await fetchImageDirect(config, payload);
    } catch (directErr) {
      var fallbackPayload = buildImageBody(config, fullPrompt, { model: "dall-e-2", size: "1024x1024" });
      try {
        return await fetchImageDirect(config, fallbackPayload);
      } catch (_) {
        throw directErr;
      }
    }
  }

  function addImageCard(imageUrl, promptText) {
    var card = document.createElement("figure");
    card.className = "imagegen-card";

    var img = document.createElement("img");
    img.src = imageUrl;
    img.alt = promptText;
    img.loading = "lazy";
    img.addEventListener("error", function () {
      setStatus("이미지 표시에 실패했습니다. 프록시 서버를 재시작한 뒤 다시 시도해 주세요.", "error");
    });

    var caption = document.createElement("figcaption");
    caption.textContent = promptText;

    var actions = document.createElement("div");
    actions.className = "imagegen-card-actions";

    var download = document.createElement("a");
    download.className = "imagegen-download";
    download.href = imageUrl;
    download.download = "starlogis-image-" + Date.now() + ".png";
    download.textContent = "다운로드";

    actions.appendChild(download);
    card.appendChild(img);
    card.appendChild(caption);
    card.appendChild(actions);

    if (imagegenGallery.firstChild) {
      imagegenGallery.insertBefore(card, imagegenGallery.firstChild);
    } else {
      imagegenGallery.appendChild(card);
    }
  }

  function closeChatbotPanel() {
    var chatbotPanel = document.getElementById("chatbotPanel");
    var chatbotToggle = document.getElementById("chatbotToggle");
    if (!chatbotPanel || !chatbotPanel.classList.contains("open")) return;
    chatbotPanel.classList.remove("open");
    if (chatbotToggle) {
      chatbotToggle.classList.remove("open");
      chatbotToggle.setAttribute("aria-expanded", "false");
    }
    chatbotPanel.setAttribute("aria-hidden", "true");
  }

  function togglePanel(forceOpen) {
    var isOpen = typeof forceOpen === "boolean" ? forceOpen : !imagegenPanel.classList.contains("open");
    imagegenPanel.classList.toggle("open", isOpen);
    imagegenToggle.classList.toggle("open", isOpen);
    imagegenToggle.setAttribute("aria-expanded", String(isOpen));
    imagegenPanel.setAttribute("aria-hidden", String(!isOpen));

    if (isOpen) {
      closeChatbotPanel();
      updateKeyView();
      if (hasValidConfig()) {
        imagegenPrompt.focus();
      }
    }
  }

  imagegenToggle.addEventListener("click", function () {
    togglePanel();
  });

  document.addEventListener("click", function (e) {
    if (!imagegenPanel.classList.contains("open")) return;
    if (imagegenPanel.contains(e.target) || imagegenToggle.contains(e.target)) return;
    togglePanel(false);
  });

  imagegenForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    var prompt = imagegenPrompt.value.trim();
    if (!prompt) return;

    if (!hasValidConfig()) {
      setStatus("API 키가 필요합니다. '챗봇 설정 열기'에서 키를 입력하세요.", "error");
      return;
    }

    imagegenSubmit.disabled = true;
    setStatus("이미지 생성 중… (약 10~30초)", "");

    try {
      var imageUrl = await generateImage(prompt);
      imageUrl = await preloadImage(imageUrl);
      addImageCard(imageUrl, prompt);
      imagegenPrompt.value = "";
      setStatus("생성 완료!", "success");
    } catch (err) {
      setStatus(err.message || "이미지 생성에 실패했습니다.", "error");
    } finally {
      imagegenSubmit.disabled = false;
    }
  });

  if (imagegenOpenChat) {
    imagegenOpenChat.addEventListener("click", function () {
      togglePanel(false);
      var chatbotToggle = document.getElementById("chatbotToggle");
      if (chatbotToggle) chatbotToggle.click();
    });
  }

  window.addEventListener("storage", function (e) {
    if (e.key === api.STORAGE_KEY) updateKeyView();
  });

  window.addEventListener("beforeunload", function () {
    blobUrls.forEach(function (url) {
      try {
        URL.revokeObjectURL(url);
      } catch (_) {}
    });
  });

  updateKeyView();
})();
