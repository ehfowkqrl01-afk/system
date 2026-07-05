(function () {
  "use strict";

  var OPENAI_URL = "https://api.openai.com/v1/chat/completions";
  var api = window.StarLogisAPI;

  var chatbot = document.getElementById("chatbot");
  var chatbotToggle = document.getElementById("chatbotToggle");
  var chatbotPanel = document.getElementById("chatbotPanel");
  var chatbotSetup = document.getElementById("chatbotSetup");
  var chatbotBody = document.getElementById("chatbotBody");
  var chatbotMessages = document.getElementById("chatbotMessages");
  var chatbotForm = document.getElementById("chatbotForm");
  var chatbotInput = document.getElementById("chatbotInput");
  var chatbotSend = document.getElementById("chatbotSend");
  var chatbotApiKey = document.getElementById("chatbotApiKey");
  var chatbotModel = document.getElementById("chatbotModel");
  var chatbotProxyUrl = document.getElementById("chatbotProxyUrl");
  var chatbotSaveKey = document.getElementById("chatbotSaveKey");
  var chatbotSettingsBtn = document.getElementById("chatbotSettingsBtn");
  var chatbotSuggestions = document.getElementById("chatbotSuggestions");

  if (!chatbot || !chatbotToggle || !api) return;

  var config = api.loadConfig();
  var messages = [];
  var isLoading = false;

  var systemPrompt =
    "당신은 'STAR Logis' 시스템 에어컨 공간 설계·설치 전문 상담 AI입니다. " +
    "아래 서비스 정보만 바탕으로 친절하고 간결하게 한국어로 답변하세요. " +
    "확실하지 않은 가격·일정은 '현장 실측 후 안내'라고 답하고, 추측하지 마세요.\n\n" +
    "서비스:\n" +
    "- 공간 설계 & 용량 산출 (현장 실측, 3D 배치도, 견적서)\n" +
    "- 전문 설치 시공 (매립·천장형, 덕트·라인히든, 시운전)\n" +
    "- 유지보수 & A/S (정기점검, 필터·세척, 24h 긴급출동)\n\n" +
    "추천 공간: 아파트, 오피스텔, 사무실, 카페·레스토랑, 학원·병원, 상가\n\n" +
    "진행 과정: 무료 상담·실측 → 설계·견적 → 계약 → 시공 → 인수·사후관리\n" +
    "가정 2~3대: 1~2일, 상업 공간: 3~7일\n" +
    "견적·실측 상담 무료, 시공 품질 보증 2년\n" +
    "연락: 010-5257-1534, 평일 09:00–18:00 (토 09:00–13:00), 서비스 지역: 대구 · 경북 · 그외 지역 협의";

  function loadConfig() {
    return api.loadConfig();
  }

  function saveConfig() {
    config = api.saveConfig({
      apiKey: chatbotApiKey.value.trim(),
      model: chatbotModel.value,
      proxyUrl: chatbotProxyUrl.value.trim()
    });
    showChatView();
    appendMessage(
      "assistant",
      "안녕하세요! STAR Logis AI 상담입니다. ❄️\n" +
        "시스템 에어컨 설계, 설치, 견적, A/S에 대해 무엇이든 물어보세요."
    );
  }

  function hasValidConfig() {
    return api.hasValidConfig(config);
  }

  function closeImagegenPanel() {
    var imagegenPanel = document.getElementById("imagegenPanel");
    var imagegenToggle = document.getElementById("imagegenToggle");
    if (!imagegenPanel || !imagegenPanel.classList.contains("open")) return;
    imagegenPanel.classList.remove("open");
    if (imagegenToggle) {
      imagegenToggle.classList.remove("open");
      imagegenToggle.setAttribute("aria-expanded", "false");
    }
    imagegenPanel.setAttribute("aria-hidden", "true");
  }

  function showSetupView() {
    chatbotSetup.hidden = false;
    chatbotBody.hidden = true;
    chatbotApiKey.value = config.apiKey || "";
    chatbotModel.value = config.model || "gpt-4o-mini";
    chatbotProxyUrl.value = config.proxyUrl || "";
  }

  function showChatView() {
    chatbotSetup.hidden = true;
    chatbotBody.hidden = false;
  }

  function togglePanel(forceOpen) {
    var isOpen = typeof forceOpen === "boolean" ? forceOpen : !chatbotPanel.classList.contains("open");
    chatbotPanel.classList.toggle("open", isOpen);
    chatbotToggle.classList.toggle("open", isOpen);
    chatbotToggle.setAttribute("aria-expanded", String(isOpen));
    chatbotPanel.setAttribute("aria-hidden", String(!isOpen));

    if (isOpen) {
      closeImagegenPanel();
      if (hasValidConfig()) {
        showChatView();
        if (messages.length === 0) {
          appendMessage(
            "assistant",
            "안녕하세요! STAR Logis AI 상담입니다. ❄️\n" +
              "시스템 에어컨 설계, 설치, 견적, A/S에 대해 무엇이든 물어보세요."
          );
        }
        chatbotInput.focus();
      } else {
        showSetupView();
        chatbotApiKey.focus();
      }
    }
  }

  function appendMessage(role, text) {
    messages.push({ role: role, content: text });

    var el = document.createElement("div");
    el.className = "chatbot-msg chatbot-msg--" + role;
    el.textContent = text;
    chatbotMessages.appendChild(el);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  function appendTyping() {
    var el = document.createElement("div");
    el.className = "chatbot-msg chatbot-msg--assistant chatbot-msg--typing";
    el.id = "chatbotTyping";
    el.innerHTML = "<span></span><span></span><span></span>";
    chatbotMessages.appendChild(el);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  function removeTyping() {
    var typing = document.getElementById("chatbotTyping");
    if (typing) typing.remove();
  }

  function setLoading(state) {
    isLoading = state;
    chatbotSend.disabled = state;
    chatbotInput.disabled = state;
    chatbotSuggestions.querySelectorAll(".chatbot-chip").forEach(function (chip) {
      chip.disabled = state;
    });
  }

  async function sendMessage(text) {
    var trimmed = text.trim();
    if (!trimmed || isLoading) return;

    if (!hasValidConfig()) {
      showSetupView();
      return;
    }

    appendMessage("user", trimmed);
    chatbotInput.value = "";
    chatbotInput.style.height = "auto";
    setLoading(true);
    appendTyping();

    var apiMessages = [{ role: "system", content: systemPrompt }]
      .concat(messages.slice(0, -1))
      .concat([{ role: "user", content: trimmed }]);

    try {
      var reply = await callOpenAI(apiMessages);
      removeTyping();
      appendMessage("assistant", reply);
    } catch (err) {
      removeTyping();
      appendMessage("assistant", "⚠️ " + err.message);
    } finally {
      setLoading(false);
      chatbotInput.focus();
    }
  }

  async function callOpenAI(apiMessages) {
    var payload = {
      model: config.model,
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 600
    };

    var chatProxyUrl = api.getChatProxyUrl ? api.getChatProxyUrl(config) : config.proxyUrl;

    if (chatProxyUrl) {
      var proxyRes = await fetch(chatProxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.assign({ apiKey: config.apiKey }, payload))
      });

      var proxyData = await proxyRes.json().catch(function () { return null; });

      if (!proxyRes.ok) {
        throw new Error(
          api.parseApiError
            ? api.parseApiError(proxyData, "프록시 서버 오류 (" + proxyRes.status + ")")
            : "프록시 서버 오류 (" + proxyRes.status + ")"
        );
      }

      return extractReply(proxyData);
    }

    var res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + config.apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      var errData = await res.json().catch(function () { return {}; });
      var msg = (errData.error && errData.error.message) || "API 요청 실패 (" + res.status + ")";
      if (res.status === 401) msg = "API 키가 올바르지 않습니다. 설정에서 다시 입력해 주세요.";
      if (res.status === 429) msg = "API 사용량 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.";
      throw new Error(msg);
    }

    return extractReply(await res.json());
  }

  function extractReply(data) {
    var content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) throw new Error("응답을 받지 못했습니다.");
    return content.trim();
  }

  chatbotToggle.addEventListener("click", function () {
    togglePanel();
  });

  chatbotSettingsBtn.addEventListener("click", showSetupView);

  chatbotSaveKey.addEventListener("click", function () {
    if (!chatbotApiKey.value.trim()) {
      chatbotApiKey.focus();
      return;
    }
    saveConfig();
  });

  chatbotForm.addEventListener("submit", function (e) {
    e.preventDefault();
    sendMessage(chatbotInput.value);
  });

  chatbotInput.addEventListener("input", function () {
    chatbotInput.style.height = "auto";
    chatbotInput.style.height = Math.min(chatbotInput.scrollHeight, 120) + "px";
  });

  chatbotInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      chatbotForm.requestSubmit();
    }
  });

  chatbotSuggestions.addEventListener("click", function (e) {
    var chip = e.target.closest(".chatbot-chip");
    if (!chip || chip.disabled) return;
    sendMessage(chip.dataset.prompt);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && chatbotPanel.classList.contains("open")) {
      togglePanel(false);
    }
  });

  document.addEventListener("click", function (e) {
    if (!chatbotPanel.classList.contains("open")) return;
    if (chatbot.contains(e.target)) return;
    togglePanel(false);
  });

  if (window.CHATBOT_CONFIG && window.CHATBOT_CONFIG.apiKey) {
    config = loadConfig();
  }
})();
