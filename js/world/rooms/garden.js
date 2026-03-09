class GardenRoom extends Room {
    constructor() {
        super({
            name: 'garden',
            width: 22,
            height: 16,
            palette: CONFIG.PALETTES.garden,
            tilesetName: 'garden',
            playerStart: { x: 11, y: 14 },
            effects: [
                { name: 'vignette', params: { strength: 0.4 } },
                { name: 'hueShift', params: { amount: 10 } },
                { name: 'pulse', params: { speed: 0.3, amount: 0.08 } }
            ],
            ambientParticle: (ps, g) => {
                ParticlePresets.ash(ps, Math.random() * 22 * 16, 0);
                if (Math.random() < 0.15) ParticlePresets.embers(ps, Math.random() * 22 * 16, 16 * 16);
            }
        });
    }

    build(game) {
        const w = this.width, h = this.height;
        const ground = new Array(w * h).fill(0);
        const walls = new Array(w * h).fill(0);
        const objects = new Array(w * h).fill(0);

        const allPlanted = game.state.getFlag('puzzleGardenDone');

        // All walls first
        for (let i = 0; i < w * h; i++) walls[i] = 3;

        // Main area
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                ground[y * w + x] = 1;
                walls[y * w + x] = 0;
            }
        }

        // Border hedge walls
        for (let x = 0; x < w; x++) {
            walls[x] = 2;
            walls[(h - 1) * w + x] = 3;
        }
        for (let y = 0; y < h; y++) {
            walls[y * w] = 3;
            walls[y * w + (w - 1)] = 3;
        }

        // === HEDGE MAZE in left area (x:1-9, y:1-7) ===
        // Creates a small hedge area before the main garden
        const hedgeWalls = [
            // Vertical hedges
            { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 },
            { x: 8, y: 2 }, { x: 8, y: 3 }, { x: 8, y: 4 },
            { x: 4, y: 5 }, { x: 4, y: 6 },
            // Horizontal hedges
            { x: 5, y: 4 }, { x: 6, y: 4 },
            { x: 1, y: 4 }, { x: 2, y: 4 },
        ];
        hedgeWalls.forEach(p => {
            walls[p.y * w + p.x] = 3;
            objects[p.y * w + p.x] = 6; // dead tree/hedge
        });

        // === CENTRAL PATH (y:8-9, full width) ===
        // Cobblestone path
        for (let x = 1; x < w - 1; x++) {
            ground[8 * w + x] = 1;
            ground[9 * w + x] = 1;
        }

        // === GRAVE AREA (center, x:9-13, y:3-7) ===
        // Clear area around grave
        // Grave itself
        objects[5 * w + 11] = 7; // gravestone

        // === FOUR FLOWERBEDS (around the grave, cardinal positions) ===
        const flowerbeds = [
            { x: 9, y: 3, flag: 'gardenFlower1' },
            { x: 13, y: 3, flag: 'gardenFlower2' },
            { x: 9, y: 7, flag: 'gardenFlower3' },
            { x: 13, y: 7, flag: 'gardenFlower4' },
        ];
        flowerbeds.forEach(fb => {
            const planted = game.state.getFlag(fb.flag);
            objects[fb.y * w + fb.x] = planted ? 9 : 8;
        });

        // === DEAD TREES scattered ===
        const treePositions = [
            { x: 16, y: 2 }, { x: 19, y: 4 }, { x: 2, y: 10 },
            { x: 6, y: 12 }, { x: 18, y: 11 }, { x: 15, y: 8 },
            { x: 20, y: 7 }, { x: 3, y: 8 }
        ];
        treePositions.forEach(p => {
            objects[p.y * w + p.x] = 6;
        });

        // === BENCH (south of grave, on the path) ===
        objects[9 * w + 7] = 7;

        // === POND (right area, x:16-19, y:10-12) ===
        for (let y = 10; y <= 12; y++) {
            for (let x = 16; x <= 18; x++) {
                ground[y * w + x] = 13; // water
                objects[y * w + x] = 0;
            }
        }

        // === RUSTED GATE / FENCE (top-right, decorative) ===
        objects[1 * w + 15] = 7;
        objects[1 * w + 16] = 7;
        objects[1 * w + 17] = 7;

        // Exit
        objects[(h - 1) * w + 11] = 5;
        ground[(h - 1) * w + 11] = 1;

        this.tilemap = new Tilemap(w, h, { ground, walls, objects });
        this.tilemap.setCollision(11, h - 1, false);

        // Make trees solid
        treePositions.forEach(p => {
            this.tilemap.setCollision(p.x, p.y, true);
        });

        // Make pond walkable (but slowly)
        for (let y = 10; y <= 12; y++) {
            for (let x = 16; x <= 18; x++) {
                this.tilemap.setCollision(x, y, false);
            }
        }

        this.triggers.clear();

        // === GRAVE ===
        this.triggers.add(new Trigger(11, 5, 1, 1, {
            onInteract: (g) => {
                g.notes.find('noteGarden1', g);
                if (g.inventory.has('childDrawing')) {
                    g.dialogue.show(DIALOGUES.gardenGrave, g, () => {
                        g.dialogue.show({
                            lines: [
                                { text: '*Рисунок в руках дрожит. Положить его на могилу?*', speaker: 'narrator' },
                                { text: '*Бабушка... это тебе. От маленькой меня.*', speaker: 'mila' },
                                { text: '*Цветы на рисунке... они как настоящие.*', speaker: 'narrator' }
                            ]
                        }, g, () => {
                            g.inventory.remove('childDrawing');
                            g.state.setFlag('drawingOnGrave', true);
                            if (g.sanity) g.sanity.onMemoryAccepted();
                            g.audio.playMemoryAccept();
                            g.effects.flash(0.5, '#ffe8c0');
                        });
                    });
                } else if (allPlanted) {
                    g.dialogue.show({
                        lines: [
                            { text: '*Могила в окружении цветов. Имя проступает...*', speaker: 'narrator' },
                            { text: '*"Нина Петровна. Бабушка."*', speaker: 'mila' },
                            { text: '*Я скучаю.*', speaker: 'mila' }
                        ]
                    }, g);
                } else {
                    g.dialogue.show(DIALOGUES.gardenGrave, g);
                }
            }
        }));

        // === BENCH ===
        this.triggers.add(new Trigger(7, 9, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show(DIALOGUES.gardenBench, g);
            }
        }));

        // === POND ===
        this.triggers.add(new Trigger(17, 11, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show(DIALOGUES.gardenPond, g);
                g.audio.playWaterAmbient();
            }
        }));

        // === HEDGE MAZE hidden note ===
        this.triggers.add(new Trigger(6, 2, 1, 1, {
            onInteract: (g) => {
                if (g.notes.find('noteGarden2', g)) {
                    g.dialogue.show({
                        lines: [
                            { text: '*Засохшая ромашка между ветвей.*', speaker: 'narrator' },
                            { text: '*Бабушка дарила такие. "Ромашка — цветок надежды."*', speaker: 'mila' }
                        ]
                    }, g);
                }
            }
        }));

        // === RUSTED GATE ===
        this.triggers.add(new Trigger(16, 1, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Ржавые ворота. Когда-то здесь был вход в сад.*', speaker: 'narrator' },
                        { text: '*Теперь всё заросло. Как мои воспоминания.*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // === FLOWERBEDS ===
        flowerbeds.forEach(fb => {
            this.triggers.add(new Trigger(fb.x, fb.y, 1, 1, {
                onInteract: (g) => {
                    if (!g.state.getFlag(fb.flag)) {
                        g.state.setFlag(fb.flag, true);
                        this.tilemap.setTile('objects', fb.x, fb.y, 9);
                        g.dialogue.show(DIALOGUES.gardenFlowerPlanted, g);
                        g.audio.playConfirm();
                        this.checkGardenComplete(g);
                    } else {
                        g.dialogue.show({
                            lines: [{ text: '*Цветок растёт. Маленький. Упрямый. Как я.*', speaker: 'mila' }]
                        }, g);
                    }
                }
            }));
        });

        // Exit
        this.triggers.add(new Trigger(11, h - 1, 1, 1, {
            onEnter: (g) => {
                g.changeRoom('corridor', 3, 11);
            }
        }));

        this.built = true;
    }

    checkGardenComplete(game) {
        if (game.puzzle.checkGardenComplete(game)) {
            game.state.setFlag('puzzleGardenDone', true);
            game.dialogue.show(DIALOGUES.gardenChoice, game, () => {
                if (game.cutscene && CUTSCENES.grandmotherMemory) {
                    game.state.change('cutscene');
                    game.cutscene.start(CUTSCENES.grandmotherMemory, game, () => {
                        game.state.change('playing');
                    });
                }
            });
        }
    }

    update(dt, game) {
        super.update(dt, game);

        // Wind
        this._windTimer = (this._windTimer || 0) + dt;
        if (this._windTimer >= 7) {
            this._windTimer = 0;
            if (game.audio) game.audio.playWindAmbient();
        }
    }

    enter(game) {
        super.enter(game);
        game.state.incrementFlag('_gardenVisits');

        if (!game.state.getFlag('visitedGarden')) {
            game.eventManager.trigger('onEnterGarden', game);
            if (game.flashback && FLASHBACKS.garden) {
                setTimeout(() => {
                    if (game.currentRoom === this) {
                        game.flashback.start(FLASHBACKS.garden, game);
                    }
                }, 1500);
            }
        } else if (game.state.getFlag('puzzleGardenDone')) {
            const visits = game.state.getFlag('_gardenVisits') || 1;
            if (visits > 1) {
                setTimeout(() => {
                    if (game.currentRoom === this) {
                        game.dialogue.show({
                            lines: [{ text: '*Цветы... их стало больше. Пепел оседает медленнее.*', speaker: 'mila' }]
                        }, game);
                    }
                }, 2000);
            }
        }

        // Lullaby
        setTimeout(() => {
            if (game.currentRoom === this) {
                game.audio.playLullaby();
            }
        }, 3000);

        // Shadow
        setTimeout(() => {
            if (game.currentRoom === this && game.shadow) {
                game.shadow.baseSpeed = 2.0;
                game.shadow.activate(20, 1);
            }
        }, 18000);
    }
}
