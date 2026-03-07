class Effects {
    constructor(renderer) {
        this.renderer = renderer;
        this.active = {};
        this.timers = {};
        this.time = 0;
    }

    enable(effect, params) {
        this.active[effect] = params || {};
    }

    disable(effect) {
        delete this.active[effect];
    }

    disableAll() {
        this.active = {};
    }

    flash(duration, color) {
        this.timers.flash = { duration, remaining: duration, color: color || '#fff' };
    }

    update(dt) {
        this.time += dt;
        for (const key in this.timers) {
            this.timers[key].remaining -= dt;
            if (this.timers[key].remaining <= 0) {
                delete this.timers[key];
            }
        }
    }

    apply() {
        const ctx = this.renderer.ictx;
        const w = CONFIG.INTERNAL_WIDTH;
        const h = CONFIG.INTERNAL_HEIGHT;

        if (this.active.glitch) this.applyGlitch(ctx, w, h);
        if (this.active.noise) this.applyNoise(ctx, w, h);
        if (this.active.vhs) this.applyVHS(ctx, w, h);
        if (this.active.vignette) this.applyVignette(ctx, w, h);
        if (this.active.invert) this.applyInvert(ctx, w, h);
        if (this.active.breathe) this.applyBreathe(ctx, w, h);
        if (this.active.chromatic) this.applyChromatic(ctx, w, h);
        if (this.active.hueShift) this.applyHueShift(ctx, w, h);

        if (this.active.rain) this.applyRain(ctx, w, h);
        if (this.active.eyes) this.applyEyes(ctx, w, h);
        if (this.active.pulse) this.applyScreenPulse(ctx, w, h);
        if (this.active.fog) this.applyFog(ctx, w, h);

        if (this.timers.flash) {
            const t = this.timers.flash;
            const alpha = t.remaining / t.duration;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = t.color;
            ctx.fillRect(0, 0, w, h);
            ctx.globalAlpha = 1;
        }
    }

    applyRain(ctx, w, h) {
        const intensity = this.active.rain.intensity || 0.3;
        ctx.strokeStyle = `rgba(100,140,200,${intensity})`;
        ctx.lineWidth = 1;
        const count = Math.floor(30 * intensity);
        for (let i = 0; i < count; i++) {
            const x = (i * 37 + this.time * 120) % w;
            const y = (i * 53 + this.time * 250) % h;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 1, y + 4);
            ctx.stroke();
        }
    }

    applyEyes(ctx, w, h) {
        // Random blinking eyes in darkness
        const t = Math.floor(this.time * 2);
        if (t % 7 < 2) return; // blink off
        const count = this.active.eyes.count || 3;
        for (let i = 0; i < count; i++) {
            const seed = i * 1337;
            const ex = ((seed * 7 + 31) % (w - 20)) + 10;
            const ey = ((seed * 13 + 47) % (h - 40)) + 10;
            const blink = Math.sin(this.time * (1 + i * 0.3)) > 0.3;
            if (blink) {
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.fillRect(ex, ey, 2, 1);
                ctx.fillRect(ex + 5, ey, 2, 1);
            }
        }
    }

    applyScreenPulse(ctx, w, h) {
        const speed = this.active.pulse.speed || 1;
        const amount = this.active.pulse.amount || 0.1;
        const pulse = (Math.sin(this.time * speed * Math.PI * 2) + 1) * 0.5 * amount;
        ctx.fillStyle = `rgba(0,0,0,${pulse})`;
        ctx.fillRect(0, 0, w, h);
    }

    applyFog(ctx, w, h) {
        const density = this.active.fog.density || 0.15;
        const color = this.active.fog.color || '150,150,150';
        for (let i = 0; i < 5; i++) {
            const x = ((i * 73 + this.time * 8) % (w + 40)) - 20;
            const y = h * 0.3 + Math.sin(this.time * 0.5 + i) * 20;
            const r = 30 + i * 10;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
            grad.addColorStop(0, `rgba(${color},${density})`);
            grad.addColorStop(1, `rgba(${color},0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
        }
    }

    applyGlitch(ctx, w, h) {
        const intensity = this.active.glitch.intensity || 0.3;
        if (Math.random() > intensity) return;

        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        const lines = Math.floor(Math.random() * 5) + 1;

        for (let i = 0; i < lines; i++) {
            const y = Math.floor(Math.random() * h);
            const shift = Math.floor((Math.random() - 0.5) * 20);
            const lineHeight = Math.floor(Math.random() * 3) + 1;

            for (let ly = y; ly < Math.min(y + lineHeight, h); ly++) {
                const row = new Uint8ClampedArray(w * 4);
                for (let x = 0; x < w; x++) {
                    const si = (ly * w + x) * 4;
                    row[x * 4] = data[si];
                    row[x * 4 + 1] = data[si + 1];
                    row[x * 4 + 2] = data[si + 2];
                    row[x * 4 + 3] = data[si + 3];
                }
                for (let x = 0; x < w; x++) {
                    const sx = ((x - shift) % w + w) % w;
                    const di = (ly * w + x) * 4;
                    data[di] = row[sx * 4];
                    data[di + 1] = row[sx * 4 + 1];
                    data[di + 2] = row[sx * 4 + 2];
                    data[di + 3] = row[sx * 4 + 3];
                }
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    applyNoise(ctx, w, h) {
        const intensity = this.active.noise.intensity || 0.05;
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        const count = Math.floor(w * h * intensity);

        for (let i = 0; i < count; i++) {
            const idx = Math.floor(Math.random() * w * h) * 4;
            const v = Math.random() * 255;
            data[idx] = v;
            data[idx + 1] = v;
            data[idx + 2] = v;
        }
        ctx.putImageData(imageData, 0, 0);
    }

    applyVHS(ctx, w, h) {
        // Scanlines
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        for (let y = 0; y < h; y += 2) {
            ctx.fillRect(0, y, w, 1);
        }
        // Occasional tracking distortion
        if (Math.random() < 0.02) {
            const y = Math.floor(Math.random() * h);
            const band = Math.floor(Math.random() * 8) + 2;
            const imgData = ctx.getImageData(0, y, w, band);
            ctx.putImageData(imgData, Math.floor((Math.random() - 0.5) * 10), y);
        }
    }

    applyVignette(ctx, w, h) {
        const strength = this.active.vignette.strength || 0.5;
        const gradient = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${strength})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }

    applyInvert(ctx, w, h) {
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
        }
        ctx.putImageData(imageData, 0, 0);
    }

    applyBreathe(ctx, w, h) {
        const speed = this.active.breathe.speed || 1;
        const amount = this.active.breathe.amount || 2;
        const phase = Math.sin(this.time * speed);
        const imageData = ctx.getImageData(0, 0, w, h);
        const copy = new Uint8ClampedArray(imageData.data);

        for (let y = 0; y < h; y++) {
            const shift = Math.round(Math.sin(y * 0.05 + this.time * speed) * amount * phase);
            for (let x = 0; x < w; x++) {
                const sx = ((x + shift) % w + w) % w;
                const di = (y * w + x) * 4;
                const si = (y * w + sx) * 4;
                imageData.data[di] = copy[si];
                imageData.data[di + 1] = copy[si + 1];
                imageData.data[di + 2] = copy[si + 2];
                imageData.data[di + 3] = copy[si + 3];
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    applyChromatic(ctx, w, h) {
        const offset = this.active.chromatic.offset || 2;
        const imageData = ctx.getImageData(0, 0, w, h);
        const copy = new Uint8ClampedArray(imageData.data);

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const di = (y * w + x) * 4;
                // Shift red channel left
                const rx = Math.max(0, x - offset);
                const ri = (y * w + rx) * 4;
                imageData.data[di] = copy[ri];
                // Shift blue channel right
                const bx = Math.min(w - 1, x + offset);
                const bi = (y * w + bx) * 4;
                imageData.data[di + 2] = copy[bi + 2];
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    applyHueShift(ctx, w, h) {
        const amount = this.active.hueShift.amount || 30;
        const shift = Math.sin(this.time) * amount;
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 16) { // Skip pixels for perf
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h2 = 0;
            if (max !== min) {
                const d = max - min;
                if (max === r) h2 = ((g - b) / d) % 6;
                else if (max === g) h2 = (b - r) / d + 2;
                else h2 = (r - g) / d + 4;
                h2 = ((h2 * 60 + shift) % 360 + 360) % 360;
                const s = max === 0 ? 0 : (max - min) / max;
                const v = max;
                const c = v * s / 255;
                const x = c * (1 - Math.abs((h2 / 60) % 2 - 1));
                const m = v / 255 - c;
                let r2, g2, b2;
                if (h2 < 60) { r2 = c; g2 = x; b2 = 0; }
                else if (h2 < 120) { r2 = x; g2 = c; b2 = 0; }
                else if (h2 < 180) { r2 = 0; g2 = c; b2 = x; }
                else if (h2 < 240) { r2 = 0; g2 = x; b2 = c; }
                else if (h2 < 300) { r2 = x; g2 = 0; b2 = c; }
                else { r2 = c; g2 = 0; b2 = x; }
                data[i] = (r2 + m) * 255;
                data[i + 1] = (g2 + m) * 255;
                data[i + 2] = (b2 + m) * 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }
}
