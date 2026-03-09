class CutsceneSystem {
    constructor() {
        this.active = false;
        this.scenes = [];
        this.currentScene = 0;
        this.timer = 0;
        this.phase = 'idle'; // idle, fadeIn, showing, fadeOut
        this.overlayAlpha = 0;
        this.textAlpha = 0;
        this.callback = null;
        this._skipCooldown = 0;
    }

    // Start a cutscene sequence
    // scenes: array of { duration, text, speaker, scene, sound, color, bg }
    start(scenes, game, callback) {
        if (this.active || !scenes || scenes.length === 0) return;
        this.active = true;
        this.scenes = scenes;
        this.currentScene = 0;
        this.timer = 0;
        this.phase = 'fadeIn';
        this.callback = callback || null;
        this._skipCooldown = 0.5;

        if (game && game.player) game.player.frozen = true;
        if (game && game.audio) game.audio.playCutsceneTransition();
    }

    update(dt, game) {
        if (!this.active) return;
        this.timer += dt;
        if (this._skipCooldown > 0) this._skipCooldown -= dt;

        const scene = this.scenes[this.currentScene];
        if (!scene) { this.end(game); return; }

        switch (this.phase) {
            case 'fadeIn':
                this.overlayAlpha = Math.min(1, this.timer / 0.6);
                if (this.timer >= 0.6) {
                    this.phase = 'showing';
                    this.timer = 0;
                    this.textAlpha = 0;
                    // Play scene sound
                    if (scene.sound && game && game.audio) {
                        this._playSceneSound(scene.sound, game);
                    }
                }
                break;

            case 'showing':
                this.textAlpha = Math.min(1, this.timer / 0.5);
                if (this.timer >= (scene.duration || 4)) {
                    this.advanceScene(game);
                }
                break;

            case 'fadeOut':
                this.overlayAlpha = Math.max(0, 1 - this.timer / 0.5);
                this.textAlpha = Math.max(0, 1 - this.timer / 0.3);
                if (this.timer >= 0.5) {
                    this.end(game);
                }
                break;
        }
    }

    advanceScene(game) {
        this.currentScene++;
        if (this.currentScene >= this.scenes.length) {
            this.phase = 'fadeOut';
            this.timer = 0;
        } else {
            // Transition between scenes
            this.timer = 0;
            this.textAlpha = 0;
            const scene = this.scenes[this.currentScene];
            if (scene.sound && game && game.audio) {
                this._playSceneSound(scene.sound, game);
            }
        }
    }

    skip(game) {
        if (!this.active || this._skipCooldown > 0) return;
        if (this.phase === 'showing') {
            this.advanceScene(game);
            this._skipCooldown = 0.3;
        }
    }

    end(game) {
        this.active = false;
        this.phase = 'idle';
        this.overlayAlpha = 0;
        this.textAlpha = 0;
        if (game && game.player) game.player.frozen = false;
        if (this.callback) {
            const cb = this.callback;
            this.callback = null;
            cb();
        }
    }

    _playSceneSound(sound, game) {
        switch (sound) {
            case 'whisper': game.audio.playWhisper(); break;
            case 'heartbeat': game.audio.playHeartbeat(); break;
            case 'crying': game.audio.playCrying(); break;
            case 'breathing': game.audio.playBreathing(); break;
            case 'flatline': game.audio.playFlatline(); break;
            case 'glitch': game.audio.playGlitch(); break;
            case 'door': game.audio.playDoorCreak(); break;
            case 'water': game.audio.playWaterAmbient(); break;
            case 'wind': game.audio.playWindAmbient(); break;
            case 'radio': game.audio.playRadioStatic(true); break;
            case 'transition': game.audio.playCutsceneTransition(); break;
            case 'scream': game.audio.playShadowScream(); break;
            case 'memory': game.audio.playMemoryAccept(); break;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        const w = CONFIG.INTERNAL_WIDTH;
        const h = CONFIG.INTERNAL_HEIGHT;
        const scene = this.scenes[this.currentScene];
        if (!scene) return;

        // Background overlay
        const bgColor = scene.bg || '0,0,0';
        ctx.fillStyle = `rgba(${bgColor},${this.overlayAlpha * 0.92})`;
        ctx.fillRect(0, 0, w, h);

        if (this.phase === 'showing' || (this.phase === 'fadeOut' && this.textAlpha > 0)) {
            // Draw scene visual
            if (scene.scene) {
                this._drawSceneVisual(ctx, scene, w, h);
            }

            // Speaker label
            ctx.globalAlpha = this.textAlpha * this.overlayAlpha;
            if (scene.speaker) {
                const speakerNames = {
                    mila: 'Мила', doctor: 'Доктор', shadow: 'Тень',
                    mother: 'Мама', littleMila: 'Маленькая Мила',
                    narrator: '', nurse: 'Медсестра', radio: 'Радио'
                };
                const name = speakerNames[scene.speaker] || scene.speaker;
                if (name) {
                    ctx.fillStyle = '#888';
                    ctx.font = '8px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(name, w / 2, h * 0.68);
                }
            }

            // Main text
            if (scene.text) {
                ctx.fillStyle = scene.color || '#c8c8c8';
                ctx.font = '8px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const maxWidth = w - 40;
                const words = scene.text.split(' ');
                const lines = [];
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

                const baseY = h * 0.76;
                lines.forEach((line, i) => {
                    ctx.fillText(line, w / 2, baseY + i * 12);
                });
            }
            ctx.globalAlpha = 1;
        }

        // Film grain
        if (this.overlayAlpha > 0.3) {
            ctx.fillStyle = 'rgba(255,255,255,0.015)';
            for (let i = 0; i < 15; i++) {
                ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
            }
        }

        // Skip hint
        if (this.phase === 'showing') {
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = '#555';
            ctx.font = '8px monospace';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillText('Enter', w - 4, h - 4);
            ctx.globalAlpha = 1;
        }
    }

    _drawSceneVisual(ctx, scene, w, h) {
        ctx.globalAlpha = this.textAlpha * this.overlayAlpha * 0.8;
        const cx = w / 2;
        const cy = h * 0.35;

        switch (scene.scene) {
            case 'hospital_real':
                this._drawHospitalReal(ctx, cx, cy);
                break;
            case 'rooftop':
                this._drawRooftop(ctx, cx, cy, w);
                break;
            case 'mother_crying':
                this._drawMotherCrying(ctx, cx, cy);
                break;
            case 'childhood_happy':
                this._drawChildhoodHappy(ctx, cx, cy);
                break;
            case 'school_bullying':
                this._drawSchoolBullying(ctx, cx, cy);
                break;
            case 'ambulance':
                this._drawAmbulance(ctx, cx, cy);
                break;
            case 'mirror':
                this._drawMirror(ctx, cx, cy);
                break;
        }
        ctx.globalAlpha = 1;
    }

    _drawHospitalReal(ctx, cx, cy) {
        // Hospital room — bed, monitors, person lying
        ctx.fillStyle = '#ddddd0';
        ctx.fillRect(cx - 45, cy - 15, 90, 45);
        // Bed
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(cx - 25, cy + 5, 50, 15);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 23, cy + 7, 46, 11);
        // Figure in bed
        ctx.fillStyle = '#cc9977';
        ctx.fillRect(cx + 12, cy + 8, 4, 4);
        ctx.fillStyle = '#ccccee';
        ctx.fillRect(cx - 15, cy + 9, 30, 8);
        // IV drip
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx + 28, cy - 10);
        ctx.lineTo(cx + 28, cy + 10);
        ctx.stroke();
        ctx.fillStyle = '#88aacc';
        ctx.fillRect(cx + 26, cy - 14, 4, 6);
        // Monitor with heartbeat
        ctx.fillStyle = '#223344';
        ctx.fillRect(cx - 40, cy - 5, 12, 10);
        ctx.strokeStyle = '#44ff44';
        ctx.beginPath();
        ctx.moveTo(cx - 39, cy);
        ctx.lineTo(cx - 36, cy);
        ctx.lineTo(cx - 35, cy - 3);
        ctx.lineTo(cx - 34, cy + 2);
        ctx.lineTo(cx - 33, cy);
        ctx.lineTo(cx - 30, cy);
        ctx.stroke();
    }

    _drawRooftop(ctx, cx, cy, w) {
        // Night sky
        ctx.fillStyle = '#0a0a1e';
        ctx.fillRect(cx - 60, cy - 30, 120, 50);
        // Stars
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 12; i++) {
            ctx.fillRect(cx - 55 + ((i * 31 + 7) % 110), cy - 25 + ((i * 17) % 40), 1, 1);
        }
        // Rooftop edge
        ctx.fillStyle = '#444455';
        ctx.fillRect(cx - 60, cy + 18, 120, 8);
        ctx.fillStyle = '#555566';
        ctx.fillRect(cx - 60, cy + 16, 120, 3);
        // City lights below
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = `rgba(255,${200 + i * 5},100,0.3)`;
            ctx.fillRect(cx - 50 + i * 14, cy + 26, 3, 2);
        }
        // Figure at edge
        ctx.fillStyle = '#cc9977';
        ctx.fillRect(cx, cy + 9, 4, 4);
        ctx.fillStyle = '#665588';
        ctx.fillRect(cx - 1, cy + 13, 6, 7);
    }

    _drawMotherCrying(ctx, cx, cy) {
        // Chair
        ctx.fillStyle = '#667788';
        ctx.fillRect(cx - 5, cy + 10, 12, 12);
        ctx.fillRect(cx - 5, cy + 2, 12, 8);
        // Mother sitting, hunched
        ctx.fillStyle = '#aa8877';
        ctx.fillRect(cx, cy - 2, 4, 4);
        ctx.fillStyle = '#776688';
        ctx.fillRect(cx - 1, cy + 2, 6, 10);
        // Hands covering face
        ctx.fillStyle = '#aa8877';
        ctx.fillRect(cx - 1, cy - 1, 2, 3);
        ctx.fillRect(cx + 3, cy - 1, 2, 3);
        // Tears (small dots)
        ctx.fillStyle = '#6688bb';
        ctx.fillRect(cx, cy + 2, 1, 1);
        ctx.fillRect(cx + 3, cy + 3, 1, 1);
    }

    _drawChildhoodHappy(ctx, cx, cy) {
        // Sunny room
        ctx.fillStyle = '#ccbb88';
        ctx.fillRect(cx - 40, cy - 15, 80, 45);
        // Window with sunlight
        ctx.fillStyle = '#aaccee';
        ctx.fillRect(cx + 15, cy - 12, 15, 15);
        ctx.fillStyle = '#ffeedd';
        ctx.fillRect(cx + 16, cy - 11, 13, 13);
        // Two figures (mother + child)
        ctx.fillStyle = '#aa8877'; // mother head
        ctx.fillRect(cx - 15, cy + 5, 5, 5);
        ctx.fillStyle = '#776688';
        ctx.fillRect(cx - 16, cy + 10, 7, 10);
        // Child
        ctx.fillStyle = '#cc9977';
        ctx.fillRect(cx - 5, cy + 10, 4, 4);
        ctx.fillStyle = '#cc6688';
        ctx.fillRect(cx - 6, cy + 14, 6, 7);
        // Heart between them
        ctx.fillStyle = '#ff8899';
        ctx.fillRect(cx - 10, cy + 12, 2, 2);
    }

    _drawSchoolBullying(ctx, cx, cy) {
        // Hallway
        ctx.fillStyle = '#445566';
        ctx.fillRect(cx - 50, cy - 12, 100, 35);
        // Group of figures
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = '#334455';
            ctx.fillRect(cx - 30 + i * 8, cy + 5, 4, 4);
            ctx.fillRect(cx - 31 + i * 8, cy + 9, 6, 7);
        }
        // Lone figure cornered
        ctx.fillStyle = '#cc9977';
        ctx.fillRect(cx + 25, cy + 8, 4, 4);
        ctx.fillStyle = '#665588';
        ctx.fillRect(cx + 24, cy + 12, 6, 7);
        // Words floating (small rectangles like text)
        ctx.fillStyle = 'rgba(255,50,50,0.4)';
        ctx.fillRect(cx - 10, cy - 5, 20, 3);
        ctx.fillRect(cx + 5, cy - 1, 15, 3);
    }

    _drawAmbulance(ctx, cx, cy) {
        // Street at night
        ctx.fillStyle = '#111122';
        ctx.fillRect(cx - 55, cy - 20, 110, 50);
        // Building
        ctx.fillStyle = '#333344';
        ctx.fillRect(cx + 20, cy - 20, 30, 40);
        // Ambulance (white rectangle with cross)
        ctx.fillStyle = '#dddddd';
        ctx.fillRect(cx - 30, cy + 10, 25, 12);
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(cx - 20, cy + 13, 6, 2);
        ctx.fillRect(cx - 18, cy + 11, 2, 6);
        // Flashing lights
        ctx.fillStyle = 'rgba(255,0,0,0.5)';
        ctx.fillRect(cx - 28, cy + 9, 3, 2);
        ctx.fillStyle = 'rgba(0,0,255,0.5)';
        ctx.fillRect(cx - 8, cy + 9, 3, 2);
        // Stretcher
        ctx.fillStyle = '#888888';
        ctx.fillRect(cx, cy + 18, 15, 3);
    }

    _drawMirror(ctx, cx, cy) {
        // Dark room
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(cx - 40, cy - 20, 80, 50);
        // Mirror frame
        ctx.fillStyle = '#887766';
        ctx.fillRect(cx - 12, cy - 18, 24, 36);
        // Mirror surface
        ctx.fillStyle = '#4455aa';
        ctx.fillRect(cx - 10, cy - 16, 20, 32);
        // Reflection — distorted figure
        ctx.fillStyle = '#cc9977';
        ctx.fillRect(cx - 1, cy - 5, 3, 3);
        ctx.fillStyle = '#554466';
        ctx.fillRect(cx - 2, cy - 2, 5, 8);
        // Crack in mirror
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 16);
        ctx.lineTo(cx + 3, cy - 5);
        ctx.lineTo(cx - 2, cy + 5);
        ctx.lineTo(cx + 1, cy + 16);
        ctx.stroke();
    }
}

