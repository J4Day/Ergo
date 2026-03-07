class CorridorRoom extends Room {
    constructor() {
        super({
            name: 'corridor',
            width: 11,
            height: 20,
            palette: CONFIG.PALETTES.corridor,
            tilesetName: 'corridor',
            playerStart: { x: 5, y: 18 },
            effects: [
                { name: 'vignette', params: { strength: 0.5 } },
                { name: 'noise', params: { intensity: 0.02 } }
            ]
        });
    }

    build(game) {
        const w = this.width, h = this.height;
        const ground = new Array(w * h).fill(0);
        const walls = new Array(w * h).fill(0);
        const objects = new Array(w * h).fill(0);

        // Floor corridor (center 5 tiles wide)
        for (let y = 0; y < h; y++) {
            for (let x = 3; x < 8; x++) {
                ground[y * w + x] = 1;
            }
        }

        // Walls on sides
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < 3; x++) walls[y * w + x] = 3;
            for (let x = 8; x < w; x++) walls[y * w + x] = 3;
        }
        // Top wall
        for (let x = 0; x < w; x++) walls[x] = 2;

        // 5 doors on alternating sides
        const doors = [
            { x: 3, y: 14, room: 'apartment', label: 'Квартира' },
            { x: 7, y: 12, room: 'school', label: 'Школа' },
            { x: 3, y: 8, room: 'garden', label: 'Сад' },
            { x: 7, y: 6, room: 'hospital', label: 'Больница' },
            { x: 5, y: 2, room: 'void', label: 'Пустота' },
        ];

        doors.forEach((door, i) => {
            objects[door.y * w + door.x] = 4; // door tile
            walls[door.y * w + door.x] = 0; // clear wall collision
            ground[door.y * w + door.x] = 1;

            const isVoid = door.room === 'void';

            this.triggers.add(new Trigger(door.x, door.y, 1, 1, {
                onInteract: (g) => {
                    if (isVoid) {
                        const allDone = g.state.getFlag('puzzleApartmentDone') &&
                                        g.state.getFlag('puzzleSchoolDone') &&
                                        g.state.getFlag('puzzleGardenDone') &&
                                        g.state.getFlag('puzzleHospitalDone');
                        if (!allDone) {
                            g.dialogue.show(DIALOGUES.corridorDoorLocked, g);
                            return;
                        }
                    }
                    g.changeRoom(door.room);
                }
            }));
        });

        // Exit back to white room
        ground[h * w - w + 5] = 1; // floor at bottom center
        this.triggers.add(new Trigger(5, h - 1, 1, 1, {
            onEnter: (g) => {
                g.changeRoom('whiteRoom', 5, 1);
            }
        }));

        this.tilemap = new Tilemap(w, h, { ground, walls, objects });
        this.tilemap.setCollision(5, h - 1, false);

        // Make door tiles passable for interaction
        doors.forEach(door => {
            this.tilemap.setCollision(door.x, door.y, false);
        });

        // Doctor Lис NPC at end of corridor
        const doctor = new NPC(5, 4, {
            name: 'doctor',
            sprite: game.spriteGen.cache.doctor.idle,
            dialogueId: 'doctorHint',
            floatEffect: true,
            onInteract: (g) => {
                if (!g.state.getFlag('metDoctor')) {
                    g.eventManager.trigger('onEnterCorridor', g);
                } else {
                    g.dialogue.show(DIALOGUES.doctorHint, g);
                }
            }
        });
        this.entities.push(doctor);

        this.built = true;
    }

    enter(game) {
        super.enter(game);
        if (!game.state.getFlag('visitedCorridor')) {
            game.eventManager.trigger('onEnterCorridor', game);
        }
    }
}
