class GardenRoom extends Room {
    constructor() {
        super({
            name: 'garden',
            width: 16,
            height: 12,
            palette: CONFIG.PALETTES.garden,
            tilesetName: 'garden',
            playerStart: { x: 8, y: 10 },
            effects: [
                { name: 'vignette', params: { strength: 0.4 } },
                { name: 'hueShift', params: { amount: 10 } },
                { name: 'pulse', params: { speed: 0.3, amount: 0.08 } }
            ],
            ambientParticle: (ps, g) => {
                ParticlePresets.ash(ps, Math.random() * 16 * 16, 0);
                if (Math.random() < 0.15) ParticlePresets.embers(ps, Math.random() * 16 * 16, 12 * 16);
            }
        });
    }

    build(game) {
        const w = this.width, h = this.height;
        const ground = new Array(w * h).fill(0);
        const walls = new Array(w * h).fill(0);
        const objects = new Array(w * h).fill(0);

        // Ground
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                ground[y * w + x] = 1;
            }
        }

        // Walls (trees at edges)
        for (let x = 0; x < w; x++) {
            walls[x] = 2;
            walls[(h - 1) * w + x] = 3;
        }
        for (let y = 0; y < h; y++) {
            walls[y * w] = 3;
            walls[y * w + (w - 1)] = 3;
        }

        // Dead trees scattered
        const treePositions = [
            { x: 3, y: 2 }, { x: 12, y: 3 }, { x: 5, y: 7 },
            { x: 13, y: 8 }, { x: 2, y: 9 }, { x: 10, y: 5 }
        ];
        treePositions.forEach(p => {
            objects[p.y * w + p.x] = 6; // dead tree
            this.tilemap && this.tilemap.setCollision(p.x, p.y, true);
        });

        // Grave in center
        objects[5 * w + 8] = 7;

        // Four flowerbeds
        const flowerbeds = [
            { x: 6, y: 3, flag: 'gardenFlower1' },
            { x: 10, y: 3, flag: 'gardenFlower2' },
            { x: 6, y: 8, flag: 'gardenFlower3' },
            { x: 10, y: 8, flag: 'gardenFlower4' },
        ];
        flowerbeds.forEach(fb => {
            const planted = game.state.getFlag(fb.flag);
            objects[fb.y * w + fb.x] = planted ? 9 : 8; // planted or empty
        });

        // Exit
        objects[(h - 1) * w + 8] = 5;
        ground[(h - 1) * w + 8] = 1;

        this.tilemap = new Tilemap(w, h, { ground, walls, objects });
        this.tilemap.setCollision(8, h - 1, false);

        // Make trees solid
        treePositions.forEach(p => {
            this.tilemap.setCollision(p.x, p.y, true);
        });

        this.triggers.clear();

        // Grave interaction
        this.triggers.add(new Trigger(8, 5, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show(DIALOGUES.gardenGrave, g);
            }
        }));

        // Flowerbed triggers
        flowerbeds.forEach(fb => {
            this.triggers.add(new Trigger(fb.x, fb.y, 1, 1, {
                onInteract: (g) => {
                    if (!g.state.getFlag(fb.flag)) {
                        g.state.setFlag(fb.flag, true);
                        this.tilemap.setTile('objects', fb.x, fb.y, 9);
                        g.dialogue.show(DIALOGUES.gardenFlowerPlanted, g);
                        g.audio.playConfirm();
                        this.checkGardenComplete(g);
                    }
                }
            }));
        });

        // Exit trigger
        this.triggers.add(new Trigger(8, h - 1, 1, 1, {
            onEnter: (g) => {
                g.changeRoom('corridor', 3, 9);
            }
        }));

        this.built = true;
    }

    checkGardenComplete(game) {
        if (game.puzzle.checkGardenComplete(game)) {
            game.state.setFlag('puzzleGardenDone', true);
            game.dialogue.show(DIALOGUES.gardenChoice, game);
        }
    }

    enter(game) {
        super.enter(game);
        if (!game.state.getFlag('visitedGarden')) {
            game.eventManager.trigger('onEnterGarden', game);
        }

        // Lullaby in garden
        setTimeout(() => {
            if (game.currentRoom === this) {
                game.audio.playLullaby();
            }
        }, 3000);

        // Shadow
        setTimeout(() => {
            if (game.currentRoom === this && game.shadow) {
                game.shadow.baseSpeed = 2.0;
                game.shadow.activate(14, 1);
            }
        }, 15000);
    }
}
