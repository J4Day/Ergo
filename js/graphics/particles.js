class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, count, config) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * (config.spread || 8),
                y: y + (Math.random() - 0.5) * (config.spread || 8),
                vx: (Math.random() - 0.5) * (config.speed || 1),
                vy: (config.gravity ? -Math.random() * (config.speed || 1) : (Math.random() - 0.5) * (config.speed || 1)),
                life: config.life || 1,
                maxLife: config.life || 1,
                size: config.size || 1,
                color: config.colors ? config.colors[Math.floor(Math.random() * config.colors.length)] : '#fff',
                gravity: config.gravity || 0,
                fadeOut: config.fadeOut !== false
            });
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity * dt;
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx, camera) {
        for (const p of this.particles) {
            const alpha = p.fadeOut ? Math.max(0, p.life / p.maxLife) : 1;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(
                Math.round(p.x + camera.offsetX),
                Math.round(p.y + camera.offsetY),
                p.size, p.size
            );
        }
        ctx.globalAlpha = 1;
    }

    clear() {
        this.particles = [];
    }
}

// Preset emitters
const ParticlePresets = {
    ash(ps, x, y) {
        ps.emit(x, y, 1, {
            spread: 256, speed: 0.3, life: 3, size: 1,
            colors: ['#808080', '#606060', '#a0a0a0'], gravity: 0.1, fadeOut: true
        });
    },
    dust(ps, x, y) {
        ps.emit(x, y, 2, {
            spread: 16, speed: 0.2, life: 1.5, size: 1,
            colors: ['#d0d0d0', '#b0b0b0'], gravity: -0.05, fadeOut: true
        });
    },
    pixelDecay(ps, x, y) {
        ps.emit(x, y, 15, {
            spread: 12, speed: 1.5, life: 0.8, size: 2,
            colors: ['#fff', '#ccc', '#888', '#444', '#000'], gravity: 0.5, fadeOut: true
        });
    },
    glitchBurst(ps, x, y) {
        ps.emit(x, y, 20, {
            spread: 24, speed: 2, life: 0.3, size: 1,
            colors: ['#ff0000', '#00ff00', '#0000ff', '#fff'], gravity: 0, fadeOut: false
        });
    },
    waterDrip(ps, x, y) {
        ps.emit(x, y, 1, {
            spread: 2, speed: 0.5, life: 1, size: 1,
            colors: ['#3d7cc9', '#5ba3e6'], gravity: 0.3, fadeOut: true
        });
    }
};
