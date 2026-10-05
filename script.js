document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('motion-ready');

  // 检测是否为手机端横屏模式（可根据你的 CSS 横屏适配方案调整阈值）
  function isMobileLandscape() {
    return window.innerWidth <= 768 || window.innerHeight > window.innerWidth;
  }

  // 自定义光标跟随与点击缩放逻辑[cite: 6]
  const customCursor = document.getElementById('custom-cursor');
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;

  // 统一处理鼠标及触控坐标映射
  function handlePointerMove(clientX, clientY) {
    if (isMobileLandscape()) {
      // 针对手机横屏旋转 90 度后的坐标系转换
      mouseX = window.innerWidth - clientY;
      mouseY = clientX;
    } else {
      mouseX = clientX;
      mouseY = clientY;
    }
  }

  window.addEventListener('mousemove', (e) => {
    handlePointerMove(e.clientX, e.clientY);
  });

  // 增加触控支持，防止手机端触摸时光标及点击失效
  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  function updateCursorPos() {
    cursorX += (mouseX - cursorX) * 0.7;
    cursorY += (mouseY - cursorY) * 0.7;
    if (customCursor) {
      customCursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
    }
    requestAnimationFrame(updateCursorPos);
  }
  updateCursorPos();

  // 1. 时钟更新[cite: 6]
  const clockEl = document.getElementById('glow-clock-time');
  function updateClock() {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    if(clockEl) clockEl.textContent = `${h}:${m}:${s}`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  // 2. 音频与音效逻辑[cite: 6]
  const bgm = document.getElementById('bgm-audio');
  const sfxList = [
    document.getElementById('sfx-1'),
    document.getElementById('sfx-2'),
    document.getElementById('sfx-3'),
    document.getElementById('sfx-4'),
    document.getElementById('sfx-5')
  ];
  
  const playBtn = document.getElementById('player-play');
  const volInput = document.getElementById('player-vol');
  const playerFill = document.getElementById('player-fill');
  const playerCur = document.getElementById('player-cur');
  const playerDur = document.getElementById('player-dur');
  const player = document.getElementById('player');
  const playerHideBtn = document.getElementById('player-hide-btn');
  const playerToggler = document.getElementById('player-toggler');

  if (playerHideBtn && player && playerToggler) {
    playerHideBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      player.classList.add('is-hidden');
      playerToggler.classList.add('visible');
    });

    playerToggler.addEventListener('click', (e) => {
      e.stopPropagation();
      player.classList.remove('is-hidden');
      playerToggler.classList.remove('visible');
    });
  }

  let currentVolume = 0.35;
  if(bgm) bgm.volume = currentVolume;
  sfxList.forEach(sfx => { if(sfx) sfx.volume = currentVolume; });

  volInput.addEventListener('input', (e) => {
    currentVolume = parseFloat(e.target.value);
    if(bgm) bgm.volume = currentVolume;
    sfxList.forEach(sfx => { if(sfx) sfx.volume = currentVolume; });
  });

  // 增大点击音效：在当前音量基础上放大并确保不超过 1.0[cite: 6]
  function playRandomSfx() {
    const randomIndex = Math.floor(Math.random() * sfxList.length);
    const sfx = sfxList[randomIndex];
    if (sfx) {
      sfx.currentTime = 0;
      sfx.volume = Math.min(1.0, currentVolume * 1.8);
      sfx.play().catch(()=>{});
    }
  }

  let isPlaying = false;
  let hasUserInteracted = false;
  let isFirstPlay = true;

  function playBgmWithFadeIn() {
    if(!bgm) return;
    if (isFirstPlay) {
      bgm.volume = 0;
      bgm.play().then(() => {
        if(playBtn) playBtn.textContent = '❚❚';
        if(player) player.classList.add('is-on');
        isPlaying = true;
        
        let startTime = performance.now();
        let targetVol = currentVolume;
        function fadeStep(now) {
          let elapsed = (now - startTime) / 1000;
          if (elapsed < 5) {
            bgm.volume = Math.min(targetVol, (elapsed / 5) * targetVol);
            requestAnimationFrame(fadeStep);
          } else {
            bgm.volume = targetVol;
          }
        }
        requestAnimationFrame(fadeStep);
        isFirstPlay = false;
      }).catch(()=>{});
    } else {
      bgm.volume = currentVolume;
      bgm.play().then(() => {
        if(playBtn) playBtn.textContent = '❚❚';
        if(player) player.classList.add('is-on');
        isPlaying = true;
      }).catch(()=>{});
    }
  }

  function togglePlay() {
    if(!bgm) return;
    if(isPlaying) {
      bgm.pause();
      if(playBtn) playBtn.textContent = '▶';
      if(player) player.classList.remove('is-on');
      isPlaying = false;
    } else {
      playBgmWithFadeIn();
    }
  }
  if(playBtn) playBtn.addEventListener('click', togglePlay);

  if(bgm) {
    bgm.addEventListener('timeupdate', () => {
      if(!bgm.duration) return;
      const pct = (bgm.currentTime / bgm.duration) * 100;
      if(playerFill) playerFill.style.width = pct + '%';
      if(playerCur) playerCur.textContent = formatTime(bgm.currentTime);
      if(playerDur) playerDur.textContent = formatTime(bgm.duration);
    });
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // 3. 点击下坠粒子特效与多层散落[cite: 6]
  const clickSymbols = ['✦', '·', '✧', '◉', '·', '✦'];
  const clickColors = ['#ffffff', '#ff2a4b', '#4fa8ff', '#8fc4ff'];

  function createFallingNotes(x, y) {
    const count = Math.floor(Math.random() * 3) + 3;
    let layer = document.querySelector('.cursor-particle-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'cursor-particle-layer';
      document.body.appendChild(layer);
    }

    for (let i = 0; i < count; i++) {
      const note = document.createElement('div');
      note.className = 'falling-note-particle';
      note.innerText = clickSymbols[Math.floor(Math.random() * clickSymbols.length)];
      
      note.style.position = 'absolute';
      note.style.left = `${x}px`;
      note.style.top = `${y}px`;
      note.style.pointerEvents = 'none';
      note.style.transition = 'transform 3s cubic-bezier(0.25, 1, 0.5, 1), opacity 3s ease';
      
      const fontSize = Math.floor(Math.random() * 10) + 20;
      note.style.fontSize = `${fontSize}px`;
      
      const color = clickColors[Math.floor(Math.random() * clickColors.length)];
      note.style.color = color;
      note.style.textShadow = `0 0 12px ${color}, 0 0 24px ${color}`;

      layer.appendChild(note);

      const dx = (Math.random() - 0.5) * 160;
      const dy = Math.random() * 120 + 100;
      
      requestAnimationFrame(() => {
        note.style.transform = `translate(${dx}px, ${dy}px) scale(0.6) rotate(${Math.random() * 360}deg)`;
        note.style.opacity = '0';
      });

      setTimeout(() => {
        note.remove();
      }, 3000);
    }
  }

  const rippleCanvas = document.getElementById('ripple-canvas');
  const ctx = rippleCanvas.getContext('2d');
  function resizeCanvas() {
    rippleCanvas.width = window.innerWidth;
    rippleCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  const ripples = [];
  let lastMoveTime = 0;
  
  function triggerRipple(clientX, clientY) {
    let rx = clientX;
    let ry = clientY;
    if (isMobileLandscape()) {
      rx = window.innerWidth - clientY;
      ry = clientX;
    }

    const trailColors = ['255, 255, 255', '255, 42, 75', '79, 168, 255'];
    const chosenColor = trailColors[Math.floor(Math.random() * trailColors.length)];
    ripples.push({
      x: rx,
      y: ry,
      radius: 2,
      maxRadius: 32,
      opacity: 0.8,
      color: chosenColor,
      isMoveTrail: true
    });
  }

  window.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastMoveTime > 120) {
      triggerRipple(e.clientX, e.clientY);
      lastMoveTime = now;
    }
  });

  const creedSec = document.getElementById('creed');
  const endingSec = document.getElementById('ending-section');
  const sections = document.querySelectorAll('#page-flow > header, #page-flow section, #page-flow .ending');
  const navDots = document.querySelectorAll('#side-nav .dot');

  let currentSectionIndex = 0;
  let prevSectionIndex = 0;

  function scrollToNextSection() {
    if (currentSectionIndex < sections.length - 1) {
      sections[currentSectionIndex + 1].scrollIntoView({ behavior: 'smooth' });
    } else {
      sections[0].scrollIntoView({ behavior: 'smooth' });
    }
  }

  // 统一处理点击/触摸交互
  function handleInteraction(clientX, clientY, target) {
    hasUserInteracted = true;

    if (customCursor) {
      customCursor.classList.remove('clicking');
      void customCursor.offsetWidth;
      customCursor.classList.add('clicking');
    }

    if (target.closest('#player') || target.closest('#side-nav') || target.closest('.entry') || target.closest('#player-toggler')) {
      return;
    }

    playRandomSfx();

    if(!isPlaying && bgm) {
      togglePlay();
    }

    let clickX = clientX;
    let clickY = clientY;
    if (isMobileLandscape()) {
      clickX = window.innerWidth - clientY;
      clickY = clientX;
    }

    for(let l = 0; l < 3; l++) {
      ripples.push({
        x: clickX,
        y: clickY,
        radius: 6 + l * 12,
        maxRadius: 130 + l * 35,
        opacity: 0.9 - l * 0.2,
        color: '255, 42, 75',
        isMoveTrail: false
      });
    }

    createFallingNotes(clickX, clickY);

    if (endingSec && endingSec.contains(target)) {
      endingSec.classList.add('clicked-pulse');
      setTimeout(() => {
        endingSec.classList.remove('clicked-pulse');
      }, 400);
    }

    if (sections[currentSectionIndex] === creedSec && !creedSec.classList.contains('revealed')) {
      creedSec.classList.add('revealed');
      return;
    }

    scrollToNextSection();
  }

  window.addEventListener('click', (e) => {
    handleInteraction(e.clientX, e.clientY, e.target);
  });

  function animateRipples() {
    ctx.clearRect(0, 0, rippleCanvas.width, rippleCanvas.height);
    for(let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      r.radius += r.isMoveTrail ? 1.5 : 2.6;
      r.opacity -= r.isMoveTrail ? 0.035 : 0.015;
      if(r.opacity <= 0) {
        ripples.splice(i, 1);
        i--;
        continue;
      }
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${r.color}, ${r.opacity})`;
      ctx.lineWidth = r.isMoveTrail ? 1.8 : 2.5;
      ctx.stroke();
    }
    requestAnimationFrame(animateRipples);
  }
  animateRipples();

  const archCv = document.getElementById('cv-archive-particles');
  if (archCv) {
    const aCtx = archCv.getContext('2d');
    let aW, aH;
    function resizeArch() {
      aW = archCv.width = archCv.offsetWidth;
      aH = archCv.height = archCv.offsetHeight;
    }
    window.addEventListener('resize', resizeArch);
    resizeArch();

    const particles = [];
    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * aW,
        y: Math.random() * aH,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        radius: Math.random() * 2 + 1,
        angle: Math.random() * Math.PI * 2,
        speed: (Math.random() - 0.5) * 0.04
      });
    }

    let lastArchTime = 0;
    function drawArchParticles(timestamp) {
      if (timestamp - lastArchTime > 33) {
        lastArchTime = timestamp;
        aCtx.clearRect(0, 0, aW, aH);
        aCtx.strokeStyle = 'rgba(79, 168, 255, 0.12)';
        aCtx.lineWidth = 1;
        for (let i = 0; i < particles.length; i++) {
          let p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > aW) p.vx *= -1;
          if (p.y < 0 || p.y > aH) p.vy *= -1;

          aCtx.fillStyle = 'rgba(143, 196, 255, 0.6)';
          aCtx.beginPath();
          aCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          aCtx.fill();

          for (let j = i + 1; j < particles.length; j++) {
            let p2 = particles[j];
            let dist = Math.hypot(p.x - p2.x, p.y - p2.y);
            if (dist < 60) {
              aCtx.beginPath();
              aCtx.moveTo(p.x, p.y);
              aCtx.lineTo(p2.x, p2.y);
              aCtx.stroke();
            }
          }
        }
      }
      requestAnimationFrame(drawArchParticles);
    }
    requestAnimationFrame(drawArchParticles);
  }

  // 关键修复：手机横屏模式下，IntersectionObserver 必须以旋转后的 #page-flow 容器作为 root 才能正确监听滚动
  const scrollContainer = isMobileLandscape() ? document.getElementById('page-flow') : null;

  const observerOptions = {
    root: scrollContainer,
    threshold: 0.5
  };

  let coverStayTimer = null;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('screen-active');
        
        prevSectionIndex = currentSectionIndex;
        const index = Array.from(sections).indexOf(entry.target);
        currentSectionIndex = index;

        if (entry.target.id === 'cover') {
          if (!hasUserInteracted && !isPlaying && bgm) {
            coverStayTimer = setTimeout(() => {
              if (!hasUserInteracted && !isPlaying && bgm) {
                playBgmWithFadeIn();
                hasUserInteracted = true;
              }
            }, 3000);
          }
        } else {
          if (coverStayTimer) {
            clearTimeout(coverStayTimer);
            coverStayTimer = null;
          }
        }

        if (index >= 3) {
          document.body.classList.add('cursor-red-clock');
          if (Math.random() > 0.3) {
            document.body.classList.add('glitch-active');
            setTimeout(() => { document.body.classList.remove('glitch-active'); }, 800);
          }
        } else {
          document.body.classList.remove('cursor-red-clock', 'glitch-active');
        }

        navDots.forEach((dot, idx) => {
          if (idx === index) {
            dot.classList.add('active');
          } else {
            dot.classList.remove('active');
          }
        });
        
        if (index >= 3) {
          document.body.classList.add('clock-red-mode', 'page-red-mode');
          if (index >= 4) {
            document.body.classList.add('deep-red-mode');
          } else {
            document.body.classList.remove('deep-red-mode');
          }
        } else {
          document.body.classList.remove('clock-red-mode', 'page-red-mode', 'deep-red-mode');
        }
      }
    });
  }, observerOptions);

  sections.forEach(sec => observer.observe(sec));

  // 右侧导航圆形图案点击事件：同步触发背景音乐与音效[cite: 6]
  navDots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      hasUserInteracted = true;
      if (coverStayTimer) clearTimeout(coverStayTimer);

      // 触发背景音乐
      if (!isPlaying && bgm) {
        playBgmWithFadeIn();
      }
      playRandomSfx();

      const targetIndex = parseInt(dot.getAttribute('data-index'));
      if (sections[targetIndex]) {
        sections[targetIndex].scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  const rainCv = document.getElementById('cv-rain');
  if (rainCv) {
    const rCtx = rainCv.getContext('2d');
    let width, height;

    function resizeRain() {
      width = rainCv.width = rainCv.offsetWidth;
      height = rainCv.height = rainCv.offsetHeight;
    }
    window.addEventListener('resize', resizeRain);
    resizeRain();

    const drops = [];
    const numDrops = 80;

    for (let i = 0; i < numDrops; i++) {
      drops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: Math.random() * 25 + 15,
        speed: Math.random() * 8 + 12,
        size: Math.random() * 0.8 + 0.5,
        opacity: Math.random() * 0.4 + 0.15
      });
    }

    let lastRainTime = 0;
    function drawRain(timestamp) {
      if (timestamp - lastRainTime > 16) {
        lastRainTime = timestamp;
        rCtx.clearRect(0, 0, width, height);
        for (let d of drops) {
          rCtx.beginPath();
          rCtx.moveTo(d.x, d.y);
          rCtx.lineTo(d.x - 1, d.y + d.length);
          rCtx.strokeStyle = `rgba(210, 230, 255, ${d.opacity})`;
          rCtx.lineWidth = d.size;
          rCtx.lineCap = 'round';
          rCtx.stroke();

          d.y += d.speed;
          d.x -= 0.5;

          if (d.y > height) {
            d.y = -30;
            d.x = Math.random() * width;
          }
        }
      }
      requestAnimationFrame(drawRain);
    }
    requestAnimationFrame(drawRain);
  }
});