// Pre-defined cutscene sequences for story moments
const CUTSCENES = {
    // Plays after first entering corridor — shows what happened
    prologue: [
        {
            duration: 5, scene: 'rooftop', sound: 'wind',
            text: '*Крыша. Ветер в волосах. Город внизу — маленький и равнодушный.*',
            speaker: 'narrator', color: '#a0a0c0'
        },
        {
            duration: 4, scene: 'rooftop', sound: 'breathing',
            text: '*Один шаг. Только один. И всё закончится.*',
            speaker: 'mila', color: '#c0a0a0'
        },
        {
            duration: 4, scene: 'ambulance', sound: 'transition',
            text: '*Сирены. Чьи-то руки. Темнота.*',
            speaker: 'narrator', color: '#c0c0c0'
        },
        {
            duration: 5, scene: 'hospital_real', sound: 'heartbeat',
            text: '*Бип... бип... бип... Палата реанимации. Кома.*',
            speaker: 'narrator', color: '#a0b0c0'
        },
        {
            duration: 5, scene: 'mother_crying', sound: 'crying',
            text: '*"Милочка... вернись... пожалуйста, вернись..."*',
            speaker: 'mother', color: '#c0a0b0'
        }
    ],

    // After apartment puzzle — mother's departure context
    motherLeft: [
        {
            duration: 5, scene: 'childhood_happy', sound: 'whisper',
            text: '*Было время, когда она была рядом. Каждый день.*',
            speaker: 'narrator', color: '#ddc8a0'
        },
        {
            duration: 4,
            text: '*А потом — пустая кухня. Холодный ужин. Записка на холодильнике.*',
            speaker: 'mila', color: '#c0b0a0'
        },
        {
            duration: 5, sound: 'door',
            text: '*"Мила, мне нужно уехать. Я скоро вернусь." Она не вернулась скоро.*',
            speaker: 'narrator', color: '#a0a0a0'
        }
    ],

    // After school puzzle — bullying context
    schoolMemory: [
        {
            duration: 5, scene: 'school_bullying', sound: 'whisper',
            text: '*Каждый день — один и тот же коридор. Одни и те же лица.*',
            speaker: 'narrator', color: '#a0b0c0'
        },
        {
            duration: 4,
            text: '*"Эй, странная! Почему ты всегда одна? Потому что тебя никто не хочет?"*',
            speaker: 'narrator', color: '#c0a0a0'
        },
        {
            duration: 5, sound: 'breathing',
            text: '*Я научилась молчать. Молчание стало стеной. Стена стала тюрьмой.*',
            speaker: 'mila', color: '#a0a0b0'
        }
    ],

    // After hospital puzzle — the reality
    hospitalReality: [
        {
            duration: 5, scene: 'hospital_real', sound: 'heartbeat',
            text: '*В реальности — палата 7. Капельница. Аппарат ИВЛ.*',
            speaker: 'narrator', color: '#b0c0d0'
        },
        {
            duration: 5, scene: 'mother_crying', sound: 'crying',
            text: '*Мама приходит каждый день. Читает вслух. Плачет, когда думает, что никто не слышит.*',
            speaker: 'narrator', color: '#c0a0b0'
        },
        {
            duration: 5, sound: 'whisper',
            text: '*"Прогноз неопределённый. Активность мозга есть. Мы ждём."*',
            speaker: 'nurse', color: '#a0b0a0'
        }
    ],

    // Garden — grandmother's death
    grandmotherMemory: [
        {
            duration: 5, sound: 'wind',
            text: '*Бабушка умерла, когда мне было двенадцать. Единственный человек, который слушал.*',
            speaker: 'mila', color: '#b0c0a0'
        },
        {
            duration: 5, sound: 'whisper',
            text: '*"Всё пройдёт, Милочка. Даже самая длинная ночь заканчивается рассветом."*',
            speaker: 'narrator', color: '#c0c0a0'
        },
        {
            duration: 4,
            text: '*После неё — пустота. Та самая, которая привела на крышу.*',
            speaker: 'mila', color: '#a0a090'
        }
    ],

    // Before void — recap of all
    beforeVoid: [
        {
            duration: 4, scene: 'mirror', sound: 'glitch',
            text: '*Мама ушла. Школа сломала. Бабушка умерла. Я — осталась одна.*',
            speaker: 'mila', color: '#c0a0a0'
        },
        {
            duration: 5, scene: 'rooftop', sound: 'wind',
            text: '*И я решила, что мир будет лучше без меня. Я ошибалась.*',
            speaker: 'mila', color: '#a0a0c0'
        },
        {
            duration: 4, sound: 'heartbeat',
            text: '*Или нет? Сейчас узнаем.*',
            speaker: 'shadow', color: '#ff6666'
        }
    ]
};
