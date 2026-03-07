class WhiteRoom extends Room {
    constructor() {
        super({
            name: 'whiteRoom',
            width: 10,
            height: 8,
            palette: CONFIG.PALETTES.whiteRoom,
            tilesetName: 'whiteRoom',
            playerStart: { x: 5, y: 5 },
            effects: [
                { name: 'vignette', params: { strength: 0.3 } }
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
            walls[x] = 2; // top
            walls[(h - 1) * w + x] = 3; // bottom
        }
        for (let y = 0; y < h; y++) {
            walls[y * w] = 3; // left
            walls[y * w + (w - 1)] = 3; // right
        }

        // Door at top center (y=0, x=5)
        walls[5] = 0; // Clear wall at door position
        ground[5] = 1; // Floor under door position
        objects[5] = 4; // Door tile

        // Add cracks based on decay level
        const decay = game.state.getFlag('whiteRoomDecay') || 0;
        const crackPositions = [
            { x: 2, y: 2 }, { x: 7, y: 3 }, { x: 3, y: 5 },
            { x: 8, y: 6 }, { x: 1, y: 4 }
        ];
        for (let i = 0; i < Math.min(decay, crackPositions.length); i++) {
            const cp = crackPositions[i];
            objects[cp.y * w + cp.x] = 12; // crack tile
        }

        // Stains at higher decay
        if (decay >= 3) {
            objects[4 * w + 4] = 11; // stain
        }
        if (decay >= 4) {
            objects[3 * w + 7] = 11;
        }

        // Note on floor (first visit only)
        if (!game.state.getFlag('gameStarted')) {
            objects[4 * w + 5] = 14; // note (one tile above player start)
        }

        this.tilemap = new Tilemap(w, h, { ground, walls, objects });

        // Make door tile passable
        this.tilemap.setCollision(5, 0, false);

        // Triggers
        this.triggers.clear();

        // Note trigger
        this.triggers.add(new Trigger(5, 4, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show(DIALOGUES.whiteRoomNote, g);
            }
        }));

        // Door to corridor
        this.triggers.add(new Trigger(5, 0, 1, 1, {
            onEnter: (g) => {
                g.changeRoom('corridor', 5, 11);
            }
        }));

        this.built = true;
    }

    enter(game) {
        super.enter(game);

        // First visit
        if (!game.state.getFlag('gameStarted')) {
            game.eventManager.trigger('onGameStart', game);
        } else {
            game.eventManager.trigger('onWhiteRoomReturn', game);
        }

        // Save on entering white room
        game.saveSystem.save(game);
    }
}
