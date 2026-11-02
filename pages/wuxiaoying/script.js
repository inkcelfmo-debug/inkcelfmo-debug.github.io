const openButton = document.querySelector(".envelope-trigger");
const closeButton = document.querySelector(".close-letter");
const letterPage = document.querySelector(".letter-page");

if (
  !(openButton instanceof HTMLButtonElement) ||
  !(closeButton instanceof HTMLButtonElement) ||
  !(letterPage instanceof HTMLElement)
) {
  throw new Error("Envelope controls or letter page are missing from the document.");
}

openButton.addEventListener("click", () => {
  if (document.body.classList.contains("is-open")) return;

  window.scrollTo({ top: 0, behavior: "instant" });
  document.body.classList.add("is-open");
  openButton.setAttribute("aria-expanded", "true");
  requestAnimationFrame(() => letterPage.focus({ preventScroll: true }));
});

closeButton.addEventListener("click", () => {
  if (!document.body.classList.contains("is-open")) return;

  document.body.classList.add("is-closing");
  window.scrollTo({ top: 0, behavior: "smooth" });

  const closeDelay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 850;
  window.setTimeout(() => {
    document.body.classList.remove("is-open", "is-closing");
    openButton.setAttribute("aria-expanded", "false");
    openButton.focus({ preventScroll: true });
  }, closeDelay);
});


/* ==========================================================================
   轻量音乐播放器
   - 播放/暂停按钮同时负责开启/关闭音乐，避免出现重复开关
   - 支持选择本地音频、拖动进度、调整音量、隐藏/重新打开面板
   ========================================================================== */
