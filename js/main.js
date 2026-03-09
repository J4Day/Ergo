class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.engine = new Engine();
        this.input = new Input();
        this.camera = new Camera();
        this.state = new GameState();
        this.effects = new Effects(this.renderer);
        this.transition = new Transition();
        this.dialogue = new DialogueSystem();
        this.eventManager = new EventManager();
        this.inventory = new Inventory();
        this.puzzle = new PuzzleSystem();
        this.saveSystem = new SaveSystem();
        this.audio = new AudioManager();

        // New systems
        this.sanity = new SanitySystem();
        this.breath = new BreathSystem();
        this.sprint = new SprintSystem();
        this.stealth = new StealthSystem();
        this.notes = new NotesSystem();
        this.achievements = new AchievementSystem();
        this.meta = new MetaSystem();
        this.uiGlitch = new UIGlitchSystem();
        this.flashback = new FlashbackSystem();
        this.cutscene = new CutsceneSystem();

        this.spriteGen = new SpriteGen();
        this.tilesetGen = new TilesetGen();

        this.player = new Player(5, 5);
        this.shadow = new Shadow(0, 0);

        this.rooms = {};
        this.currentRoom = null;
        this.endingType = null;

        this.menuSelection = 0;
        this.titleTimer = 0;
        this.titleGlitch = 0;

        // Fourth wall / meta
        this.fourthWallTimer = 0;
        this.fourthWallActive = false;
        this.silenceTimer = 0;
        this.silenceActive = false;
    }

    init() {
        // Generate all assets
        this.spriteGen.generateAll();
        this.tilesetGen.generateAll();

        // Init player
        this.player.init(this.spriteGen.cache.mila);
        this.shadow.sprite = this.spriteGen.cache.shadow.idle;

        // Init rooms
        this.initRooms();

        // Start engine
        this.engine.start(
            (dt) => this.update(dt),
            (alpha) => this.render(alpha)
        );
    }

    initRooms() {
        this.rooms = {
            whiteRoom: new WhiteRoom(),
            corridor: new CorridorRoom(),
            apartment: new ApartmentRoom(),
            school: new SchoolRoom(),
            garden: new GardenRoom(),
            hospital: new HospitalRoom(),
            void: new VoidRoom(),
            roof: new RoofRoom(),
            childrenRoom: new ChildrenRoom()
        };
    }

    changeRoom(roomName, playerX, playerY) {
        const room = this.rooms[roomName];
        if (!room) return;

        const doChange = () => {
            // Door sound on room change
            if (this.audio && this.audio.initialized) {
                this.audio.playDoorCreak();
            }

            // Deactivate shadow
            this.shadow.deactivate();

            this.currentRoom = room;
            if (!room.built) room.build(this);

            const startX = playerX !== undefined ? playerX : room.playerStart.x;
            const startY = playerY !== undefined ? playerY : room.playerStart.y;
            this.player.teleport(startX, startY);

            room.enter(this);

            // Build stealth cover map for new room
            this.stealth.buildCoverMap(room);

            this.camera.follow(this.player, room.width, room.height);
            this.camera.x = this.camera.targetX;
            this.camera.y = this.camera.targetY;
        };

        if (this.state.is('playing') || this.state.is('dialogue')) {
            this.state.change('transition');
            this.transition.start('fade', 0.4, () => {
                doChange();
                if (this.state.is('transition')) {
                    this.state.change('playing');
                }
            });
        } else {
            doChange();
            if (!this.state.is('dialogue') && !this.state.is('cutscene')) {
                this.state.change('playing');
            }
        }
    }

    update(dt) {
        this.input.update();
        this.titleTimer += dt;
        this.meta.update(dt);

        // Transition always updates regardless of state
        if (this.transition.active) {
            this.transition.update(dt);
        }

        // Achievements always tick
        this.achievements.update(dt);

        switch (this.state.current) {
            case 'menu':
                this.updateMenu(dt);
                break;
            case 'playing':
                this.updatePlaying(dt);
                break;
            case 'dialogue':
                this.dialogue.update(dt, this);
                // Shadow jumpscare continues during dialogue
                if (this.shadow.jumpscareActive) this.shadow.update(dt, this);
                break;
            case 'transition':
                break;
            case 'cutscene':
                if (this.cutscene.active) {
                    this.cutscene.update(dt, this);
                    if (this.input.confirm) this.cutscene.skip(this);
                } else {
                    this.dialogue.update(dt, this);
                }
                break;
            case 'ending':
                this.updateEnding(dt);
                break;
            case 'pause':
                // Notes viewer in pause
                if (this.input.isPressed('KeyN')) {
                    this.notes.toggle();
                }
                if (this.notes.viewing) {
                    this.notes.update(dt, this);
                } else {
                    if (this.input.menu) {
                        this.state.change('playing');
                    }
                }
                break;
        }

        this.effects.update(dt);
    }

    updateMenu(dt) {
        this.titleGlitch = Math.random() < 0.02 ? Math.random() * 4 : this.titleGlitch * 0.9;

        const hasSave = this.saveSystem.hasSave();
        const maxOption = hasSave ? 2 : 0;

        if (this.input.dirDown) {
            this.menuSelection = Math.min(maxOption, this.menuSelection + 1);
        }
        if (this.input.dirUp) {
            this.menuSelection = Math.max(0, this.menuSelection - 1);
        }

        if (this.input.confirm) {
            this.audio.init();
            this.audio.resume();
            this.audio.playConfirm();

            if (this.menuSelection === 0) {
                // New game
                this.saveSystem.deleteSave();
                this.state.flags = Object.assign({}, STORY_FLAGS.defaults);
                this.player.noCatchRun = true;
                this.sanity.value = 100;
                this.notes.found = [];
                this.inventory.clear();
                this.state.change('playing');
                this.changeRoom('whiteRoom');
            } else if (this.menuSelection === 1 && hasSave) {
                this.state.change('playing');
                const data = this.saveSystem.load();
                this.saveSystem.applySave(this, data);
            } else if (this.menuSelection === 2 && hasSave) {
                this.saveSystem.deleteSave();
                this.menuSelection = 0;
            }
        }
    }

    updatePlaying(dt) {
        if (!this.currentRoom) return;

        // Notes/Inventory overlay blocks gameplay input
        if (this.notes.viewing) {
            this.notes.update(dt, this);
            if (this.input.isPressed('KeyN')) {
                this.notes.toggle();
            }
            return;
        }
        if (this.inventory.visible) {
            if (this.input.isPressed('Tab') || this.input.cancel) {
                this.inventory.toggle();
            }
            return;
        }

        this.player.update(dt, this);
        this.shadow.update(dt, this);
        this.currentRoom.update(dt, this);

        // Sanity system
        this.sanity.update(dt, this);
        if (this.shadow.active && this.player) {
            const dist = this.shadow.distanceTo(this.player);
            this.sanity.onNearShadow(dist, dt);
        }
        if (this.player.corruptionSlow) {
            this.sanity.onCorruptionTile(dt);
        }

        // Stealth system
        this.stealth.update(dt, this);

        // Corruption visual feedback
        if (this.player.corruptionSlow) {
            this.effects.enable('noise', { intensity: 0.06 });
            this.effects.enable('chromatic', { offset: 2 });
        }

        // Camera follow
        this.camera.follow(this.player, this.currentRoom.width, this.currentRoom.height);
        this.camera.update(dt);

        // Pause
        if (this.input.menu) {
            this.state.change('pause');
        }

        // Inventory toggle
        if (this.input.isPressed('Tab')) {
            this.inventory.toggle();
        }

        // Notes toggle
        if (this.input.isPressed('KeyN')) {
            this.notes.toggle();
        }

        // Mute toggle
        if (this.input.isPressed('KeyM')) {
            this.audio.toggleMute();
        }

        // === FOURTH WALL BREAKING (rare) ===
        this.fourthWallTimer += dt;
        if (this.meta.isNewGamePlus && this.fourthWallTimer > 120 && Math.random() < 0.0001) {
            this.fourthWallTimer = 0;
            this.triggerFourthWall();
        }

        // === MOMENTS OF TOTAL SILENCE ===
        if (this.silenceActive) {
            this.silenceTimer -= dt;
            if (this.silenceTimer <= 0) {
                this.silenceActive = false;
                if (this.audio.masterGain) {
                    this.audio.masterGain.gain.value = this.audio.muted ? 0 : 0.7;
                }
            }
        }

        // UI Glitches
        this.uiGlitch.update(dt, this);

        // Flashback system
        if (this.flashback.active) {
            this.flashback.update(dt, this);
            if (this.input.confirm) {
                this.flashback.skip(this);
            }
        }

        // Achievement checks
        this.checkAchievements();
    }

    triggerFourthWall() {
        this.fourthWallActive = true;
        const messages = [
            { text: '*...ты снова здесь.*', speaker: 'narrator' },
            { text: `*Цикл ${this.meta.data.totalPlaythroughs + 1}. Она не помнит.*`, speaker: 'narrator' },
            { text: '*Экран мерцает. Это не часть игры... или это часть?*', speaker: 'narrator' },
        ];
        if (this.meta.data.totalDeaths > 5) {
            messages.push({ text: `*${this.meta.data.totalDeaths} раз. Тень ловила тебя ${this.meta.data.totalDeaths} раз.*`, speaker: 'narrator' });
        }
        const msg = messages[Math.floor(Math.random() * messages.length)];
        this.dialogue.show({ lines: [msg] }, this, () => {
            this.fourthWallActive = false;
        });
    }

    triggerSilence(duration) {
        this.silenceActive = true;
        this.silenceTimer = duration || 5;
        if (this.audio.masterGain) {
            this.audio.masterGain.gain.value = 0;
        }
    }

    checkAchievements() {
        const a = this.achievements;
        const f = this.state.flags;
        const m = this.meta;

        // Sprint distance
        if (m.data.sprintDistance >= 100) a.unlock('marathoner');

        // Shadow evasions
        if (m.data.maxShadowEvasions >= 10) a.unlock('shadowDancer');

        // Panic attack
        if (m.data.panicAttackCount > 0) a.unlock('breathless');

        // 3 loops
        if (m.data.totalLoops >= 3) a.unlock('cycle3');

        // All notes
        if (this.notes.count >= this.notes.total) a.unlock('collector');
    }

    updateEnding(dt) {
        if (this.input.confirm) {
            this.state.change('menu');
            this.endingType = null;
            this.effects.disableAll();
            this.audio.stopDrone();
            this.audio.stopPulse();
            this.audio.stopOST();
            this.menuSelection = 0;
        }
    }

    render(alpha) {
        switch (this.state.current) {
            case 'menu':
                this.renderMenu();
                break;
            case 'ending':
                this.renderEnding();
                break;
            default:
                this.renderGame();
                break;
        }
        // Achievements overlay (always visible)
        this.achievements.draw(this.renderer.ictx);
        this.renderer.present();
    }

    renderMenu() {
        const ctx = this.renderer.ictx;
        const w = CONFIG.INTERNAL_WIDTH;
        const h = CONFIG.INTERNAL_HEIGHT;
        const t = this.titleTimer;
        const corruption = this.meta.menuCorruptionLevel;

        this.renderer.clear('#000');

        // Animated background — slow floating particles
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        for (let i = 0; i < 12; i++) {
            const px = (Math.sin(t * 0.2 + i * 1.7) * 0.5 + 0.5) * w;
            const py = (Math.cos(t * 0.15 + i * 2.3) * 0.5 + 0.5) * h;
            ctx.fillRect(px, py, 1, 1);
        }

        // === MENU CORRUPTION based on meta progress ===
        if (corruption > 0) {
            // Red particles
            ctx.fillStyle = `rgba(255,0,0,${corruption * 0.05})`;
            for (let i = 0; i < Math.floor(corruption * 8); i++) {
                const px = (Math.sin(t * 0.3 + i * 2.1) * 0.5 + 0.5) * w;
                const py = (Math.cos(t * 0.25 + i * 1.8) * 0.5 + 0.5) * h;
                ctx.fillRect(px, py, 1, 1);
            }
            // Cracks on screen
            if (corruption > 0.3) {
                ctx.strokeStyle = `rgba(60,0,0,${corruption * 0.3})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(w * 0.3, 0);
                ctx.lineTo(w * 0.35 + Math.sin(t) * 2, h * 0.4);
                ctx.lineTo(w * 0.28, h * 0.7);
                ctx.stroke();
            }
            if (corruption > 0.5) {
                ctx.strokeStyle = `rgba(80,0,0,${corruption * 0.2})`;
                ctx.beginPath();
                ctx.moveTo(w * 0.7, h);
                ctx.lineTo(w * 0.65, h * 0.5);
                ctx.lineTo(w * 0.72, h * 0.2);
                ctx.stroke();
            }
        }

        // Title with glitch + breathing scale effect
        const breathe = Math.sin(t * 0.8) * 0.02;
        ctx.save();
        ctx.translate(w / 2, h / 3);
        ctx.scale(1 + breathe, 1 + breathe);

        // Shadow behind title
        ctx.fillStyle = `rgba(255,0,0,${0.15 + corruption * 0.15})`;
        const glitchOx = Math.random() < (0.04 + corruption * 0.08) ? (Math.random() - 0.5) * (8 + corruption * 12) : 0;
        ctx.font = '24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ERGO', glitchOx + 1, 1);

        ctx.fillStyle = '#f0f0f0';
        ctx.fillText('ERGO', glitchOx, 0);
        ctx.restore();

        // Subtitle
        const subAlpha = Math.min(1, t * 0.3);
        ctx.globalAlpha = subAlpha;
        ctx.fillStyle = '#555';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // NG+ subtitle changes
        if (this.meta.isNewGamePlus && corruption > 0.3) {
            const subs = ['"следовательно"', '"снова"', '"помнишь?"', '"не уходи"'];
            const subIdx = Math.floor(t * 0.1) % subs.length;
            ctx.fillText(subs[subIdx], w / 2, h / 3 + 22);
        } else {
            ctx.fillText('"следовательно"', w / 2, h / 3 + 22);
        }
        ctx.globalAlpha = 1;

        // Glitch lines (more with corruption)
        if (Math.random() < (0.06 + corruption * 0.15)) {
            const gy = Math.floor(Math.random() * h);
            const gw = Math.floor(Math.random() * 60) + 20;
            const gx = Math.floor(Math.random() * (w - gw));
            ctx.fillStyle = `rgba(255,${Math.floor(Math.random()*50)},${Math.floor(Math.random()*50)},${0.3 + corruption * 0.2})`;
            ctx.fillRect(gx, gy, gw, 1 + Math.floor(Math.random() * 2));
        }

        // Menu options
        const hasSave = this.saveSystem.hasSave();
        const options = ['Новая игра'];
        if (hasSave) {
            options.push('Продолжить');
            options.push('Удалить сохранение');
        }

        const menuFade = Math.min(1, (t - 1) * 0.5);
        ctx.globalAlpha = Math.max(0, menuFade);

        options.forEach((opt, i) => {
            const isSelected = i === this.menuSelection;
            const pulse = isSelected ? Math.sin(t * 3) * 0.15 + 0.85 : 0;
            ctx.fillStyle = isSelected ? `rgba(255,255,255,${0.85 + pulse * 0.15})` : '#444';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            const prefix = isSelected ? '> ' : '  ';
            const ox = isSelected ? Math.sin(t * 4) * 1 : 0;
            ctx.fillText(prefix + opt, w / 2 + ox, h / 2 + 24 + i * 16);
        });

        ctx.globalAlpha = 1;

        // Bottom hint
        ctx.fillStyle = '#222';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        let hint = 'WASD - движение | Enter - действие | Space - задержка дыхания';
        ctx.fillText(hint, w / 2, h - 16);
        ctx.fillText('Shift - бег | N - записки | M - звук', w / 2, h - 6);

        // VHS scanlines
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        for (let y = 0; y < h; y += 2) {
            ctx.fillRect(0, y, w, 1);
        }

        // Vignette
        const gradient = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.7);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${0.6 + corruption * 0.2})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // === NG+ meta text (fourth wall) ===
        if (this.meta.isNewGamePlus && t > 5 && corruption > 0.2) {
            ctx.globalAlpha = Math.min(0.15, corruption * 0.15);
            ctx.fillStyle = '#ff0000';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            const metaTexts = [
                `Прохождение #${this.meta.data.totalPlaythroughs + 1}`,
                `Тень помнит`,
                `Стены трескаются`,
            ];
            const mt = metaTexts[Math.floor(t * 0.05) % metaTexts.length];
            ctx.fillText(mt, w / 2, h / 2 + 70);
            ctx.globalAlpha = 1;
        }
    }

    renderGame() {
        const ctx = this.renderer.ictx;
        const bgColor = this.currentRoom ? this.currentRoom.palette[this.currentRoom.palette.length - 1] : '#000';
        this.renderer.clear(bgColor);

        if (this.currentRoom) {
            this.currentRoom.draw(this.renderer, this.camera);
            this.player.draw(this.renderer, this.camera);
            this.shadow.draw(this.renderer, this.camera);
            this.currentRoom.drawEntities(this.renderer, this.camera);

            // Sanity ambient entities
            this.sanity.drawAmbientEntities(this.renderer, this.camera);
        }

        // Post-processing effects
        this.effects.apply();

        // Breath system overlay
        this.breath.draw(ctx);

        // UI overlays
        this.transition.draw(ctx);
        this.dialogue.draw(ctx);
        this.inventory.draw(ctx);
        this.notes.draw(ctx);

        // Breath/Sprint HUD (minimal, atmospheric)
        this.drawMinimalHUD(ctx);

        // UI Glitches overlay
        this.uiGlitch.draw(ctx);

        // Flashback overlay
        this.flashback.draw(ctx, this);

        // Cutscene overlay
        this.cutscene.draw(ctx);

        // Pause screen
        if (this.state.is('pause')) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, CONFIG.INTERNAL_WIDTH, CONFIG.INTERNAL_HEIGHT);
            ctx.fillStyle = '#fff';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('ПАУЗА', CONFIG.INTERNAL_WIDTH / 2, CONFIG.INTERNAL_HEIGHT / 2 - 16);
            ctx.fillStyle = '#888';
            ctx.fillText('Esc - продолжить', CONFIG.INTERNAL_WIDTH / 2, CONFIG.INTERNAL_HEIGHT / 2);
            ctx.fillText('N - записки | M - звук', CONFIG.INTERNAL_WIDTH / 2, CONFIG.INTERNAL_HEIGHT / 2 + 12);
            // Show sanity hint
            const level = this.sanity.level;
            const sanityHints = {
                stable: '', mild: 'Что-то не так...', moderate: 'Стены шевелятся...',
                severe: 'Я теряю себя...', critical: 'Где я? Кто я?'
            };
            if (sanityHints[level]) {
                ctx.fillStyle = '#553333';
                ctx.fillText(sanityHints[level], CONFIG.INTERNAL_WIDTH / 2, CONFIG.INTERNAL_HEIGHT / 2 + 28);
            }
        }
    }

    drawMinimalHUD(ctx) {
        // No bars! Only subtle visual cues
        const w = CONFIG.INTERNAL_WIDTH;

        // Sprint indicator: small dots at bottom-left, fade when low
        if (this.sprint.sprinting || this.sprint.stamina < 80) {
            const stam = this.sprint.stamina / 100;
            const dots = Math.ceil(stam * 5);
            for (let i = 0; i < 5; i++) {
                ctx.fillStyle = i < dots
                    ? (this.sprint.sprinting ? '#ffcc00' : '#666')
                    : '#222';
                ctx.fillRect(4 + i * 4, CONFIG.INTERNAL_HEIGHT - 6, 2, 2);
            }
        }

        // Breath indicator: small circle that shrinks
        if (this.breath.holding || this.breath.breathStamina < 80) {
            const bstam = this.breath.breathStamina / 100;
            const size = Math.max(1, Math.floor(bstam * 4));
            ctx.fillStyle = this.breath.holding ? '#4488ff' : '#444';
            ctx.fillRect(w - 8, CONFIG.INTERNAL_HEIGHT - 8, size, size);
        }
    }

    renderEnding() {
        const ctx = this.renderer.ictx;
        const w = CONFIG.INTERNAL_WIDTH;
        const h = CONFIG.INTERNAL_HEIGHT;
        const t = this.titleTimer;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (this.endingType === 'A') {
            const brightness = Math.min(240, 80 + t * 30);
            const warm = Math.min(20, t * 4);
            this.renderer.clear(`rgb(${brightness},${brightness - warm * 0.5},${brightness - warm})`);

            ctx.fillStyle = `rgba(255,220,100,${Math.min(0.4, t * 0.05)})`;
            for (let i = 0; i < 20; i++) {
                const px = (Math.sin(t * 0.3 + i * 1.3) * 0.4 + 0.5) * w;
                const py = (Math.cos(t * 0.2 + i * 0.9) * 0.4 + 0.5) * h;
                ctx.fillRect(px, py, 2, 2);
            }

            const textAlpha = Math.min(1, (t - 1) * 0.3);
            ctx.globalAlpha = textAlpha;
            ctx.fillStyle = '#333';
            ctx.font = '10px monospace';
            ctx.fillText('Пробуждение', w / 2, h / 3);
            ctx.font = '8px monospace';
            ctx.fillStyle = '#555';
            ctx.fillText('Мила открыла глаза.', w / 2, h / 2);
            if (t > 3) ctx.fillText('Впервые за долгое время -', w / 2, h / 2 + 14);
            if (t > 4.5) ctx.fillText('по-настоящему.', w / 2, h / 2 + 28);
            ctx.globalAlpha = 1;

        } else if (this.endingType === 'B') {
            this.renderer.clear('#000');

            const shrink = Math.min(1, t * 0.08);
            const boxW = w * (1 - shrink);
            const boxH = h * (1 - shrink);
            if (boxW > 2) {
                ctx.fillStyle = `rgba(30,30,35,${0.5 - shrink * 0.4})`;
                ctx.fillRect((w - boxW) / 2, (h - boxH) / 2, boxW, boxH);
            }

            const dotAlpha = Math.max(0, 1 - t * 0.1);
            if (dotAlpha > 0) {
                ctx.fillStyle = `rgba(255,255,255,${dotAlpha})`;
                ctx.fillRect(w / 2, h / 2, 1, 1);
            }

            if (t > 5) {
                const textAlpha = Math.min(0.5, (t - 5) * 0.1);
                ctx.globalAlpha = textAlpha;
                ctx.fillStyle = '#333';
                ctx.font = '8px monospace';
                ctx.fillText('Забвение', w / 2, h - 24);
                ctx.globalAlpha = 1;
            }

        } else if (this.endingType === 'C') {
            this.renderer.clear('#000');

            if (Math.random() < 0.1) {
                const gy = Math.floor(Math.random() * h);
                ctx.fillStyle = `rgba(${Math.random()*100},${Math.random()*100},${Math.random()*100},0.2)`;
                ctx.fillRect(0, gy, w, 2);
            }

            const loopAlpha = Math.min(1, t * 0.4);
            ctx.globalAlpha = loopAlpha;
            ctx.fillStyle = '#666';
            ctx.font = '8px monospace';
            ctx.fillText('Петля', w / 2, h / 3);

            for (let i = 0; i < Math.min(5, Math.floor(t)); i++) {
                ctx.globalAlpha = 0.08 + i * 0.03;
                ctx.fillStyle = '#444';
                const ox = Math.sin(t + i * 2) * 3;
                ctx.fillText('Снова и снова...', w / 2 + ox, h / 2 + i * 10);
            }
            ctx.globalAlpha = 1;

        } else if (this.endingType === 'D') {
            // === SECRET 4TH ENDING: "Acceptance" / "Прощение" ===
            const phase = Math.min(1, t / 8);
            const r = Math.floor(20 + phase * 60);
            const g = Math.floor(15 + phase * 50);
            const b = Math.floor(40 + phase * 80);
            this.renderer.clear(`rgb(${r},${g},${b})`);

            // Stars appearing
            ctx.fillStyle = '#fff';
            for (let i = 0; i < Math.min(30, Math.floor(t * 3)); i++) {
                const sx = ((i * 37 + 13) % w);
                const sy = ((i * 53 + 7) % (h - 30));
                const flicker = Math.sin(t * 2 + i) > 0 ? 1 : 0.3;
                ctx.globalAlpha = Math.min(flicker, (t - i * 0.3) * 0.5);
                ctx.fillRect(sx, sy, 1, 1);
            }
            ctx.globalAlpha = 1;

            if (t > 2) {
                const textAlpha = Math.min(1, (t - 2) * 0.2);
                ctx.globalAlpha = textAlpha;
                ctx.fillStyle = '#c8b8e8';
                ctx.font = '10px monospace';
                ctx.fillText('Прощение', w / 2, h / 3);
                ctx.font = '8px monospace';
                ctx.fillStyle = '#a898c8';
                if (t > 4) ctx.fillText('Тень растворяется.', w / 2, h / 2);
                if (t > 5.5) ctx.fillText('Не исчезает — становится частью.', w / 2, h / 2 + 14);
                if (t > 7) ctx.fillText('Мила открывает глаза.', w / 2, h / 2 + 28);
                if (t > 8.5) ctx.fillText('И помнит всё. И принимает.', w / 2, h / 2 + 42);
                if (t > 10) {
                    ctx.fillStyle = '#887898';
                    ctx.fillText('И прощает.', w / 2, h / 2 + 60);
                }
                ctx.globalAlpha = 1;
            }
        }

        // Press key hint
        if (t > 3) {
            const hintAlpha = Math.min(0.6, (t - 3) * 0.2);
            ctx.globalAlpha = hintAlpha;
            ctx.fillStyle = '#555';
            ctx.font = '8px monospace';
            ctx.fillText('Enter', w / 2, h - 8);
            ctx.globalAlpha = 1;
        }
    }
}

window.addEventListener('load', () => {
    const game = new Game();
    game.init();
});
