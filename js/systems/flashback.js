class FlashbackSystem {
    constructor() {
        this.active = false;
        this.phase = 'idle'; // idle, fadeIn, playing, fadeOut
        this.timer = 0;
        this.duration = 0;
        this.frames = [];
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.frameDuration = 0;
        this.callback = null;
        this.text = '';
        this.textAlpha = 0;
        this.overlayAlpha = 0;
        this.roomName = '';
        this.sepia = false;
    }

    // Trigger a flashback sequence
    start(config, game, callback) {
        if (this.active) return;

        this.active = true;
        this.phase = 'fadeIn';
        this.timer = 0;
        this.frames = config.frames || [];
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.duration = config.duration || 6;
        this.frameDuration = this.frames.length > 0 ? this.duration / this.frames.length : this.duration;
        this.callback = callback || null;
        this.roomName = config.roomName || '';
        this.sepia = config.sepia !== false;
        this.overlayAlpha = 0;
        this.textAlpha = 0;

        // Pause player movement
        if (game && game.player) {
            game.player.frozen = true;
        }

        // Audio cue
        if (game && game.audio && game.audio.initialized) {
            game.audio.playGlitch();
        }
    }

    update(dt, game) {
        if (!this.active) return;

        this.timer += dt;

        switch (this.phase) {
            case 'fadeIn':
                this.overlayAlpha = Math.min(1, this.timer / 0.8);
                if (this.timer >= 0.8) {
                    this.phase = 'playing';
                    this.timer = 0;
                    this.frameTimer = 0;
                }
                break;

            case 'playing':
                this.frameTimer += dt;
                this.textAlpha = Math.min(1, this.timer * 2);

                // Advance frames
                if (this.frames.length > 0 && this.frameTimer >= this.frameDuration) {
                    this.frameTimer = 0;
                    this.currentFrame++;
                    if (this.currentFrame >= this.frames.length) {
                        this.phase = 'fadeOut';
                        this.timer = 0;
                    }
                }

                // Also check total duration
                if (this.timer >= this.duration) {
                    this.phase = 'fadeOut';
                    this.timer = 0;
                }
                break;

            case 'fadeOut':
                this.overlayAlpha = Math.max(0, 1 - this.timer / 0.6);
                this.textAlpha = Math.max(0, 1 - this.timer / 0.4);
                if (this.timer >= 0.6) {
                    this.end(game);
                }
                break;
        }
    }

    end(game) {
        this.active = false;
        this.phase = 'idle';
        this.overlayAlpha = 0;
        this.textAlpha = 0;

        // Unfreeze player
        if (game && game.player) {
            game.player.frozen = false;
        }

        if (this.callback) {
            this.callback();
            this.callback = null;
        }
    }

    // Skip on input
    skip(game) {
        if (this.active && this.phase === 'playing') {
            this.phase = 'fadeOut';
            this.timer = 0;
        }
    }

    getCurrentFrame() {
        if (this.frames.length === 0) return null;
        return this.frames[Math.min(this.currentFrame, this.frames.length - 1)];
    }

    draw(ctx, game) {
        if (!this.active) return;

        const w = CONFIG.INTERNAL_WIDTH;
        const h = CONFIG.INTERNAL_HEIGHT;
        const frame = this.getCurrentFrame();

        // Semi-transparent overlay
        ctx.fillStyle = `rgba(0,0,0,${this.overlayAlpha * 0.85})`;
        ctx.fillRect(0, 0, w, h);

        if (this.phase === 'playing' || (this.phase === 'fadeOut' && this.textAlpha > 0)) {
            if (frame) {
                // Draw frame scene (pixel art vignette)
                this.drawScene(ctx, frame, w, h);

                // Frame text
                if (frame.text) {
                    ctx.globalAlpha = this.textAlpha * this.overlayAlpha;
                    ctx.fillStyle = frame.color || '#c8c8c8';
                    ctx.font = '8px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    // Word wrap
                    const maxWidth = w - 32;
                    const words = frame.text.split(' ');
                    let lines = [];
                    let currentLine = '';
                    for (const word of words) {
                        const testLine = currentLine ? currentLine + ' ' + word : word;
                        if (ctx.measureText(testLine).width > maxWidth) {
                            lines.push(currentLine);
                            currentLine = word;
                        } else {
                            currentLine = testLine;
                        }
                    }
                    if (currentLine) lines.push(currentLine);

                    const baseY = h * 0.78;
                    lines.forEach((line, i) => {
                        ctx.fillText(line, w / 2, baseY + i * 12);
                    });
                    ctx.globalAlpha = 1;
                }
            }
        }

        // Sepia/old film overlay
        if (this.sepia && this.overlayAlpha > 0.3) {
            ctx.globalAlpha = this.overlayAlpha * 0.15;
            ctx.fillStyle = '#8b7355';
            ctx.fillRect(0, 0, w, h);
            ctx.globalAlpha = 1;

            // Film grain
            ctx.fillStyle = 'rgba(255,255,255,0.02)';
            for (let i = 0; i < 20; i++) {
                ctx.fillRect(
                    Math.random() * w,
                    Math.random() * h,
                    1, 1
                );
            }

            // Vignette for flashback
            const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.6);
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(1, `rgba(0,0,0,${this.overlayAlpha * 0.5})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
        }

        // Skip hint
        if (this.phase === 'playing') {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#555';
            ctx.font = '8px monospace';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillText('Enter — пропустить', w - 4, h - 4);
            ctx.globalAlpha = 1;
        }
    }

    drawScene(ctx, frame, w, h) {
        ctx.globalAlpha = this.textAlpha * this.overlayAlpha;

        const scene = frame.scene || 'default';
        const cx = w / 2;
        const cy = h * 0.4;

        switch (scene) {
            case 'childhood':
                this.drawChildhoodScene(ctx, cx, cy);
                break;
            case 'school':
                this.drawSchoolScene(ctx, cx, cy);
                break;
            case 'garden':
                this.drawGardenScene(ctx, cx, cy);
                break;
            case 'hospital':
                this.drawHospitalScene(ctx, cx, cy);
                break;
            case 'fall':
                this.drawFallScene(ctx, cx, cy, w, h);
                break;
            default:
                this.drawDefaultScene(ctx, cx, cy);
                break;
        }

        ctx.globalAlpha = 1;
    }

    drawChildhoodScene(ctx, cx, cy) {
        // Simple room with child figure
        ctx.fillStyle = '#665544';
        ctx.fillRect(cx - 40, cy - 20, 80, 50);
        // Window with light
        ctx.fillStyle = '#aabbcc';
        ctx.fillRect(cx + 15, cy - 15, 12, 12);
        ctx.fillStyle = '#ffeeaa';
        ctx.fillRect(cx + 16, cy - 14, 10, 10);
        // Small figure
        ctx.fillStyle = '#cc8866';
        ctx.fillRect(cx - 10, cy + 10, 4, 4); // head
        ctx.fillStyle = '#8866aa';
        ctx.fillRect(cx - 11, cy + 14, 6, 8); // body
        // Teddy bear
        ctx.fillStyle = '#aa8855';
        ctx.fillRect(cx - 4, cy + 16, 3, 3);
    }

    drawSchoolScene(ctx, cx, cy) {
        // Corridor with lockers
        ctx.fillStyle = '#445566';
        ctx.fillRect(cx - 50, cy - 15, 100, 40);
        // Lockers
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = '#556677';
            ctx.fillRect(cx - 45 + i * 15, cy - 12, 12, 20);
            ctx.fillStyle = '#667788';
            ctx.fillRect(cx - 44 + i * 15, cy - 11, 10, 18);
        }
        // Small lone figure
        ctx.fillStyle = '#cc8866';
        ctx.fillRect(cx, cy + 10, 4, 4);
        ctx.fillStyle = '#446688';
        ctx.fillRect(cx - 1, cy + 14, 6, 8);
    }

    drawGardenScene(ctx, cx, cy) {
        // Grave with flowers
        ctx.fillStyle = '#334422';
        ctx.fillRect(cx - 50, cy + 10, 100, 20);
        // Gravestone
        ctx.fillStyle = '#778899';
        ctx.fillRect(cx - 6, cy - 5, 12, 18);
        ctx.fillRect(cx - 8, cy - 8, 16, 5);
        // Flowers
        ctx.fillStyle = '#cc4466';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(cx - 20 + i * 12, cy + 8, 3, 3);
            ctx.fillStyle = '#44aa44';
            ctx.fillRect(cx - 19 + i * 12, cy + 11, 1, 4);
            ctx.fillStyle = '#cc4466';
        }
        // Small figure kneeling
        ctx.fillStyle = '#cc8866';
        ctx.fillRect(cx + 14, cy + 6, 4, 4);
        ctx.fillStyle = '#8866aa';
        ctx.fillRect(cx + 13, cy + 10, 6, 6);
    }

    drawHospitalScene(ctx, cx, cy) {
        // Hospital bed
        ctx.fillStyle = '#eeeedd';
        ctx.fillRect(cx - 30, cy - 5, 60, 30);
        // Bed frame
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(cx - 32, cy - 7, 2, 35);
        ctx.fillRect(cx + 30, cy - 7, 2, 35);
        // Figure lying
        ctx.fillStyle = '#cc8866';
        ctx.fillRect(cx + 10, cy, 4, 4);
        ctx.fillStyle = '#ccccdd';
        ctx.fillRect(cx - 15, cy + 2, 30, 12);
        // Monitor
        ctx.fillStyle = '#334455';
        ctx.fillRect(cx + 35, cy - 5, 10, 10);
        ctx.fillStyle = '#44ff44';
        // Heartbeat line
        ctx.strokeStyle = '#44ff44';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx + 36, cy);
        ctx.lineTo(cx + 38, cy);
        ctx.lineTo(cx + 39, cy - 3);
        ctx.lineTo(cx + 40, cy + 2);
        ctx.lineTo(cx + 41, cy);
        ctx.lineTo(cx + 44, cy);
        ctx.stroke();
        // Person sitting beside
        ctx.fillStyle = '#887766';
        ctx.fillRect(cx - 35, cy + 5, 4, 4);
        ctx.fillStyle = '#665588';
        ctx.fillRect(cx - 36, cy + 9, 6, 8);
    }

    drawFallScene(ctx, cx, cy, w, h) {
        // Rooftop edge perspective
        ctx.fillStyle = '#555566';
        ctx.fillRect(cx - 60, cy + 15, 120, 5);
        // Sky
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(cx - 60, cy - 30, 120, 45);
        // Stars
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 8; i++) {
            ctx.fillRect(
                cx - 55 + ((i * 37) % 110),
                cy - 25 + ((i * 23) % 40),
                1, 1
            );
        }
        // Figure at edge
        ctx.fillStyle = '#cc8866';
        ctx.fillRect(cx, cy + 8, 4, 4);
        ctx.fillStyle = '#8866aa';
        ctx.fillRect(cx - 1, cy + 12, 6, 8);
        // Wind lines
        ctx.strokeStyle = 'rgba(200,200,255,0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(cx - 40 + i * 25, cy + 5 + i * 3);
            ctx.lineTo(cx - 25 + i * 25, cy + 5 + i * 3);
            ctx.stroke();
        }
    }

    drawDefaultScene(ctx, cx, cy) {
        // Abstract memory fragment
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(cx - 30, cy - 20, 60, 40);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.strokeRect(cx - 30, cy - 20, 60, 40);
        // Question mark
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', cx, cy);
    }
}

// Flashback configurations for each room
const FLASHBACKS = {
    apartment: {
        roomName: 'apartment',
        duration: 8,
        sepia: true,
        frames: [
            {
                scene: 'childhood',
                text: '*Эта квартира... Я помню запах. Старые обои. Мамин голос из кухни.*',
                color: '#ddc8a0'
            },
            {
                scene: 'childhood',
                text: '*Здесь было тепло. Когда-то. До того, как вода поднялась.*',
                color: '#c8b090'
            }
        ]
    },

    school: {
        roomName: 'school',
        duration: 8,
        sepia: true,
        frames: [
            {
                scene: 'school',
                text: '*Шкафчики. Голоса. Смех за спиной. Я стою одна у стены.*',
                color: '#a0b0c0'
            },
            {
                scene: 'school',
                text: '*"Странная." "Тихоня." Слова, которые становились стенами.*',
                color: '#90a0b0'
            }
        ]
    },

    garden: {
        roomName: 'garden',
        duration: 9,
        sepia: true,
        frames: [
            {
                scene: 'garden',
                text: '*Сад. Бабушкин сад. Ромашки и тишина.*',
                color: '#b0c0a0'
            },
            {
                scene: 'garden',
                text: '*Она говорила: "Всё проходит, Милочка." Она ушла первой.*',
                color: '#a0b090'
            },
            {
                scene: 'garden',
                text: '*Могила зарастала. Как и моя надежда.*',
                color: '#90a080'
            }
        ]
    },

    hospital: {
        roomName: 'hospital',
        duration: 10,
        sepia: false,
        frames: [
            {
                scene: 'hospital',
                text: '*Белый свет. Запах антисептика. Бип... бип... бип...*',
                color: '#c0d0e0'
            },
            {
                scene: 'hospital',
                text: '*Кто-то держит мою руку. Мама? Я не могу открыть глаза.*',
                color: '#b0c0d0'
            },
            {
                scene: 'fall',
                text: '*До этого — крыша. Ветер. Пустота внизу. Шаг.*',
                color: '#d0a0a0'
            }
        ]
    }
};
