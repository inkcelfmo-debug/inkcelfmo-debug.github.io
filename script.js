document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('bgm-audio');
    const playBtn = document.getElementById('play-btn');

    // 播放/暂停控制逻辑
    if (playBtn && audio) {
        playBtn.addEventListener('click', () => {
            if (audio.paused) {
                audio.play().catch(err => {
                    console.log("自动播放被拦截或播放失败:", err);
                });
            } else {
                audio.pause();
            }
        });
    }

    // 这里可继续补充/还原原本的时钟或动画初始化逻辑
});