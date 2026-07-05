// config.js 로 복사한 뒤 OpenAI API 키를 입력하세요. (config.js 는 git에 올리지 마세요)
// 챗봇 & 이미지 생성봇 공통 사용
window.CHATBOT_CONFIG = {
  apiKey: "sk-your-openai-api-key-here",
  model: "gpt-4o-mini",
  imageModel: "dall-e-3",
  proxyUrl: "" // CORS 오류 시: "http://localhost:3001/api/chat" (이미지 API 자동 연동)
};
