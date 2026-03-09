class Effects {
    constructor(renderer) {
        this.renderer = renderer;
        this.active = {};
        this.timers = {};
        this.time = 0;
        this._activeCount = 0;

        // Pre-allocated buffers (created lazily)
        this._noiseCanvas = null;
        this._noiseCtx = null;
        this._noiseTimer = 0;
        this._vignetteCanvas = null;
        this._vignetteStrength = -1;

        // Glitch uses canvas copy instead of getImageData
        this._glitchCanvas = null;
        this._glitchCtx = null;

        // Chromatic: two offset canvases
        this._chromCanvas = null;
        this._chromCtx = null;

        // Pre-allocated color strings to avoid GC
        this._cachedColors = {};
    }

    enable(effect, params) {
        this.active[effect] = params || {};
        this._activeCount++;
    }

    disable(effect) {
        if (this.active[effect]) {
            delete this.active[effect];
            this._activeCount--;
        }
    }

    disableAll() {
        this.active = {};
        this._activeCount = 0;
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
        if (this._activeCount === 0 && !this.timers.flash) return;

        const ctx = this.renderer.ictx;
        const w = CONFIG.INTERNAL_WIDTH;
        const h = CONFIG.INTERNAL_HEIGHT;

        // Pixel manipulation effects (expensive — use canvas tricks)
        if (this.active.glitch) this.applyGlitch(ctx, w, h);
        if (this.active.noise) this.applyNoise(ctx, w, h);
        if (this.active.vhs) this.applyVHS(ctx, w, h);
        if (this.active.chromatic) this.applyChromatic(ctx, w, h);
        if (this.active.breathe) this.applyBreathe(ctx, w, h);
        if (this.active.hueShift) this.applyHueShift(ctx, w, h);
        if (this.active.invert) this.applyInvert(ctx, w, h);

        // Overlay effects (cheap — just fillRect/gradients)
        if (this.active.vignette) this.applyVignette(ctx, w, h);
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

    // === OPTIMIZED: Rain uses pre-set style, batched path ===
    applyRain(ctx, w, h) {
        const intensity = this.active.rain.intensity || 0.3;
        ctx.strokeStyle = `rgba(100,140,200,${intensity})`;
        ctx.lineWidth = 1;
        const count = Math.floor(30 * intensity);
        ctx.beginPath();
        const t120 = this.time * 120;
        const t250 = this.time * 250;
        for (let i = 0; i < count; i++) {
            const x = (i * 37 + t120) % w;
            const y = (i * 53 + t250) % h;
            ctx.moveTo(x, y);
            ctx.lineTo(x - 1, y + 4);
        }
        ctx.stroke();
    }

    applyEyes(ctx, w, h) {
        const t = Math.floor(this.time * 2);
        if (t % 7 < 2) return;
        const count = this.active.eyes.count || 3;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        for (let i = 0; i < count; i++) {
            const seed = i * 1337;
            const ex = ((seed * 7 + 31) % (w - 20)) + 10;
            const ey = ((seed * 13 + 47) % (h - 40)) + 10;
            if (Math.sin(this.time * (1 + i * 0.3)) > 0.3) {
                ctx.fillRect(ex, ey, 2, 1);
                ctx.fillRect(ex + 5, ey, 2, 1);
            }
        }
    }

    applyScreenPulse(ctx, w, h) {
        const speed = this.active.pulse.speed || 1;
        const amount = this.active.pulse.amount || 0.1;
        const pulse = (Math.sin(this.time * speed * 6.2832) + 1) * 0.5 * amount;
        if (pulse < 0.005) return;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
    }

    applyFog(ctx, w, h) {
        const density = this.active.fog.density || 0.15;
        const color = this.active.fog.color || '150,150,150';
        const c0 = `rgba(${color},${density})`;
        const c1 = `rgba(${color},0)`;
        for (let i = 0; i < 5; i++) {
            const x = ((i * 73 + this.time * 8) % (w + 40)) - 20;
            const y = h * 0.3 + Math.sin(this.time * 0.5 + i) * 20;
            const r = 30 + i * 10;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
            grad.addColorStop(0, c0);
            grad.addColorStop(1, c1);
            ctx.fillStyle = grad;
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
        }
    }

    // === OPTIMIZED: Glitch uses drawImage slice-shift instead of getImageData ===
    applyGlitch(ctx, w, h) {
        const intensity = this.active.glitch.intensity || 0.3;
        if (Math.random() > intensity) return;

        // Use canvas self-copy for line shifting
        const canvas = ctx.canvas;
        const lines = Math.floor(Math.random() * 4) + 1;
        for (let i = 0; i < lines; i++) {
            const y = Math.floor(Math.random() * h);
            const shift = Math.floor((Math.random() - 0.5) * 16);
            const lineH = Math.floor(Math.random() * 3) + 1;
            if (shift !== 0) {
                ctx.drawImage(canvas, 0, y, w, lineH, shift, y, w, lineH);
            }
        }
    }

    // === OPTIMIZED: Noise uses pre-rendered noise canvas, updated every 3 frames ===
    applyNoise(ctx, w, h) {
        const intensity = this.active.noise.intensity || 0.05;

        // Lazily create noise canvas
        if (!this._noiseCanvas) {
            this._noiseCanvas = document.createElement('canvas');
            this._noiseCanvas.width = w;
            this._noiseCanvas.height = h;
            this._noiseCtx = this._noiseCanvas.getContext('2d');
        }

        // Update noise texture every 3rd frame (~20fps noise is sufficient)
        this._noiseTimer++;
        if (this._noiseTimer >= 3) {
            this._noiseTimer = 0;
            const nctx = this._noiseCtx;
            nctx.clearRect(0, 0, w, h);
            const count = Math.floor(w * h * intensity);
            for (let i = 0; i < count; i++) {
                const x = Math.floor(Math.random() * w);
                const y = Math.floor(Math.random() * h);
                const v = Math.floor(Math.random() * 256);
                nctx.fillStyle = `rgb(${v},${v},${v})`;
                nctx.fillRect(x, y, 1, 1);
            }
        }

        ctx.globalAlpha = 0.5;
        ctx.drawImage(this._noiseCanvas, 0, 0);
        ctx.globalAlpha = 1;
    }

    applyVHS(ctx, w, h) {
        // Scanlines — simple overlay
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        for (let y = 0; y < h; y += 2) {
            ctx.fillRect(0, y, w, 1);
        }
        // Occasional tracking — use drawImage instead of getImageData
        if (Math.random() < 0.02) {
            const y = Math.floor(Math.random() * h);
            const band = Math.floor(Math.random() * 8) + 2;
            const shift = Math.floor((Math.random() - 0.5) * 10);
            ctx.drawImage(ctx.canvas, 0, y, w, band, shift, y, w, band);
        }
    }

    // === OPTIMIZED: Vignette cached as offscreen canvas ===
    applyVignette(ctx, w, h) {
        const strength = this.active.vignette.strength || 0.5;

        // Cache vignette canvas (recreate only if strength changes)
        if (!this._vignetteCanvas || this._vignetteStrength !== strength) {
            this._vignetteStrength = strength;
            if (!this._vignetteCanvas) {
                this._vignetteCanvas = document.createElement('canvas');
                this._vignetteCanvas.width = w;
                this._vignetteCanvas.height = h;
            }
            const vctx = this._vignetteCanvas.getContext('2d');
            vctx.clearRect(0, 0, w, h);
            const gradient = vctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, `rgba(0,0,0,${strength})`);
            vctx.fillStyle = gradient;
            vctx.fillRect(0, 0, w, h);
        }

        ctx.drawImage(this._vignetteCanvas, 0, 0);
    }

    // === OPTIMIZED: Invert uses 'difference' composite (no pixel loop) ===
    applyInvert(ctx, w, h) {
        ctx.globalCompositeOperation = 'difference';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
    }

    // === OPTIMIZED: Breathe uses drawImage with slight offsets ===
    applyBreathe(ctx, w, h) {
        const speed = this.active.breathe.speed || 1;
        const amount = this.active.breathe.amount || 2;
        const phase = Math.sin(this.time * speed);
        const shift = Math.round(amount * phase);

        if (shift === 0) return;

        // Use self-copy: draw canvas shifted horizontally with wrap
        const canvas = ctx.canvas;
        // Draw shifted copy for distortion effect (3 horizontal bands)
        const bandH = Math.floor(h / 3);
        for (let band = 0; band < 3; band++) {
            const by = band * bandH;
            const bShift = Math.round(Math.sin(band * 1.2 + this.time * speed) * amount * phase);
            if (bShift !== 0) {
                ctx.drawImage(canvas, 0, by, w, bandH, bShift, by, w, bandH);
            }
        }
    }

    // === OPTIMIZED: Chromatic uses composite blending (no pixel loop) ===
    applyChromatic(ctx, w, h) {
        const offset = this.active.chromatic.offset || 2;
        if (offset === 0) return;

        // Lazily create temp canvas
        if (!this._chromCanvas) {
            this._chromCanvas = document.createElement('canvas');
            this._chromCanvas.width = CONFIG.INTERNAL_WIDTH;
            this._chromCanvas.height = CONFIG.INTERNAL_HEIGHT;
            this._chromCtx = this._chromCanvas.getContext('2d');
        }

        const src = ctx.canvas;

        // Save original
        this._chromCtx.clearRect(0, 0, w, h);
        this._chromCtx.drawImage(src, 0, 0);

        // Red channel shifted left
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.3;
        ctx.drawImage(this._chromCanvas, -offset, 0);
        ctx.globalAlpha = 1;

        // Blue channel shifted right
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.15;
        // Draw blue-tinted version offset right
        this._chromCtx.globalCompositeOperation = 'multiply';
        this._chromCtx.fillStyle = '#0000ff';
        this._chromCtx.fillRect(0, 0, w, h);
        this._chromCtx.globalCompositeOperation = 'source-over';
        ctx.drawImage(this._chromCanvas, offset, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';

        // Restore the temp canvas for next use
        this._chromCtx.clearRect(0, 0, w, h);
    }

    // === OPTIMIZED: HueShift uses hue-rotate filter if available, fallback to overlay ===
    applyHueShift(ctx, w, h) {
        const amount = this.active.hueShift.amount || 30;
        const shift = Math.sin(this.time) * amount;

        // Use CSS filter for hue rotation (fast, GPU-accelerated)
        if (typeof ctx.filter !== 'undefined') {
            ctx.filter = `hue-rotate(${Math.round(shift)}deg)`;
            ctx.drawImage(ctx.canvas, 0, 0);
            ctx.filter = 'none';
        } else {
            // Fallback: subtle color overlay approximation
            const hue = ((shift % 360) + 360) % 360;
            const r = Math.floor(128 + Math.sin(hue * 0.0175) * 50);
            const g = Math.floor(128 + Math.sin((hue + 120) * 0.0175) * 50);
            const b = Math.floor(128 + Math.sin((hue + 240) * 0.0175) * 50);
            ctx.globalAlpha = 0.06;
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(0, 0, w, h);
            ctx.globalAlpha = 1;
        }
    }
}