(() => {
  "use strict";

  const dock = document.getElementById("music-dock");
  const showButton = document.getElementById("music-show");
  const hideButton = document.getElementById("music-hide");
  const audio = document.getElementById("music-audio");
  const fileInput = document.getElementById("music-file");
  const playButton = document.getElementById("music-play");
  const loopButton = document.getElementById("music-loop");
  const seek = document.getElementById("music-seek");
  const volume = document.getElementById("music-volume");
  const volumeValue = document.getElementById("music-volume-value");
  const trackName = document.getElementById("music-track-name");
  const status = document.getElementById("music-status");
  const currentTime = document.getElementById("music-current-time");
  const duration = document.getElementById("music-duration");

  if (!dock || !showButton || !hideButton || !audio || !fileInput ||
      !playButton || !seek || !volume) return;

  // 细线手绘蝴蝶，作为隐藏状态的唯一入口按钮。
  showButton.classList.add("spring-butterfly");
  showButton.hidden = true;
  dock.classList.remove("is-hidden");
  showButton.innerHTML = `
    <svg viewBox="0 0 120 120" role="img" aria-label="展开音乐播放器">
      <defs>
        <linearGradient id="springWing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#d7eee0"/>
          <stop offset="1" stop-color="#79ad94"/>
        </linearGradient>
        <linearGradient id="springPink" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fff0ee"/>
          <stop offset="1" stop-color="#eeb4c7"/>
        </linearGradient>
      </defs>
      <g stroke="#648b70" stroke-width="1.8" stroke-linejoin="round">
        <path d="M58 55 C43 26 18 19 13 36 C8 52 28 62 54 62 C32 67 22 85 36 94 C48 101 58 80 60 65 Z" fill="url(#springWing)"/>
        <path d="M62 55 C77 26 102 19 107 36 C112 52 92 62 66 62 C88 67 98 85 84 94 C72 101 62 80 60 65 Z" fill="url(#springPink)"/>
        <path d="M58 57 C47 43 34 37 23 39 M56 62 C42 62 32 70 31 81 M62 57 C73 43 86 37 97 39 M64 62 C78 62 88 70 89 81" fill="none" stroke="#f8f7e9" stroke-width="1.4"/>
        <path d="M59 48 Q49 32 43 31 M61 48 Q71 32 77 31" fill="none" stroke="#648b70" stroke-linecap="round"/>
        <path d="M60 48 C55 57 56 70 60 78 C64 70 65 57 60 48 Z" fill="#6f9270"/>
      </g>
      <g fill="#fff8ed" stroke="#e8b5c1" stroke-width="1">
        <circle cx="29" cy="49" r="4"/><circle cx="42" cy="78" r="3"/>
        <circle cx="91" cy="49" r="4"/><circle cx="78" cy="78" r="3"/>
      </g>
      <g fill="#f4c95f">
        <circle cx="29" cy="49" r="1.6"/><circle cx="91" cy="49" r="1.6"/>
      </g>
      <path d="M19 99 Q31 91 41 99 T63 99 T85 99 T103 99" fill="none" stroke="#9dbb91" stroke-width="1.5" stroke-linecap="round"/>
      <g fill="#f0b7c6" stroke="#fff8ed" stroke-width=".8">
        <circle cx="19" cy="99" r="3"/><circle cx="23" cy="96" r="3"/><circle cx="26" cy="100" r="3"/><circle cx="22" cy="103" r="3"/>
      </g>
      <circle cx="22" cy="100" r="1.6" fill="#e8c85e"/>
    </svg>`;
  showButton.setAttribute("aria-label", "展开音乐播放器");
  showButton.setAttribute("title", "展开音乐播放器");

  let objectUrl = null;
  let seeking = false;

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const updatePlayButton = () => {
    playButton.textContent = audio.paused ? "▶" : "Ⅱ";
    playButton.setAttribute("aria-label", audio.paused ? "播放音乐" : "暂停音乐");
    playButton.title = audio.paused ? "播放音乐" : "暂停音乐";
  };

  showButton.addEventListener("click", () => {
    dock.classList.remove("is-hidden");
    showButton.hidden = true;
    showButton.setAttribute("aria-expanded", "true");
  });

  if (loopButton) {
    loopButton.addEventListener("click", () => {
      audio.loop = !audio.loop;
      loopButton.setAttribute("aria-pressed", String(audio.loop));
      loopButton.title = audio.loop ? "关闭循环播放" : "开启循环播放";
      status.textContent = audio.loop ? "循环播放已开启" : (audio.paused ? "已暂停" : "正在播放");
    });
  }

  hideButton.addEventListener("click", () => {
    dock.classList.add("is-hidden");
    showButton.hidden = false;
    showButton.setAttribute("aria-expanded", "false");
    showButton.focus({ preventScroll: true });
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;

    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file);
    audio.src = objectUrl;
    audio.load();

    trackName.textContent = file.name.replace(/\.[^.]+$/, "") || file.name;
    seek.value = "0";
    seek.disabled = false;
    playButton.disabled = false;
    currentTime.textContent = "00:00";
    duration.textContent = "00:00";
    status.textContent = "音乐已载入，点击播放";
    updatePlayButton();
  });

  playButton.addEventListener("click", async () => {
    if (!audio.src) return;
    if (audio.paused) {
      try {
        await audio.play();
        status.textContent = "正在播放";
      } catch (error) {
        status.textContent = "无法播放，请重新选择音频文件";
      }
    } else {
      audio.pause();
      status.textContent = "已暂停";
    }
    updatePlayButton();
  });

  audio.addEventListener("loadedmetadata", () => {
    duration.textContent = formatTime(audio.duration);
    seek.max = String(Math.max(1, Math.floor(audio.duration * 10)));
    seek.value = "0";
  });

  audio.addEventListener("timeupdate", () => {
    currentTime.textContent = formatTime(audio.currentTime);
    if (!seeking && Number.isFinite(audio.duration) && audio.duration > 0) {
      seek.value = String(Math.floor(audio.currentTime * 10));
    }
  });

  seek.addEventListener("input", () => {
    seeking = true;
    currentTime.textContent = formatTime(Number(seek.value) / 10);
  });

  seek.addEventListener("change", () => {
    if (Number.isFinite(audio.duration)) {
      audio.currentTime = Math.min(Number(seek.value) / 10, audio.duration);
    }
    seeking = false;
  });

  volume.addEventListener("input", () => {
    audio.volume = Number(volume.value);
    volumeValue.textContent = `${Math.round(audio.volume * 100)}%`;
  });

  audio.addEventListener("play", updatePlayButton);
  audio.addEventListener("pause", updatePlayButton);
  audio.addEventListener("ended", () => {
    status.textContent = "播放结束";
    updatePlayButton();
  });

  audio.volume = Number(volume.value);

  // 自动读取与 index.html 放在同一文件夹的音乐文件。
  // 文件名需与此处一致；若不存在或无法解码，仍可用“选择音乐”手动载入。
  const bundledMusicPath = "./late%20night%20lover.mp3";
  audio.src = bundledMusicPath;
  audio.load();
  trackName.textContent = "late night lover";
  status.textContent = "正在载入文件夹中的音乐…";
  audio.addEventListener("canplay", () => {
    if (audio.src.endsWith("late%20night%20lover.mp3")) {
      status.textContent = audio.paused ? "音乐已载入，点击进入后自动播放" : "正在播放";
      seek.disabled = false;
      playButton.disabled = false;
    }
  }, { once: true });

  // 用户点击信封进入故事时，借用这次明确的点击手势启动背景音乐。
  // 这样兼容浏览器的自动播放限制；若浏览器仍拒绝播放，播放器依旧可手动启动。
  openButton.addEventListener("click", async () => {
    if (!audio.src || !audio.paused) return;
    try {
      await audio.play();
      status.textContent = "正在播放";
      updatePlayButton();
    } catch (error) {
      status.textContent = "点击播放器的播放键即可开启音乐";
      updatePlayButton();
    }
  }, { once: true });
  audio.addEventListener("error", () => {
    // 本地文件名/路径不匹配时，保留手动选择功能。
    if (audio.src.endsWith("late%20night%20lover.mp3")) {
      status.textContent = "未能自动读取音乐，请点击“选择音乐”";
      seek.disabled = true;
      playButton.disabled = true;
    }
  });

  window.addEventListener("beforeunload", () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  });
})();


