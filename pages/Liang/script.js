document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('motion-ready');

  // 自定义光标跟随与点击缩放逻辑
  const customCursor = document.getElementById('custom-cursor');
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function updateCursorPos() {
    cursorX += (mouseX - cursorX) * 0.7;
    cursorY += (mouseY - cursorY) * 0.7;
    if (customCursor) {
      customCursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
    }
    requestAnimationFrame(updateCursorPos);
  }
  updateCursorPos();

  // 1. 时钟更新
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

  // 2. 音频与音效逻辑
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
  // 定义音效的放大倍数（这里设为 1.8 倍，使点击音效更响，您可以根据实际需求调整该数值）
  const sfxMultiplier = 1.8;

  if(bgm) bgm.volume = currentVolume;
  sfxList.forEach(sfx => { 
    if(sfx) sfx.volume = Math.min(1.0, currentVolume * sfxMultiplier); 
  });

  volInput.addEventListener('input', (e) => {
    currentVolume = parseFloat(e.target.value);
    if(bgm) bgm.volume = currentVolume;
    sfxList.forEach(sfx => { 
      if(sfx) sfx.volume = Math.min(1.0, currentVolume * sfxMultiplier); 
    });
  });

  function playRandomSfx() {
    const randomIndex = Math.floor(Math.random() * sfxList.length);
    const sfx = sfxList[randomIndex];
    if (sfx) {
      sfx.volume = Math.min(1.0, currentVolume * sfxMultiplier);
      sfx.currentTime = 0;
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

  // 3. 点击下坠粒子特效与多层散落
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
  window.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastMoveTime > 120) {
      const trailColors = ['255, 255, 255', '255, 42, 75', '79, 168, 255'];
      const chosenColor = trailColors[Math.floor(Math.random() * trailColors.length)];
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 2,
        maxRadius: 32,
        opacity: 0.8,
        color: chosenColor,
        isMoveTrail: true
      });
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

  window.addEventListener('click', (e) => {
    hasUserInteracted = true;

    if (customCursor) {
      customCursor.classList.remove('clicking');
      void customCursor.offsetWidth;
      customCursor.classList.add('clicking');
    }

    if (e.target.closest('#player') || e.target.closest('#side-nav') || e.target.closest('.entry') || e.target.closest('#player-toggler')) {
      return;
    }

    playRandomSfx();

    if(!isPlaying && bgm) {
      togglePlay();
    }

    for(let l = 0; l < 3; l++) {
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 6 + l * 12,
        maxRadius: 130 + l * 35,
        opacity: 0.9 - l * 0.2,
        color: '255, 42, 75',
        isMoveTrail: false
      });
    }

    createFallingNotes(e.clientX, e.clientY);

    if (endingSec && endingSec.contains(e.target)) {
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

  const observerOptions = {
    root: null,
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

  navDots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      hasUserInteracted = true;
      if (coverStayTimer) clearTimeout(coverStayTimer);
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