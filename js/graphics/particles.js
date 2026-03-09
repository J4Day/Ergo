class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 200; // hard limit
    }

    emit(x, y, count, config) {
        // Enforce hard limit — skip if at capacity
        const available = this.maxParticles - this.particles.length;
        if (available <= 0) return;
        const actual = Math.min(count, available);

        const spread = config.spread || 8;
        const speed = config.speed || 1;
        const life = config.life || 1;
        const size = config.size || 1;
        const gravity = config.gravity || 0;
        const fadeOut = config.fadeOut !== false;
        const colors = config.colors;

        for (let i = 0; i < actual; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * spread,
                y: y + (Math.random() - 0.5) * spread,
                vx: (Math.random() - 0.5) * speed,
                vy: gravity ? -Math.random() * speed : (Math.random() - 0.5) * speed,
                life: life,
                maxLife: life,
                size: size,
                color: colors ? colors[Math.floor(Math.random() * colors.length)] : '#fff',
                gravity: gravity,
                fadeOut: fadeOut
            });
        }
    }

    update(dt) {
        // Iterate backward, swap-remove dead particles (avoids splice O(n) per removal)
        let len = this.particles.length;
        for (let i = len - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity * dt;
            p.life -= dt;
            if (p.life <= 0) {
                // Swap with last element and pop (O(1) removal)
                this.particles[i] = this.particles[len - 1];
                len--;
            }
        }
        this.particles.length = len;
    }

    draw(ctx, camera) {
        const particles = this.particles;
        const len = particles.length;
        if (len === 0) return;

        const ox = camera.offsetX;
        const oy = camera.offsetY;

        // Batch by color to minimize fillStyle changes
        let lastColor = '';
        let lastAlpha = -1;

        for (let i = 0; i < len; i++) {
            const p = particles[i];
            const alpha = p.fadeOut ? Math.max(0, p.life / p.maxLife) : 1;

            if (alpha !== lastAlpha) {
                ctx.globalAlpha = alpha;
                lastAlpha = alpha;
            }
            if (p.color !== lastColor) {
                ctx.fillStyle = p.color;
                lastColor = p.color;
            }

            ctx.fillRect(
                Math.round(p.x + ox),
                Math.round(p.y + oy),
                p.size, p.size
            );
        }
        ctx.globalAlpha = 1;
    }

    clear() {
        this.particles.length = 0;
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
    },
    firefly(ps, x, y) {
        ps.emit(x, y, 1, {
            spread: 200, speed: 0.15, life: 4, size: 1,
            colors: ['#ffee88', '#ffcc44', '#ffaa22'], gravity: -0.02, fadeOut: true
        });
    },
    snowfall(ps, x, y) {
        ps.emit(x + Math.random() * 256, -2, 1, {
            spread: 4, speed: 0.2, life: 5, size: 1,
            colors: ['#ffffff', '#ddddee', '#ccccdd'], gravity: 0.08, fadeOut: false
        });
    },
    embers(ps, x, y) {
        ps.emit(x, y, 1, {
            spread: 30, speed: 0.4, life: 2, size: 1,
            colors: ['#ff4400', '#ff6600', '#ffaa00', '#ff2200'], gravity: -0.15, fadeOut: true
        });
    },
    static(ps, x, y) {
        ps.emit(x, y, 3, {
            spread: 256, speed: 0, life: 0.1, size: 1,
            colors: ['#fff', '#888', '#444'], gravity: 0, fadeOut: false
        });
    },
    tears(ps, x, y) {
        ps.emit(x, y, 1, {
            spread: 4, speed: 0.1, life: 1.5, size: 1,
            colors: ['#88bbff', '#6699dd'], gravity: 0.4, fadeOut: true
        });
    },
    shadowCorruption(ps, x, y) {
        ps.emit(x, y, 30, {
            spread: 32, speed: 2.5, life: 1.2, size: 2,
            colors: ['#1a0020', '#330040', '#ff0040', '#000', '#200010'], gravity: 0.2, fadeOut: true
        });
    },
    shadowTrail(ps, x, y) {
        ps.emit(x, y, 2, {
            spread: 8, speed: 0.15, life: 2, size: 1,
            colors: ['#1a0020', '#0a0010', '#200030'], gravity: -0.03, fadeOut: true
        });
    }
};
