class ApartmentRoom extends Room {
    constructor() {
        super({
            name: 'apartment',
            width: 14,
            height: 10,
            palette: CONFIG.PALETTES.apartment,
            tilesetName: 'apartment',
            playerStart: { x: 7, y: 8 },
            effects: [
                { name: 'vignette', params: { strength: 0.6 } },
                { name: 'chromatic', params: { offset: 1 } },
                { name: 'noise', params: { intensity: 0.03 } }
            ],
            ambientParticle: (ps, g) => {
                ParticlePresets.waterDrip(ps, Math.random() * 14 * 16, 0);
            }
        });
    }

    build(game) {
        const w = this.width, h = this.height;
        const ground = new Array(w * h).fill(0);
        const walls = new Array(w * h).fill(0);
        const objects = new Array(w * h).fill(0);

        // Floor (with water tiles at bottom rows)
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                ground[y * w + x] = y >= h - 3 ? 13 : 1; // water in lower area
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

        // TV
        objects[2 * w + 3] = 6;
        // Tilted furniture
        objects[3 * w + 8] = 7;
        objects[4 * w + 10] = 7;

        // Photo fragments scattered
        if (!game.inventory.has('photoFragment1')) {
            objects[3 * w + 2] = 8;
        }
        if (!game.inventory.has('photoFragment2')) {
            objects[5 * w + 11] = 8;
        }
        if (!game.inventory.has('photoFragment3')) {
            objects[6 * w + 5] = 8;
        }

        // Window
        objects[1 * w + 7] = 10;

        // Door back to corridor
        objects[(h - 1) * w + 7] = 5;
        ground[(h - 1) * w + 7] = 1;

        this.tilemap = new Tilemap(w, h, { ground, walls, objects });
        this.tilemap.setCollision(7, h - 1, false);

        // Make water passable
        for (let y = h - 3; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                this.tilemap.setCollision(x, y, false);
            }
        }

        this.triggers.clear();

        // TV interaction
        this.triggers.add(new Trigger(3, 2, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show(DIALOGUES.apartmentTV, g);
                g.audio.playGlitch();
            }
        }));

        // Photo fragments
        this.triggers.add(new Trigger(2, 3, 1, 1, {
            onInteract: (g) => {
                if (!g.inventory.has('photoFragment1')) {
                    g.inventory.add(ITEMS.photoFragment1);
                    this.tilemap.setTile('objects', 2, 3, 0);
                    g.dialogue.show({ lines: [{ text: '*Фрагмент фотографии. Угол... рука ребёнка.*', speaker: 'mila' }] }, g);
                    this.checkPhotoComplete(g);
                }
            }
        }));
        this.triggers.add(new Trigger(11, 5, 1, 1, {
            onInteract: (g) => {
                if (!g.inventory.has('photoFragment2')) {
                    g.inventory.add(ITEMS.photoFragment2);
                    this.tilemap.setTile('objects', 11, 5, 0);
                    g.dialogue.show({ lines: [{ text: '*Ещё один фрагмент. Женский силуэт.*', speaker: 'mila' }] }, g);
                    this.checkPhotoComplete(g);
                }
            }
        }));
        this.triggers.add(new Trigger(5, 6, 1, 1, {
            onInteract: (g) => {
                if (!g.inventory.has('photoFragment3')) {
                    g.inventory.add(ITEMS.photoFragment3);
                    this.tilemap.setTile('objects', 5, 6, 0);
                    g.dialogue.show({ lines: [{ text: '*Последний фрагмент? На нём - улыбка.*', speaker: 'mila' }] }, g);
                    this.checkPhotoComplete(g);
                }
            }
        }));

        // Exit
        this.triggers.add(new Trigger(7, h - 1, 1, 1, {
            onEnter: (g) => {
                g.changeRoom('corridor', 3, 15);
            }
        }));

        this.built = true;
    }

    checkPhotoComplete(game) {
        if (game.puzzle.checkPhotoComplete(game)) {
            game.state.setFlag('puzzleApartmentDone', true);
            game.dialogue.show(DIALOGUES.apartmentPhotoComplete, game, () => {
                game.dialogue.show(DIALOGUES.apartmentChoice, game);
            });
        }
    }

    enter(game) {
        super.enter(game);
        if (!game.state.getFlag('visitedApartment')) {
            game.eventManager.trigger('onEnterApartment', game);
        }

        // Activate shadow after a delay
        setTimeout(() => {
            if (game.currentRoom === this && game.shadow) {
                game.shadow.activate(1, 1);
                game.shadow.speed = 2.0;
            }
        }, 10000);
    }
}
