class HospitalRoom extends Room {
    constructor() {
        super({
            name: 'hospital',
            width: 12,
            height: 10,
            palette: CONFIG.PALETTES.hospital,
            tilesetName: 'hospital',
            playerStart: { x: 6, y: 8 },
            effects: [
                { name: 'vignette', params: { strength: 0.5 } },
                { name: 'breathe', params: { speed: 0.8, amount: 1.5 } },
                { name: 'chromatic', params: { offset: 2 } },
                { name: 'noise', params: { intensity: 0.05 } }
            ]
        });
    }

    build(game) {
        const w = this.width, h = this.height;
        const ground = new Array(w * h).fill(0);
        const walls = new Array(w * h).fill(0);
        const objects = new Array(w * h).fill(0);

        // Floor
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                ground[y * w + x] = 1;
            }
        }

        // Walls
        for (let x = 0; x < w; x++) {
            walls[x] = 2;
            walls[(h - 1) * w + x] = 3;
        }
        for (let y = 0; y < h; y++) {
            walls[y * w] = 3;
            walls[y * w + (w - 1)] = 3;
        }

        // Hospital bed (on ceiling initially, needs to be "fixed")
        const fix1 = game.state.getFlag('hospitalFix1');
        const fix2 = game.state.getFlag('hospitalFix2');
        const fix3 = game.state.getFlag('hospitalFix3');
        const fix4 = game.state.getFlag('hospitalFix4');

        // Bed - top area (upside down initially)
        objects[2 * w + 5] = 6; // bed
        objects[2 * w + 6] = 6;

        // Objects to fix: bed, window, door, monitor
        // Window
        objects[1 * w + 3] = 10;
        // Monitor area
        objects[4 * w + 9] = fix3 ? 14 : 11;
        // Chair
        objects[5 * w + 3] = fix4 ? 7 : 11;

        // Stains when unfixed
        if (!fix1) objects[3 * w + 5] = 11;
        if (!fix2) objects[3 * w + 9] = 12;

        // Mother NPC (appears when puzzle mostly done)
        // Exit
        objects[(h - 1) * w + 6] = 5;
        ground[(h - 1) * w + 6] = 1;

        this.tilemap = new Tilemap(w, h, { ground, walls, objects });
        this.tilemap.setCollision(6, h - 1, false);

        this.triggers.clear();

        // Fix objects triggers
        const fixObjects = [
            { x: 5, y: 2, flag: 'hospitalFix1', text: '*Кровать... опускается на пол. Встаёт на место.*' },
            { x: 9, y: 3, flag: 'hospitalFix2', text: '*Трещина в стене затягивается.*' },
            { x: 9, y: 4, flag: 'hospitalFix3', text: '*Монитор включается. Бип... бип... бип...*' },
            { x: 3, y: 5, flag: 'hospitalFix4', text: '*Стул разворачивается правильно.*' },
        ];

        fixObjects.forEach(obj => {
            this.triggers.add(new Trigger(obj.x, obj.y, 1, 1, {
                onInteract: (g) => {
                    if (!g.state.getFlag(obj.flag)) {
                        g.state.setFlag(obj.flag, true);
                        g.dialogue.show({
                            lines: [{ text: obj.text, speaker: 'narrator' }]
                        }, g);
                        g.camera.shake(2, 0.3);
                        g.audio.playConfirm();
                        this.checkHospitalComplete(g);
                    }
                }
            }));
        });

        // Exit
        this.triggers.add(new Trigger(6, h - 1, 1, 1, {
            onEnter: (g) => {
                g.changeRoom('corridor', 7, 7);
            }
        }));

        // Mother (appears after 2 fixes)
        const motherNpc = new NPC(3, 2, {
            name: 'mother',
            sprite: game.spriteGen.cache.mother.idle,
            onInteract: (g) => {
                g.state.setFlag('metMother', true);
                g.dialogue.show(DIALOGUES.hospitalMother, g);
            }
        });
        motherNpc.visible = (fix1 || false) && (fix2 || false);
        this.entities.push(motherNpc);

        this.built = true;
    }

    checkHospitalComplete(game) {
        if (game.puzzle.checkHospitalComplete(game)) {
            game.state.setFlag('puzzleHospitalDone', true);

            // Show mother
            for (const e of this.entities) {
                if (e.name === 'mother') {
                    e.visible = true;
                }
            }

            game.effects.disable('breathe');
            game.camera.shake(3, 0.5);
            game.dialogue.show(DIALOGUES.hospitalChoice, game);
        } else {
            // Show mother after 2 fixes
            const fixes = ['hospitalFix1', 'hospitalFix2', 'hospitalFix3', 'hospitalFix4']
                .filter(f => game.state.getFlag(f)).length;
            if (fixes >= 2) {
                for (const e of this.entities) {
                    if (e.name === 'mother') e.visible = true;
                }
            }
        }
    }

    enter(game) {
        super.enter(game);
        if (!game.state.getFlag('visitedHospital')) {
            game.eventManager.trigger('onEnterHospital', game);
        }

        // Heartbeat ambient
        this._heartbeatInterval = setInterval(() => {
            if (game.currentRoom === this) {
                game.audio.playHeartbeat();
            } else {
                clearInterval(this._heartbeatInterval);
            }
        }, 2000);

        // Shadow in hospital
        setTimeout(() => {
            if (game.currentRoom === this && game.shadow) {
                game.shadow.activate(10, 1);
                game.shadow.speed = 1.5;
            }
        }, 8000);
    }
}
