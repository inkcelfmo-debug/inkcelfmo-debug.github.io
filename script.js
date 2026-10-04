document.addEventListener('DOMContentLoaded', () => {
    // 1. 获取 DOM 节点
    const audio = document.getElementById('bgm-audio');
    const playBtn = document.getElementById('play-btn');
    const clockDisplay = document.getElementById('clock-display');

    // 2. 音频播放与暂停控制
    if (playBtn && audio) {
        playBtn.addEventListener('click', () => {
            if (audio.paused) {
                audio.play().then(() => {
                    playBtn.textContent = '暂停';
                }).catch(err => {
                    console.warn("音频播放受到限制或文件不存在:", err);
                });
            } else {
                audio.pause();
                playBtn.textContent = '播放';
            }
        });
    }

    // 3. 动态时钟逻辑
    function updateClock() {
        if (!clockDisplay) return;
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        clockDisplay.textContent = `${hours}:${minutes}:${seconds}`;
    }

    // 启动实时时钟，每秒更新一次
    updateClock();
    setInterval(updateClock, 1000);
});