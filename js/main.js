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

        this.renderer.clear('#000');

        // Title with glitch
        ctx.fillStyle = '#f0f0f0';
        ctx.font = '24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const titleX = w / 2 + (Math.random() < 0.03 ? (Math.random() - 0.5) * 8 : 0);
        ctx.fillText('ERGO', titleX, h / 3);

        // Subtitle
        ctx.fillStyle = '#666';
        ctx.font = '8px monospace';
        ctx.fillText('ergo // следовательно', w / 2, h / 3 + 20);

        // Glitch line
        if (Math.random() < 0.05) {
            const gy = Math.floor(Math.random() * h);
            ctx.fillStyle = `rgba(255,0,0,0.3)`;
            ctx.fillRect(0, gy, w, 1);
        }

        // Menu options
        const hasSave = this.saveSystem.hasSave();
        const options = ['Новая игра'];
        if (hasSave) {
            options.push('Продолжить');
            options.push('Удалить сохранение');
        }

        options.forEach((opt, i) => {
            const isSelected = i === this.menuSelection;
            ctx.fillStyle = isSelected ? '#fff' : '#555';
            ctx.font = '8px monospace';
            const prefix = isSelected ? '> ' : '  ';
            ctx.fillText(prefix + opt, w / 2, h / 2 + 20 + i * 16);
        });

        // Bottom hint
        ctx.fillStyle = '#333';
        ctx.fillText('WASD / стрелки - движение  |  Enter/Z - действие  |  M - звук', w / 2, h - 12);

        // VHS scanlines
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        for (let y = 0; y < h; y += 2) {
            ctx.fillRect(0, y, w, 1);
        }
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

        if (this.endingType === 'A') {
            // Awakening - white screen with text
            this.renderer.clear('#f0f0f0');
            ctx.fillStyle = '#333';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Конец A: Пробуждение', w / 2, h / 3);
            ctx.fillStyle = '#666';
            ctx.font = '8px monospace';
            ctx.fillText('Мила открыла глаза.', w / 2, h / 2);
            ctx.fillText('Впервые за долгое время - по-настоящему.', w / 2, h / 2 + 14);
        } else if (this.endingType === 'B') {
            // Oblivion - black screen
            this.renderer.clear('#000');
            // Slowly shrinking white dot
            const size = Math.max(0, 4 - this.titleTimer * 0.5);
            if (size > 0) {
                ctx.fillStyle = '#fff';
                ctx.fillRect(w / 2 - size / 2, h / 2 - size / 2, size, size);
            }
            ctx.fillStyle = '#444';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            if (this.titleTimer > 3) {
                ctx.fillText('Конец B: Забвение', w / 2, h - 20);
            }
        } else if (this.endingType === 'C') {
            // Loop
            this.renderer.clear('#000');
            ctx.fillStyle = '#888';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Конец C: Петля', w / 2, h / 3);
            ctx.fillStyle = '#555';
            ctx.fillText('Снова и снова...', w / 2, h / 2);
        }

        // Press key hint
        ctx.fillStyle = '#444';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Нажми Enter', w / 2, h - 8);
    }
}

window.addEventListener('load', () => {
    const game = new Game();
    game.init();
});
