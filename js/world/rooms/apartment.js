class ApartmentRoom extends Room {
    constructor() {
        super({
            name: 'apartment',
            width: 20,
            height: 14,
            palette: CONFIG.PALETTES.apartment,
            tilesetName: 'apartment',
            playerStart: { x: 10, y: 12 },
            effects: [
                { name: 'vignette', params: { strength: 0.6 } },
                { name: 'chromatic', params: { offset: 1 } },
                { name: 'noise', params: { intensity: 0.03 } },
                { name: 'rain', params: { intensity: 0.15 } }
            ],
            ambientParticle: (ps, g) => {
                ParticlePresets.waterDrip(ps, Math.random() * 20 * 16, 0);
                if (Math.random() < 0.3) ParticlePresets.static(ps, Math.random() * 20 * 16, Math.random() * 14 * 16);
            }
        });
    }

    build(game) {
        const w = this.width, h = this.height;
        const ground = new Array(w * h).fill(0);
        const walls = new Array(w * h).fill(0);
        const objects = new Array(w * h).fill(0);

        const visitCount = game.state.getFlag('_apartmentVisits') || 0;
        const waterLevel = Math.min(h - 2, (h - 4) + Math.floor(visitCount * 0.5));

        // Outer walls
        for (let x = 0; x < w; x++) {
            walls[x] = 2;
            walls[(h - 1) * w + x] = 3;
        }
        for (let y = 0; y < h; y++) {
            walls[y * w] = 3;
            walls[y * w + (w - 1)] = 3;
        }

        // Floor with water in lower area
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                ground[y * w + x] = y >= waterLevel ? 13 : 1;
            }
        }

        // === ZONE DIVIDERS ===
        // Vertical wall splitting: left = living room (x:1-9), right = bedroom+bathroom (x:11-18)
        for (let y = 1; y < 8; y++) {
            walls[y * w + 10] = 3;
        }
        // Doorway between zones
        walls[5 * w + 10] = 0;
        ground[5 * w + 10] = 1;

        // Horizontal wall in right zone: top = bedroom (y:1-5), bottom = bathroom (y:7-12)
        for (let x = 11; x < w - 1; x++) {
            walls[6 * w + x] = 3;
        }
        // Doorway
        walls[6 * w + 14] = 0;
        ground[6 * w + 14] = 1;

        // === LIVING ROOM (left zone) ===
        // TV on north wall
        objects[1 * w + 3] = 6;
        // Couch
        objects[4 * w + 3] = 7;
        objects[4 * w + 4] = 7;
        // Coffee table
        objects[5 * w + 5] = 7;
        // Tilted bookshelf
        objects[3 * w + 8] = 7;
        // Window
        objects[1 * w + 6] = 10;
        // Radio on shelf
        objects[2 * w + 8] = 14;
        // Clock on wall
        objects[1 * w + 1] = 14;
        // Phone on floor (dropped)
        objects[7 * w + 2] = 14;

        // === BEDROOM (top-right) ===
        // Bed
        objects[2 * w + 14] = 6;
        objects[2 * w + 15] = 6;
        // Nightstand
        objects[2 * w + 17] = 7;
        // Window
        objects[1 * w + 13] = 10;
        // Photo on nightstand (fragment 1)
        if (!game.inventory.has('photoFragment1')) {
            objects[3 * w + 17] = 8;
        }

        // === BATHROOM (bottom-right) ===
        // Mirror
        objects[7 * w + 16] = 10;
        // Bathtub outline
        objects[8 * w + 12] = 7;
        objects[8 * w + 13] = 7;
        // Water in bathtub
        objects[9 * w + 12] = 13;
        objects[9 * w + 13] = 13;
        // Photo fragment 2 near bathtub
        if (!game.inventory.has('photoFragment2')) {
            objects[10 * w + 15] = 8;
        }

        // === KITCHEN AREA (bottom of living room) ===
        // Counter
        objects[8 * w + 5] = 7;
        objects[8 * w + 6] = 7;
        // Fridge
        objects[8 * w + 8] = 7;
        // Photo fragment 3 behind fridge
        if (!game.inventory.has('photoFragment3')) {
            objects[9 * w + 8] = 8;
        }

        // Exit door
        objects[(h - 1) * w + 10] = 5;
        ground[(h - 1) * w + 10] = 1;

        this.tilemap = new Tilemap(w, h, { ground, walls, objects });
        this.tilemap.setCollision(10, h - 1, false);
        this.tilemap.setCollision(10, 5, false); // zone doorway
        this.tilemap.setCollision(14, 6, false); // bathroom doorway

        // Water passable
        for (let y = waterLevel; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                if (walls[y * w + x] === 0) {
                    this.tilemap.setCollision(x, y, false);
                }
            }
        }

        this.triggers.clear();

        // === LIVING ROOM TRIGGERS ===
        // TV
        this.triggers.add(new Trigger(3, 1, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show(DIALOGUES.apartmentTV, g);
                g.audio.playGlitch();
            }
        }));

        // Radio (voices from reality)
        this.triggers.add(new Trigger(8, 2, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show(DIALOGUES.apartmentRadio, g);
                g.audio.playRadioStatic(true);
            }
        }));

        // Clock
        this.triggers.add(new Trigger(1, 1, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show(DIALOGUES.apartmentClock, g);
                g.audio.playClockTick();
            }
        }));

        // Window
        this.triggers.add(new Trigger(6, 1, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show(DIALOGUES.apartmentWindow, g);
                g.audio.playWindAmbient();
            }
        }));

        // Phone on floor
        this.triggers.add(new Trigger(2, 7, 1, 1, {
            onInteract: (g) => {
                if (g.notes.find('noteApartment3', g)) {
                    g.dialogue.show({
                        lines: [
                            { text: '*Телефон на полу. Экран треснут. Черновик сообщения.*', speaker: 'narrator' },
                            { text: '*"Мам, мне плохо. Можешь приехать?" Не отправлено.*', speaker: 'mila' },
                            { text: '*Почему я не нажала "отправить"?*', speaker: 'mila' }
                        ]
                    }, g);
                }
            }
        }));

        // Bookshelf
        this.triggers.add(new Trigger(8, 3, 1, 1, {
            onInteract: (g) => {
                if (g.notes.find('noteApartment1', g)) {
                    g.dialogue.show({
                        lines: [
                            { text: '*Книжная полка. Все книги мокрые, разбухшие.*', speaker: 'narrator' },
                            { text: '*"Психология одиночества." Закладка на странице 47.*', speaker: 'mila' }
                        ]
                    }, g);
                }
            }
        }));

        // === BEDROOM TRIGGERS ===
        // Photo fragment 1
        this.triggers.add(new Trigger(17, 3, 1, 1, {
            onInteract: (g) => {
                if (!g.inventory.has('photoFragment1')) {
                    g.inventory.add(ITEMS.photoFragment1);
                    this.tilemap.setTile('objects', 17, 3, 0);
                    g.dialogue.show({ lines: [{ text: '*Фрагмент фотографии на тумбочке. Угол... рука ребёнка.*', speaker: 'mila' }] }, g);
                    g.audio.playItemPickup();
                    this.checkPhotoComplete(g);
                }
            }
        }));

        // Bedroom window
        this.triggers.add(new Trigger(13, 1, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Окно спальни. Шторы порваны.*', speaker: 'narrator' },
                        { text: '*Сквозь них видно... ничего. Белую стену.*', speaker: 'mila' },
                        { text: '*Или палату. Границы размываются.*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // Bed
        this.triggers.add(new Trigger(14, 2, 2, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Кровать. Мокрая от чёрной воды.*', speaker: 'narrator' },
                        { text: '*Сколько ночей я лежала здесь, глядя в потолок?*', speaker: 'mila' },
                        { text: '*Считала трещины. Считала причины не вставать.*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // === BATHROOM TRIGGERS ===
        // Mirror
        this.triggers.add(new Trigger(16, 7, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show(DIALOGUES.apartmentMirror, g);
                g.audio.playGlitch();
                g.effects.flash(0.2, '#446');
            }
        }));

        // Photo fragment 2
        this.triggers.add(new Trigger(15, 10, 1, 1, {
            onInteract: (g) => {
                if (!g.inventory.has('photoFragment2')) {
                    g.inventory.add(ITEMS.photoFragment2);
                    this.tilemap.setTile('objects', 15, 10, 0);
                    g.dialogue.show({ lines: [{ text: '*Фрагмент фотографии у ванны. Женский силуэт.*', speaker: 'mila' }] }, g);
                    g.audio.playItemPickup();
                    this.checkPhotoComplete(g);
                }
            }
        }));

        // Bathtub
        this.triggers.add(new Trigger(12, 8, 2, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Ванна полная чёрной воды. Поверхность не отражает ничего.*', speaker: 'narrator' },
                        { text: '*...нет. Она отражает лицо. Под водой.*', speaker: 'mila' },
                        { text: '*Моё лицо. Спящее.*', speaker: 'mila' }
                    ]
                }, g);
                g.audio.playWaterAmbient();
            }
        }));

        // === KITCHEN TRIGGERS ===
        // Photo fragment 3
        this.triggers.add(new Trigger(8, 9, 1, 1, {
            onInteract: (g) => {
                if (!g.inventory.has('photoFragment3')) {
                    g.inventory.add(ITEMS.photoFragment3);
                    g.audio.playItemPickup();
                    this.tilemap.setTile('objects', 8, 9, 0);
                    g.dialogue.show({ lines: [{ text: '*Последний фрагмент за холодильником. На нём — улыбка.*', speaker: 'mila' }] }, g);
                    this.checkPhotoComplete(g);
                }
            }
        }));

        // Fridge
        this.triggers.add(new Trigger(8, 8, 1, 1, {
            onInteract: (g) => {
                if (g.notes.find('noteApartment2', g)) {
                    g.dialogue.show({
                        lines: [
                            { text: '*На холодильнике магниты. Рисунок пятилетней Милы.*', speaker: 'narrator' },
                            { text: '*"Мама и я." Солнце. Цветы. Мир, который больше не существует.*', speaker: 'mila' }
                        ]
                    }, g);
                }
            }
        }));

        // Exit trigger
        this.triggers.add(new Trigger(10, h - 1, 1, 1, {
            onEnter: (g) => {
                g.changeRoom('corridor', 5, 19);
            }
        }));

        // === SECRET ROOM behind bookshelf ===
        this.triggers.add(new Trigger(9, 3, 1, 1, {
            onInteract: (g) => {
                if (g.state.getFlag('puzzleApartmentDone')) {
                    g.dialogue.show({
                        lines: [
                            { text: '*За сдвинутой полкой — маленькая дверь.*', speaker: 'narrator' },
                            { text: '*Моя комната... детская...*', speaker: 'mila' }
                        ]
                    }, g, () => {
                        g.audio.playDoorOpen();
                        g.changeRoom('childrenRoom');
                    });
                } else {
                    g.dialogue.show({
                        lines: [{ text: '*Тяжёлая полка. За ней что-то есть, но не сдвинуть.*', speaker: 'mila' }]
                    }, g);
                }
            }
        }));

        this.built = true;
    }

    checkPhotoComplete(game) {
        if (game.puzzle.checkPhotoComplete(game)) {
            game.state.setFlag('puzzleApartmentDone', true);
            game.dialogue.show(DIALOGUES.apartmentPhotoComplete, game, () => {
                game.dialogue.show(DIALOGUES.apartmentChoice, game, () => {
                    if (game.cutscene && CUTSCENES.motherLeft) {
                        game.state.change('cutscene');
                        game.cutscene.start(CUTSCENES.motherLeft, game, () => {
                            game.state.change('playing');
                        });
                    }
                });
            });
        }
    }

    update(dt, game) {
        super.update(dt, game);

        this._waterTimer = (this._waterTimer || 0) + dt;
        if (this._waterTimer >= 4) {
            this._waterTimer = 0;
            if (game.audio) game.audio.playDrip();
        }

        // Whispers at low sanity
        if (game.sanity && game.sanity.level !== 'stable') {
            this._whisperTimer = (this._whisperTimer || 0) + dt;
            if (this._whisperTimer >= 10) {
                this._whisperTimer = 0;
                if (game.audio) game.audio.playWhisper(Math.floor(Math.random() * 3));
            }
        }
    }

    enter(game) {
        super.enter(game);
        game.state.incrementFlag('_apartmentVisits');
        const visits = game.state.getFlag('_apartmentVisits') || 1;

        if (visits > 1 && visits <= 4) {
            setTimeout(() => {
                if (game.currentRoom === this) {
                    game.dialogue.show({
                        lines: [{ text: '*Вода поднялась. Её больше, чем в прошлый раз.*', speaker: 'mila' }]
                    }, game);
                }
            }, 2000);
        }

        if (!game.state.getFlag('visitedApartment')) {
            game.eventManager.trigger('onEnterApartment', game);
            if (game.flashback && FLASHBACKS.apartment) {
                setTimeout(() => {
                    if (game.currentRoom === this) {
                        game.flashback.start(FLASHBACKS.apartment, game);
                    }
                }, 1500);
            }
        }

        if (game.audio) game.audio.playWaterAmbient();

        setTimeout(() => {
            if (game.currentRoom === this && game.shadow) {
                game.shadow.baseSpeed = 1.8;
                game.shadow.activate(1, 1);
            }
        }, 15000);
    }
}
