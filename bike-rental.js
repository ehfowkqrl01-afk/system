(function () {
  "use strict";

  const API_BASE =
    "http://www.dtro.or.kr/open_content_new/ko/OpenApi/bikelist.php";
  const CORS_PROXY = "https://api.allorigins.win/raw?url=";

  const DISTRICTS = [
    "중구",
    "동구",
    "서구",
    "남구",
    "북구",
    "수성구",
    "달서구",
    "달성군"
  ];

  const STATIONS = [
    { line: 1, code: 115, name: "설화명곡", district: "달성군" },
    { line: 1, code: 116, name: "화원", district: "달성군" },
    { line: 1, code: 117, name: "대곡", district: "달서구" },
    { line: 1, code: 118, name: "진천", district: "달서구" },
    { line: 1, code: 119, name: "월배", district: "달서구" },
    { line: 1, code: 120, name: "상인", district: "달서구" },
    { line: 1, code: 121, name: "월촌", district: "달서구" },
    { line: 1, code: 122, name: "송현", district: "달서구" },
    { line: 1, code: 123, name: "성당못", district: "서구" },
    { line: 1, code: 124, name: "대명", district: "남구" },
    { line: 1, code: 125, name: "안지랑", district: "남구" },
    { line: 1, code: 126, name: "현충로", district: "남구" },
    { line: 1, code: 127, name: "영대병원", district: "남구" },
    { line: 1, code: 128, name: "교대", district: "남구" },
    { line: 1, code: 129, name: "명덕", district: "남구" },
    { line: 1, code: 130, name: "반월당", district: "중구" },
    { line: 1, code: 131, name: "중앙로", district: "중구" },
    { line: 1, code: 132, name: "대구역", district: "중구" },
    { line: 1, code: 133, name: "칠성시장", district: "북구" },
    { line: 1, code: 134, name: "신천", district: "북구" },
    { line: 1, code: 135, name: "동대구", district: "동구" },
    { line: 1, code: 136, name: "동구청", district: "동구" },
    { line: 1, code: 137, name: "아양교", district: "동구" },
    { line: 1, code: 138, name: "동촌", district: "동구" },
    { line: 1, code: 139, name: "해안", district: "동구" },
    { line: 1, code: 140, name: "방촌", district: "동구" },
    { line: 1, code: 141, name: "용계", district: "동구" },
    { line: 1, code: 142, name: "율하", district: "동구" },
    { line: 1, code: 143, name: "신기", district: "북구" },
    { line: 1, code: 144, name: "반야월", district: "북구" },
    { line: 1, code: 145, name: "각산", district: "북구" },
    { line: 1, code: 146, name: "안심", district: "동구" },
    { line: 2, code: 216, name: "문양", district: "달성군" },
    { line: 2, code: 217, name: "다사", district: "달성군" },
    { line: 2, code: 218, name: "대실", district: "달성군" },
    { line: 2, code: 219, name: "강창", district: "달서구" },
    { line: 2, code: 220, name: "계명대", district: "달서구" },
    { line: 2, code: 221, name: "성서공단", district: "달서구" },
    { line: 2, code: 222, name: "이곡", district: "달서구" },
    { line: 2, code: 223, name: "용산", district: "달서구" },
    { line: 2, code: 224, name: "죽전", district: "달서구" },
    { line: 2, code: 225, name: "감삼", district: "달서구" },
    { line: 2, code: 226, name: "두류", district: "달서구" },
    { line: 2, code: 227, name: "내당", district: "서구" },
    { line: 2, code: 228, name: "반고개", district: "중구" },
    { line: 2, code: 229, name: "청라언덕", district: "중구" },
    { line: 2, code: 230, name: "반월당", district: "중구" },
    { line: 2, code: 231, name: "경대병원", district: "중구" },
    { line: 2, code: 232, name: "대구은행", district: "수성구" },
    { line: 2, code: 233, name: "범어", district: "수성구" },
    { line: 2, code: 234, name: "수성구청", district: "수성구" },
    { line: 2, code: 235, name: "만촌", district: "수성구" },
    { line: 2, code: 236, name: "담티", district: "수성구" },
    { line: 2, code: 237, name: "연호", district: "수성구" },
    { line: 2, code: 238, name: "대공원", district: "수성구" },
    { line: 2, code: 239, name: "고산", district: "수성구" },
    { line: 2, code: 240, name: "신매", district: "수성구" },
    { line: 2, code: 241, name: "사월", district: "수성구" }
  ];

  const header = document.getElementById("header");
  const menuToggle = document.getElementById("menuToggle");
  const nav = document.getElementById("nav");
  const districtBar = document.getElementById("districtBar");
  const districtHint = document.getElementById("districtHint");
  const bikeSummary = document.getElementById("bikeSummary");
  const sumAvailable = document.getElementById("sumAvailable");
  const sumTotal = document.getElementById("sumTotal");
  const sumUsed = document.getElementById("sumUsed");
  const sumStations = document.getElementById("sumStations");
  const bikeSearch = document.getElementById("bikeSearch");
  const bikeRefreshBtn = document.getElementById("bikeRefreshBtn");
  const bikeStatus = document.getElementById("bikeStatus");
  const bikeError = document.getElementById("bikeError");
  const bikeErrorMsg = document.getElementById("bikeErrorMsg");
  const bikeRetryBtn = document.getElementById("bikeRetryBtn");
  const bikeGrid = document.getElementById("bikeGrid");

  let currentDistrict = "";
  let stationResults = [];
  let filteredResults = [];
  let loading = false;

  function initHeader() {
    window.addEventListener("scroll", function () {
      header.classList.toggle("scrolled", window.scrollY > 40);
    });

    if (menuToggle && nav) {
      menuToggle.addEventListener("click", function () {
        const open = nav.classList.toggle("open");
        menuToggle.setAttribute("aria-expanded", String(open));
      });

      nav.querySelectorAll(".nav-link").forEach(function (link) {
        link.addEventListener("click", function () {
          nav.classList.remove("open");
          menuToggle.setAttribute("aria-expanded", "false");
        });
      });
    }
  }

  function buildDistrictButtons() {
    districtBar.innerHTML = DISTRICTS.map(function (district) {
      return (
        '<button type="button" class="bike-district-btn" data-district="' +
        district +
        '" role="tab" aria-selected="false">' +
        district +
        "</button>"
      );
    }).join("");

    districtBar.addEventListener("click", function (event) {
      const btn = event.target.closest("[data-district]");
      if (!btn || loading) return;
      selectDistrict(btn.dataset.district);
    });
  }

  function setDistrictActive(district) {
    districtBar.querySelectorAll("[data-district]").forEach(function (btn) {
      const active = btn.dataset.district === district;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", String(active));
    });
  }

  function showLoading(show) {
    loading = show;
    bikeStatus.hidden = !show;
    bikeRefreshBtn.disabled = show;
    if (show) {
      bikeError.hidden = true;
      bikeGrid.innerHTML = "";
      bikeSummary.hidden = true;
    }
  }

  function showError(message) {
    bikeError.hidden = false;
    bikeErrorMsg.textContent = message;
    bikeGrid.innerHTML = "";
    bikeSummary.hidden = true;
  }

  function parseBikeXml(xmlText) {
    const doc = new DOMParser().parseFromString(xmlText, "text/xml");
    if (doc.querySelector("parsererror")) {
      throw new Error("응답 데이터 형식이 올바르지 않습니다.");
    }

    function getTag(tag) {
      const el = doc.getElementsByTagName(tag)[0];
      return el ? el.textContent.trim() : "";
    }

    function toNum(value) {
      const n = parseInt(value, 10);
      return isNaN(n) ? 0 : n;
    }

    return {
      lineNum: getTag("LINE_NUM"),
      stdCode: getTag("STD_CODE"),
      stdName: getTag("STD_NAME"),
      totalCnt: toNum(getTag("TOTAL_CNT")),
      trblCnt: toNum(getTag("TRBL_CNT")),
      usedCnt: toNum(getTag("USED_CNT")),
      dayRentCnt: toNum(getTag("DAYRENT_CNT")),
      avlCnt: toNum(getTag("AVL_CNT")),
      stdTel: getTag("STD_TEL")
    };
  }

  function buildApiUrl(line, code) {
    return (
      API_BASE +
      "?LINE_NUM=" +
      encodeURIComponent(line) +
      "&STD_CODE=" +
      encodeURIComponent(code)
    );
  }

  function useLocalProxy() {
    return (
      location.hostname === "localhost" &&
      location.port === "3001"
    );
  }

  async function fetchBikeData(line, code) {
    const apiUrl = buildApiUrl(line, code);
    const urls = [];

    if (useLocalProxy()) {
      urls.push("/api/bike?line=" + line + "&code=" + code);
    }
    urls.push(CORS_PROXY + encodeURIComponent(apiUrl));

    let lastError = null;
    for (let i = 0; i < urls.length; i += 1) {
      try {
        const res = await fetch(urls[i]);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const text = await res.text();
        if (text.indexOf("<html") !== -1 && text.indexOf("sabFingerPrint") !== -1) {
          throw new Error("API 접근이 차단되었습니다.");
        }
        return parseBikeXml(text);
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error("데이터를 불러오지 못했습니다.");
  }

  async function loadDistrict(district) {
    showLoading(true);
    bikeSearch.value = "";

    const targets = STATIONS.filter(function (s) {
      return s.district === district;
    });

    if (!targets.length) {
      showLoading(false);
      showError("선택한 구·군에 등록된 역 정보가 없습니다.");
      return;
    }

    try {
      const results = await Promise.all(
        targets.map(async function (station) {
          try {
            const data = await fetchBikeData(station.line, station.code);
            return {
              station: station,
              data: data,
              error: null
            };
          } catch (err) {
            return {
              station: station,
              data: null,
              error: err.message
            };
          }
        })
      );

      stationResults = results
        .filter(function (r) {
          return r.data && r.data.totalCnt > 0;
        })
        .sort(function (a, b) {
          return b.data.avlCnt - a.data.avlCnt;
        });

      filteredResults = stationResults.slice();

      const activeCount = stationResults.length;
      const totalBikes = stationResults.reduce(function (sum, r) {
        return sum + r.data.totalCnt;
      }, 0);
      const availableBikes = stationResults.reduce(function (sum, r) {
        return sum + r.data.avlCnt;
      }, 0);
      const usedBikes = stationResults.reduce(function (sum, r) {
        return sum + r.data.usedCnt;
      }, 0);

      districtHint.textContent =
        district +
        " · 조회 역 " +
        targets.length +
        "곳 중 자전거 운영 역 " +
        activeCount +
        "곳";

      sumAvailable.textContent = availableBikes;
      sumTotal.textContent = totalBikes;
      sumUsed.textContent = usedBikes;
      sumStations.textContent = activeCount;
      bikeSummary.hidden = false;

      renderList();
    } catch (err) {
      showError(
        err.message ||
          "자전거 대여 현황을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
      );
    } finally {
      showLoading(false);
    }
  }

  function selectDistrict(district) {
    currentDistrict = district;
    setDistrictActive(district);
    loadDistrict(district);
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function availabilityClass(available, total) {
    if (total === 0) return "bike-card--none";
    if (available === 0) return "bike-card--empty";
    if (available <= 2) return "bike-card--low";
    return "bike-card--ok";
  }

  function applySearch() {
    const q = bikeSearch.value.trim().toLowerCase();
    if (!q) {
      filteredResults = stationResults.slice();
    } else {
      filteredResults = stationResults.filter(function (item) {
        const name = (item.data.stdName || item.station.name).toLowerCase();
        return name.indexOf(q) !== -1;
      });
    }
    renderList();
  }

  function renderList() {
    bikeError.hidden = true;

    if (!filteredResults.length) {
      bikeGrid.innerHTML =
        '<p class="bike-empty">표시할 자전거 대여 역이 없습니다. 다른 구·군을 선택하거나 검색어를 변경해 보세요.</p>';
      return;
    }

    bikeGrid.innerHTML = filteredResults
      .map(function (item) {
        const s = item.station;
        const d = item.data;
        const name = escapeHtml(d.stdName || s.name);
        const cls = availabilityClass(d.avlCnt, d.totalCnt);
        const tel = d.stdTel ? "053-" + escapeHtml(d.stdTel) : "";

        return (
          '<article class="bike-card ' +
          cls +
          '">' +
          '<div class="bike-card-head">' +
          '<span class="bike-line-badge">' +
          s.line +
          "호선</span>" +
          "<h3>" +
          name +
          "역</h3>" +
          "</div>" +
          '<div class="bike-card-stats">' +
          '<div class="bike-stat bike-stat--main">' +
          '<span class="bike-stat-label">대여 가능</span>' +
          '<strong class="bike-stat-value">' +
          d.avlCnt +
          "</strong>" +
          '<span class="bike-stat-unit">대</span>' +
          "</div>" +
          '<div class="bike-stat">' +
          '<span class="bike-stat-label">총 보유</span>' +
          "<strong>" +
          d.totalCnt +
          "</strong>" +
          "</div>" +
          '<div class="bike-stat">' +
          '<span class="bike-stat-label">대여 중</span>' +
          "<strong>" +
          d.usedCnt +
          "</strong>" +
          "</div>" +
          '<div class="bike-stat">' +
          '<span class="bike-stat-label">수리</span>' +
          "<strong>" +
          d.trblCnt +
          "</strong>" +
          "</div>" +
          "</div>" +
          (tel
            ? '<p class="bike-card-tel">문의 ' + tel + "</p>"
            : "") +
          "</article>"
        );
      })
      .join("");
  }

  function bindEvents() {
    bikeSearch.addEventListener("input", applySearch);

    bikeRefreshBtn.addEventListener("click", function () {
      if (currentDistrict && !loading) loadDistrict(currentDistrict);
    });

    bikeRetryBtn.addEventListener("click", function () {
      if (currentDistrict) loadDistrict(currentDistrict);
    });
  }

  function initFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const district = params.get("district");
    if (district && DISTRICTS.indexOf(district) !== -1) {
      selectDistrict(district);
      return;
    }
    selectDistrict("중구");
  }

  initHeader();
  buildDistrictButtons();
  bindEvents();
  initFromQuery();
})();