/* 春日页面切换与点击动效（纯 JS 注入，不需要修改 HTML） */
(() => {
  "use strict";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotion.matches) return;

  const petalLayer = document.createElement("div");
  petalLayer.className = "spring-petal-layer";
  petalLayer.setAttribute("aria-hidden", "true");
  document.body.appendChild(petalLayer);

  const palette = ["#e8aeb8", "#f1c8ce", "#d7e4c9", "#b8cfad", "#f2dfb0"];
  let lastBurst = 0;
  function petalBurst(x, y, amount = 7) {
    const now = performance.now();
    if (now - lastBurst < 85) return;
    lastBurst = now;
    for (let i = 0; i < amount; i++) {
      const petal = document.createElement("i");
      petal.className = "spring-petal";
      const angle = (Math.PI * 2 * i / amount) + (Math.random() - .5) * .6;
      const distance = 24 + Math.random() * 52;
      petal.style.setProperty("--x", `${x}px`);
      petal.style.setProperty("--y", `${y}px`);
      petal.style.setProperty("--size", `${5 + Math.random() * 6}px`);
      petal.style.setProperty("--petal-color", palette[Math.floor(Math.random() * palette.length)]);
      petal.style.setProperty("--rotate", `${Math.random() * 180}deg`);
      petal.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
      petal.style.setProperty("--dy", `${Math.sin(angle) * distance + 16}px`);
      petal.style.setProperty("--duration", `${620 + Math.random() * 420}ms`);
      petal.addEventListener("animationend", () => petal.remove(), { once: true });
      petalLayer.appendChild(petal);
    }
  }

  document.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.target.closest("input, audio, .music-range, .music-dock, .music-reopen")) return;
    petalBurst(event.clientX, event.clientY, event.pointerType === "touch" ? 8 : 6);
  }, { passive: true });

  // 页面各区块滚动进入视野时轻轻浮现；不拦截滚动或翻页交互。
  const sections = document.querySelectorAll(".letter-page .section, .letter-page .band, .letter-page .style-inline, .letter-page .board-review-link");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("spring-in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
    sections.forEach((section) => observer.observe(section));
  }

  // “关于我”资料卡独立触发入场动效，确保手机端滚动到该区域时也能看见。
  const aboutSection = document.querySelector("#about");
  if (aboutSection) {
    const facts = aboutSection.querySelector(".facts");
    const startAboutMotion = () => {
      aboutSection.classList.remove("spring-in-view");
      // 重排后重新添加 class，保证动画在手机端确实播放。
      void aboutSection.offsetWidth;
      aboutSection.classList.add("spring-in-view");
    };
    if ("IntersectionObserver" in window) {
      const aboutObserver = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          startAboutMotion();
          aboutObserver.disconnect();
        }
      }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });
      aboutObserver.observe(facts || aboutSection);
    } else {
      startAboutMotion();
    }
  }

  // 点击信笺任意非交互区域翻页：右半侧下一页，左半侧上一页。
  // 仅使用顶层内容区，避免嵌套 section 导致索引重复；空白分隔处也能触发。
  const letter = document.querySelector(".letter-page");
  const pageStops = Array.from(document.querySelectorAll(
    ".letter-page > .hero, .letter-page > .section, .letter-page > .band"
  ));
  let pageTurnLock = false;

  function visiblePageIndex() {
    const marker = Math.min(window.innerHeight * 0.42, 320);
    let bestIndex = 0;
    let bestDistance = Infinity;
    pageStops.forEach((stop, index) => {
      const rect = stop.getBoundingClientRect();
      const distance = marker < rect.top ? rect.top - marker : marker > rect.bottom ? marker - rect.bottom : 0;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    return bestIndex;
  }

  if (letter && pageStops.length > 1) {
    letter.addEventListener("click", (event) => {
      if (pageTurnLock || !(event.target instanceof Element)) return;
      if (event.target.closest("a, button, input, textarea, select, audio, video, label, summary, .music-dock, .music-reopen, [role='button']")) return;
      // 当前内容区优先取点击位置所在的顶层区块，否则按视口位置判断，兼容分隔空白和装饰元素。
      let current = pageStops.findIndex((stop) => stop === event.target || stop.contains(event.target));
      if (current < 0) current = visiblePageIndex();
      const rect = letter.getBoundingClientRect();
      const clickedRight = event.clientX >= rect.left + rect.width * 0.5;
      const nextIndex = Math.max(0, Math.min(pageStops.length - 1, current + (clickedRight ? 1 : -1)));
      if (nextIndex === current) return;
      event.preventDefault();
      pageTurnLock = true;
      const target = pageStops[nextIndex];
      target.classList.remove("spring-page-turn");
      target.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
      });
      requestAnimationFrame(() => target.classList.add("spring-page-turn"));
      window.setTimeout(() => { pageTurnLock = false; }, 700);
    });
  }

  // 开信与收信时的柔和花瓣提示，原有信封逻辑保持不变。
  const openButton = document.querySelector(".envelope-trigger");
  const closeButton = document.querySelector(".close-letter");
  openButton?.addEventListener("click", () => {
    const rect = openButton.getBoundingClientRect();
    petalBurst(rect.left + rect.width / 2, rect.top + rect.height * .55, 12);
  }, { passive: true });
  closeButton?.addEventListener("click", () => {
    petalBurst(Math.min(window.innerWidth - 24, window.innerWidth * .5), Math.min(window.innerHeight - 24, window.innerHeight * .72), 9);
  }, { passive: true });
})();
