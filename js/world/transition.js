class Transition {
    constructor() {
        this.active = false;
        this.type = 'fade';
        this.progress = 0;
        this.duration = 0.5;
        this.phase = 'out'; // 'out' = fading out, 'in' = fading in
        this.callback = null;
        this.color = '#000';
    }

    start(type, duration, callback, color) {
        this.active = true;
        this.type = type || 'fade';
        this.duration = duration || 0.5;
        this.progress = 0;
        this.phase = 'out';
        this.callback = callback;
        this.color = color || '#000';
    }

    update(dt) {
        if (!this.active) return;

        this.progress += dt / this.duration;

        if (this.progress >= 1 && this.phase === 'out') {
            this.progress = 0;
            this.phase = 'in';
            if (this.callback) this.callback();
        }

        if (this.progress >= 1 && this.phase === 'in') {
            this.active = false;
            this.progress = 0;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        const w = CONFIG.INTERNAL_WIDTH;
        const h = CONFIG.INTERNAL_HEIGHT;
        let alpha;

        if (this.phase === 'out') {
            alpha = this.progress;
        } else {
            alpha = 1 - this.progress;
        }

        if (this.type === 'fade') {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.fillRect(0, 0, w, h);
            ctx.globalAlpha = 1;
        } else if (this.type === 'glitch') {
            // Glitch transition: pixelated blocks
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            const blockSize = Math.max(2, Math.floor((1 - Math.abs(alpha - 0.5) * 2) * 16));
            for (let y = 0; y < h; y += blockSize) {
                for (let x = 0; x < w; x += blockSize) {
                    if (Math.random() < alpha) {
                        ctx.fillRect(x, y, blockSize, blockSize);
                    }
                }
            }
            ctx.globalAlpha = 1;
        } else if (this.type === 'pixelate') {
            // Pixelation effect
            const size = Math.max(1, Math.floor(alpha * 16));
            if (size > 1) {
                const imgData = ctx.getImageData(0, 0, w, h);
                for (let y = 0; y < h; y += size) {
                    for (let x = 0; x < w; x += size) {
                        const i = (y * w + x) * 4;
                        const r = imgData.data[i], g = imgData.data[i + 1], b = imgData.data[i + 2];
                        ctx.fillStyle = `rgb(${r},${g},${b})`;
                        ctx.fillRect(x, y, size, size);
                    }
                }
            }
        }
    }
}
