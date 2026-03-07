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
            void: new VoidRoom()
        };
    }

    changeRoom(roomName, playerX, playerY) {
        const room = this.rooms[roomName];
        if (!room) return;

        const doChange = () => {
            // Deactivate shadow
            this.shadow.deactivate();

            this.currentRoom = room;
            if (!room.built) room.build(this);

            const startX = playerX !== undefined ? playerX : room.playerStart.x;
            const startY = playerY !== undefined ? playerY : room.playerStart.y;
            this.player.teleport(startX, startY);

            room.enter(this);
            this.camera.follow(this.player, room.width, room.height);
            this.camera.x = this.camera.targetX;
            this.camera.y = this.camera.targetY;
        };

        if (this.state.is('playing') || this.state.is('dialogue')) {
            this.state.change('transition');
            this.transition.start('fade', 0.4, () => {
                doChange();
                // Only restore to 'playing' if room.enter() didn't change state
                // (e.g. to 'dialogue' via an event trigger)
                if (this.state.is('transition')) {
                    this.state.change('playing');
                }
            });
        } else {
            doChange();
            // Same guard: don't override if enter() started a dialogue
            if (!this.state.is('dialogue') && !this.state.is('cutscene')) {
                this.state.change('playing');
            }
        }
    }

    update(dt) {
        this.input.update();
        this.titleTimer += dt;

        // Transition always updates regardless of state
        if (this.transition.active) {
            this.transition.update(dt);
        }

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
                // transition already updated above
                break;
            case 'cutscene':
                this.dialogue.update(dt, this);
                break;
            case 'ending':
                this.updateEnding(dt);
                break;
            case 'pause':
                if (this.input.menu) {
                    this.state.change('playing');
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
                this.state.change('playing');
                this.changeRoom('whiteRoom');
            } else if (this.menuSelection === 1 && hasSave) {
                // Continue
                const data = this.saveSystem.load();
                this.state.change('playing');
                this.saveSystem.applySave(this, data);
            } else if (this.menuSelection === 2 && hasSave) {
                // Delete save
                this.saveSystem.deleteSave();
                this.menuSelection = 0;
            }
        }
    }

    updatePlaying(dt) {
        if (!this.currentRoom) return;

        this.player.update(dt, this);
        this.shadow.update(dt, this);
        this.currentRoom.update(dt, this);

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

        // Mute toggle
        if (this.input.isPressed('KeyM')) {
            this.audio.toggleMute();
        }
    }

    updateEnding(dt) {
        // Wait for any key to return to title
        if (this.input.confirm) {
            this.state.change('menu');
            this.endingType = null;
            this.effects.disableAll();
            this.audio.stopDrone();
            this.audio.stopPulse();
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
        this.renderer.present();
    }

    renderMenu() {
        const ctx = this.renderer.ictx;
        const w = CONFIG.INTERNAL_WIDTH;
        const h = CONFIG.INTERNAL_HEIGHT;
        const t = this.titleTimer;

        this.renderer.clear('#000');

        // Animated background — slow floating particles
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        for (let i = 0; i < 12; i++) {
            const px = (Math.sin(t * 0.2 + i * 1.7) * 0.5 + 0.5) * w;
            const py = (Math.cos(t * 0.15 + i * 2.3) * 0.5 + 0.5) * h;
            ctx.fillRect(px, py, 1, 1);
        }

        // Title with glitch + breathing scale effect
        const breathe = Math.sin(t * 0.8) * 0.02;
        ctx.save();
        ctx.translate(w / 2, h / 3);
        ctx.scale(1 + breathe, 1 + breathe);

        // Shadow behind title
        ctx.fillStyle = 'rgba(255,0,0,0.15)';
        const glitchOx = Math.random() < 0.04 ? (Math.random() - 0.5) * 8 : 0;
        ctx.font = '24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ERGO', glitchOx + 1, 1);

        ctx.fillStyle = '#f0f0f0';
        ctx.fillText('ERGO', glitchOx, 0);
        ctx.restore();

        // Subtitle with fade-in
        const subAlpha = Math.min(1, t * 0.3);
        ctx.globalAlpha = subAlpha;
        ctx.fillStyle = '#555';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('"следовательно"', w / 2, h / 3 + 22);
        ctx.globalAlpha = 1;

        // Glitch lines
        if (Math.random() < 0.06) {
            const gy = Math.floor(Math.random() * h);
            const gw = Math.floor(Math.random() * 60) + 20;
            const gx = Math.floor(Math.random() * (w - gw));
            ctx.fillStyle = `rgba(255,${Math.floor(Math.random()*50)},${Math.floor(Math.random()*50)},0.3)`;
            ctx.fillRect(gx, gy, gw, 1 + Math.floor(Math.random() * 2));
        }

        // Menu options with smooth cursor
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
        ctx.fillText('WASD - движение | Enter - действие | M - звук', w / 2, h - 10);

        // VHS scanlines
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        for (let y = 0; y < h; y += 2) {
            ctx.fillRect(0, y, w, 1);
        }

        // Vignette
        const gradient = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.7);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }

    renderGame() {
        const ctx = this.renderer.ictx;
        // Use room's darkest palette color as background instead of pure black
        const bgColor = this.currentRoom ? this.currentRoom.palette[this.currentRoom.palette.length - 1] : '#000';
        this.renderer.clear(bgColor);

        if (this.currentRoom) {
            this.currentRoom.draw(this.renderer, this.camera);
            // Draw player
            this.player.draw(this.renderer, this.camera);
            // Draw shadow
            this.shadow.draw(this.renderer, this.camera);
            // Draw room entities and particles
            this.currentRoom.drawEntities(this.renderer, this.camera);
        }

        // Post-processing effects
        this.effects.apply();

        // UI overlays
        this.transition.draw(ctx);
        this.dialogue.draw(ctx);
        this.inventory.draw(ctx);

        // Pause screen
        if (this.state.is('pause')) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, CONFIG.INTERNAL_WIDTH, CONFIG.INTERNAL_HEIGHT);
            ctx.fillStyle = '#fff';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('ПАУЗА', CONFIG.INTERNAL_WIDTH / 2, CONFIG.INTERNAL_HEIGHT / 2 - 8);
            ctx.fillStyle = '#888';
            ctx.fillText('Esc - продолжить  |  M - звук', CONFIG.INTERNAL_WIDTH / 2, CONFIG.INTERNAL_HEIGHT / 2 + 8);
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
            // Awakening — warm white fading in, golden particles
            const brightness = Math.min(240, 80 + t * 30);
            const warm = Math.min(20, t * 4);
            this.renderer.clear(`rgb(${brightness},${brightness - warm * 0.5},${brightness - warm})`);

            // Floating light particles
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
            // Oblivion — collapsing darkness
            this.renderer.clear('#000');

            // Shrinking room walls
            const shrink = Math.min(1, t * 0.08);
            const boxW = w * (1 - shrink);
            const boxH = h * (1 - shrink);
            if (boxW > 2) {
                ctx.fillStyle = `rgba(30,30,35,${0.5 - shrink * 0.4})`;
                ctx.fillRect((w - boxW) / 2, (h - boxH) / 2, boxW, boxH);
            }

            // Single fading pixel
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
            // Loop — glitching restart
            this.renderer.clear('#000');

            // Glitch noise
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

            // Repeating text with offset
            for (let i = 0; i < Math.min(5, Math.floor(t)); i++) {
                ctx.globalAlpha = 0.08 + i * 0.03;
                ctx.fillStyle = '#444';
                const ox = Math.sin(t + i * 2) * 3;
                ctx.fillText('Снова и снова...', w / 2 + ox, h / 2 + i * 10);
            }
            ctx.globalAlpha = 1;
        }

        // Press key hint (delayed)
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
