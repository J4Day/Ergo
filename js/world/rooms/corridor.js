class CorridorRoom extends Room {
    constructor() {
        super({
            name: 'corridor',
            width: 15,
            height: 24,
            palette: CONFIG.PALETTES.corridor,
            tilesetName: 'corridor',
            playerStart: { x: 7, y: 22 },
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

        // Fill everything as wall first
        for (let i = 0; i < w * h; i++) walls[i] = 3;

        // Main corridor path (center, 5 tiles wide)
        for (let y = 0; y < h; y++) {
            for (let x = 4; x < 11; x++) {
                ground[y * w + x] = 1;
                walls[y * w + x] = 0;
            }
        }

        // Top wall
        for (let x = 0; x < w; x++) walls[x] = 2;

        // === ALCOVES for each door (make rooms feel like destinations) ===

        // Alcove left for Apartment door (y:18-19, x:1-4)
        for (let y = 17; y <= 19; y++) {
            for (let x = 1; x < 4; x++) {
                ground[y * w + x] = 1;
                walls[y * w + x] = 0;
            }
        }

        // Alcove right for School door (y:14-16, x:11-14)
        for (let y = 13; y <= 15; y++) {
            for (let x = 11; x < 14; x++) {
                ground[y * w + x] = 1;
                walls[y * w + x] = 0;
            }
        }

        // Alcove left for Garden door (y:10-12, x:1-4)
        for (let y = 9; y <= 11; y++) {
            for (let x = 1; x < 4; x++) {
                ground[y * w + x] = 1;
                walls[y * w + x] = 0;
            }
        }

        // Alcove right for Hospital door (y:6-8, x:11-14)
        for (let y = 5; y <= 7; y++) {
            for (let x = 11; x < 14; x++) {
                ground[y * w + x] = 1;
                walls[y * w + x] = 0;
            }
        }

        // Wider area at top for Void + Doctor (y:1-4, x:3-12)
        for (let y = 1; y < 5; y++) {
            for (let x = 3; x < 12; x++) {
                ground[y * w + x] = 1;
                walls[y * w + x] = 0;
            }
        }

        // === LANDMARKS: distinctive objects near each door ===
        // Apartment: puddle/water stain
        objects[18 * w + 2] = 13; // water tile
        // School: desk fragment
        objects[14 * w + 12] = 7;
        // Garden: dead flower
        objects[10 * w + 2] = 9;
        // Hospital: medical symbol
        objects[6 * w + 12] = 14;

        // Wall decorations — windows
        objects[16 * w + 3] = 10; // window near apartment
        objects[12 * w + 11] = 10; // window near school
        objects[8 * w + 3] = 10; // window near garden
        objects[4 * w + 11] = 10; // window near hospital

        // Cracks in walls (increases with decay)
        const decay = game.state.getFlag('whiteRoomDecay') || 0;
        if (decay >= 1) objects[20 * w + 4] = 12;
        if (decay >= 2) objects[11 * w + 10] = 12;
        if (decay >= 3) objects[7 * w + 4] = 12;
        if (decay >= 4) objects[3 * w + 10] = 12;

        // Floor notes
        objects[20 * w + 6] = 14;
        objects[12 * w + 7] = 14;

        // 5 doors
        const doors = [
            { x: 2, y: 18, room: 'apartment', label: 'Квартира' },
            { x: 12, y: 14, room: 'school', label: 'Школа' },
            { x: 2, y: 10, room: 'garden', label: 'Сад' },
            { x: 12, y: 6, room: 'hospital', label: 'Больница' },
            { x: 7, y: 2, room: 'void', label: 'Пустота' },
        ];

        doors.forEach(door => {
            objects[door.y * w + door.x] = 4;
            walls[door.y * w + door.x] = 0;
            ground[door.y * w + door.x] = 1;
        });

        // Bottom exit to white room
        ground[(h - 1) * w + 7] = 1;
        walls[(h - 1) * w + 7] = 0;

        this.tilemap = new Tilemap(w, h, { ground, walls, objects });

        // Passability
        this.tilemap.setCollision(7, h - 1, false);
        doors.forEach(door => {
            this.tilemap.setCollision(door.x, door.y, false);
        });

        this.triggers.clear();

        // Door triggers with labels
        doors.forEach(door => {
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
                    g.audio.playDoorOpen();
                    g.changeRoom(door.room);
                }
            }));
        });

        // Window interactions (each shows different glimpse)
        const windowDialogues = [
            { x: 3, y: 16, lines: [
                { text: '*За окном — дождь. Бесконечный чёрный дождь.*', speaker: 'narrator' },
                { text: '*Или это капельница? Реальность просачивается...*', speaker: 'mila' }
            ]},
            { x: 11, y: 12, lines: [
                { text: '*В окне — школьный двор. Пустой. Качели скрипят.*', speaker: 'narrator' }
            ]},
            { x: 3, y: 8, lines: [
                { text: '*За стеклом — сад. Мёртвый, засыпанный пеплом.*', speaker: 'narrator' },
                { text: '*Но... один цветок? Живой?*', speaker: 'mila' }
            ]},
            { x: 11, y: 4, lines: [
                { text: '*Белый коридор. Люди в халатах. Каталка.*', speaker: 'narrator' },
                { text: '*Это... больница? Настоящая больница?*', speaker: 'mila' }
            ]}
        ];
        windowDialogues.forEach(wd => {
            this.triggers.add(new Trigger(wd.x, wd.y, 1, 1, {
                onInteract: (g) => {
                    g.dialogue.show({ lines: wd.lines }, g);
                    if (Math.random() < 0.3) g.audio.playWhisper(0);
                }
            }));
        });

        // Crack interactions
        if (decay >= 2) {
            this.triggers.add(new Trigger(10, 11, 1, 1, {
                onInteract: (g) => {
                    g.dialogue.show(DIALOGUES.corridorCrack, g);
                    g.audio.playRadioStatic(true);
                }
            }));
        }

        // Lore notes
        this.triggers.add(new Trigger(6, 20, 1, 1, {
            onInteract: (g) => {
                if (g.notes.find('noteCorridor1', g)) {
                    g.dialogue.show({
                        lines: [
                            { text: '*Бланк рецепта на полу.*', speaker: 'narrator' },
                            { text: '*"Пациент: М. ...ова. Диагноз: тяжёлый депрессивный эпизод."*', speaker: 'narrator' },
                            { text: '*"Суицидальная попытка. Кома."*', speaker: 'mila' }
                        ]
                    }, g);
                }
            }
        }));

        this.triggers.add(new Trigger(7, 12, 1, 1, {
            onInteract: (g) => {
                if (g.notes.find('noteCorridor2', g)) {
                    g.dialogue.show({
                        lines: [
                            { text: '*Страница из дневника. Детский почерк.*', speaker: 'narrator' },
                            { text: '*"Сегодня она снова не пришла. Мама сказала, что занята."*', speaker: 'mila' }
                        ]
                    }, g);
                }
            }
        }));

        // Exit back to white room
        this.triggers.add(new Trigger(7, h - 1, 1, 1, {
            onEnter: (g) => {
                g.changeRoom('whiteRoom', 8, 1);
            }
        }));

        // Doctor Lis NPC at the wide top area
        const doctor = new NPC(7, 3, {
            name: 'doctor',
            sprite: game.spriteGen.cache.doctor.idle,
            dialogueId: 'doctorHint',
            floatEffect: true,
            onInteract: (g) => {
                if (!g.state.getFlag('metDoctor')) {
                    g.eventManager.trigger('onEnterCorridor', g);
                } else {
                    g.state.incrementFlag('doctorTalks');
                    const talks = g.state.getFlag('doctorTalks') || 0;
                    if (talks >= 5 && g.meta && g.meta.isNewGamePlus) {
                        g.dialogue.show(DIALOGUES.doctorSecret, g, () => {
                            g.achievements.unlock('hiddenTruth');
                            g.achievements.unlock('listener');
                            if (g.notes) g.notes.find('noteDoctor1', g);
                        });
                    } else if (talks === 2) {
                        g.dialogue.show(DIALOGUES.doctorTalk2, g);
                    } else if (talks === 3) {
                        g.dialogue.show(DIALOGUES.doctorTalk3, g);
                    } else if (talks === 4) {
                        g.dialogue.show(DIALOGUES.doctorTalk4, g);
                    } else {
                        g.dialogue.show(DIALOGUES.doctorHint, g);
                    }
                }
            }
        });
        this.entities.push(doctor);

        // Roof access at very top
        const allVisited = game.state.getFlag('visitedApartment') &&
                          game.state.getFlag('visitedSchool') &&
                          game.state.getFlag('visitedGarden') &&
                          game.state.getFlag('visitedHospital');
        if (allVisited) {
            this.triggers.add(new Trigger(7, 0, 1, 1, {
                onInteract: (g) => {
                    g.dialogue.show({
                        lines: [
                            { text: '*Трещина в потолке. За ней — лестница наверх.*', speaker: 'narrator' },
                            { text: '*Крыша...*', speaker: 'mila' }
                        ]
                    }, g, () => {
                        g.audio.playDoorOpen();
                        g.changeRoom('roof');
                    });
                }
            }));
        }

        this.built = true;
    }

    enter(game) {
        super.enter(game);
        if (!game.state.getFlag('visitedCorridor')) {
            game.eventManager.trigger('onEnterCorridor', game);

            // Prologue cutscene
            if (game.cutscene && CUTSCENES.prologue) {
                setTimeout(() => {
                    if (game.currentRoom === this && !game.cutscene.active) {
                        game.state.change('cutscene');
                        game.cutscene.start(CUTSCENES.prologue, game, () => {
                            game.state.change('playing');
                        });
                    }
                }, 8000);
            }
        }

        // Random Little Mila sighting
        if (game.state.getFlag('metLittleMila') && Math.random() < 0.15) {
            game.state.incrementFlag('littleMilaSightings');
            setTimeout(() => {
                if (game.currentRoom === this) {
                    const littleMila = new NPC(4, 12, {
                        name: 'littleMilaGhost',
                        sprite: game.spriteGen.cache.littleMila.idle,
                        spriteOffsetY: 0,
                        solid: false,
                        onInteract: (g) => {
                            g.dialogue.show(DIALOGUES.littleMilaRandom, g);
                        }
                    });
                    this.entities.push(littleMila);
                    setTimeout(() => {
                        littleMila.visible = false;
                    }, 8000);
                }
            }, 5000);
        }

        // Ambient whispers in corridor
        if (game.state.getFlag('whiteRoomDecay') >= 2) {
            setTimeout(() => {
                if (game.currentRoom === this && game.audio) {
                    game.audio.playWhisper(1);
                }
            }, 10000);
        }
    }
}
