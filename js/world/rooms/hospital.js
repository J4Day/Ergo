class HospitalRoom extends Room {
    constructor() {
        super({
            name: 'hospital',
            width: 20,
            height: 14,
            palette: CONFIG.PALETTES.hospital,
            tilesetName: 'hospital',
            playerStart: { x: 10, y: 12 },
            effects: [
                { name: 'vignette', params: { strength: 0.5 } },
                { name: 'breathe', params: { speed: 0.8, amount: 1.5 } },
                { name: 'chromatic', params: { offset: 2 } },
                { name: 'noise', params: { intensity: 0.05 } },
                { name: 'pulse', params: { speed: 0.7, amount: 0.06 } }
            ]
        });
    }

    build(game) {
        const w = this.width, h = this.height;
        const ground = new Array(w * h).fill(0);
        const walls = new Array(w * h).fill(0);
        const objects = new Array(w * h).fill(0);

        const fix1 = game.state.getFlag('hospitalFix1');
        const fix2 = game.state.getFlag('hospitalFix2');
        const fix3 = game.state.getFlag('hospitalFix3');
        const fix4 = game.state.getFlag('hospitalFix4');
        const allFixed = fix1 && fix2 && fix3 && fix4;

        // Outer walls
        for (let x = 0; x < w; x++) {
            walls[x] = 2;
            walls[(h - 1) * w + x] = 3;
        }
        for (let y = 0; y < h; y++) {
            walls[y * w] = 3;
            walls[y * w + (w - 1)] = 3;
        }

        // Floor
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                ground[y * w + x] = 1;
            }
        }

        // === HOSPITAL CORRIDOR (bottom, y:9-12, full width) ===
        // This is the entry hallway

        // === WARD DIVIDER (y:8, separating corridor from patient area) ===
        for (let x = 1; x < w - 1; x++) {
            walls[8 * w + x] = 3;
        }
        // Two doorways
        walls[8 * w + 5] = 0;
        ground[8 * w + 5] = 1;
        walls[8 * w + 14] = 0;
        ground[8 * w + 14] = 1;

        // === LEFT WARD (x:1-9, y:1-7) - Mila's room ===
        // Bed (center of ward)
        objects[3 * w + 4] = 6;
        objects[3 * w + 5] = 6;
        // IV stand
        objects[2 * w + 7] = 14;
        // Monitor
        objects[4 * w + 8] = fix3 ? 14 : 11;
        // Window
        objects[1 * w + 2] = 10;
        objects[1 * w + 6] = 10;
        // Chair beside bed (for mother)
        objects[4 * w + 3] = fix4 ? 7 : 11;
        // Medical chart on wall
        objects[1 * w + 8] = 14;
        // Stains when unfixed
        if (!fix1) objects[3 * w + 6] = 11;
        if (!fix2) objects[5 * w + 2] = 12;

        // === RIGHT WARD (x:11-18, y:1-7) - Nurse station / other beds ===
        // Divider wall
        for (let y = 1; y < 8; y++) {
            walls[y * w + 10] = 3;
        }
        walls[5 * w + 10] = 0;
        ground[5 * w + 10] = 1;

        // Nurse desk
        objects[2 * w + 14] = 7;
        objects[2 * w + 15] = 7;
        // Filing cabinet
        objects[3 * w + 17] = 7;
        // Empty bed
        objects[5 * w + 13] = 6;
        // Window
        objects[1 * w + 13] = 10;
        objects[1 * w + 17] = 10;
        // Clock
        objects[1 * w + 15] = 14;

        // === CORRIDOR AREA (y:9-12) ===
        // Bench
        objects[10 * w + 3] = 7;
        // Vending machine (broken)
        objects[10 * w + 17] = 7;
        // Notice board
        objects[9 * w + 10] = 14;
        // Water cooler
        objects[11 * w + 8] = 7;

        // Exit door
        objects[(h - 1) * w + 10] = 5;
        ground[(h - 1) * w + 10] = 1;

        this.tilemap = new Tilemap(w, h, { ground, walls, objects });
        this.tilemap.setCollision(10, h - 1, false);
        this.tilemap.setCollision(5, 8, false);
        this.tilemap.setCollision(14, 8, false);
        this.tilemap.setCollision(10, 5, false);

        this.triggers.clear();

        // === FIX OBJECTS (in left ward) ===
        const fixObjects = [
            { x: 5, y: 3, flag: 'hospitalFix1', text: '*Кровать... медленно опускается на место. Бельё разглаживается.*' },
            { x: 2, y: 5, flag: 'hospitalFix2', text: '*Трещина в стене затягивается. За ней — тишина.*' },
            { x: 8, y: 4, flag: 'hospitalFix3', text: '*Монитор включается. Бип... бип... бип... Сердцебиение.*' },
            { x: 3, y: 4, flag: 'hospitalFix4', text: '*Стул разворачивается. Как будто кто-то только что встал.*' },
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

        // === IV drip interaction ===
        this.triggers.add(new Trigger(7, 2, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show(DIALOGUES.hospitalIV, g);
            }
        }));

        // === Windows ===
        this.triggers.add(new Trigger(2, 1, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*За окном — белый свет. Не дневной. Больничный.*', speaker: 'narrator' },
                        { text: '*Лампы дневного света. Коридор реанимации.*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // === Medical chart ===
        this.triggers.add(new Trigger(8, 1, 1, 1, {
            onInteract: (g) => {
                if (g.notes.find('noteHospital1', g)) {
                    g.dialogue.show({
                        lines: [
                            { text: '*Медкарта. "Падение с высоты 12м. ЧМТ тяжёлой степени."*', speaker: 'narrator' },
                            { text: '*"Перелом Th12-L1. Кома. Glasgow 6 баллов."*', speaker: 'narrator' },
                            { text: '*Это всё... обо мне.*', speaker: 'mila' }
                        ]
                    }, g);
                }
            }
        }));

        // === RIGHT WARD TRIGGERS ===
        // Nurse desk — records
        this.triggers.add(new Trigger(14, 2, 2, 1, {
            onInteract: (g) => {
                if (g.notes.find('noteHospital3', g)) {
                    g.dialogue.show({
                        lines: [
                            { text: '*Журнал дежурства медсестры.*', speaker: 'narrator' },
                            { text: '*"Мать пациентки палаты 7 отказывается уходить на ночь."*', speaker: 'narrator' },
                            { text: '*"Попросила поставить раскладушку. Разрешено."*', speaker: 'narrator' }
                        ]
                    }, g);
                }
            }
        }));

        // Filing cabinet — medical records
        this.triggers.add(new Trigger(17, 3, 1, 1, {
            onInteract: (g) => {
                if (allFixed && g.notes.find('noteHospital4', g)) {
                    g.dialogue.show(DIALOGUES.hospitalRecords, g);
                }
            }
        }));

        // Empty bed — other patient
        this.triggers.add(new Trigger(13, 5, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Пустая кровать. Бельё аккуратно сложено.*', speaker: 'narrator' },
                        { text: '*Кто-то выписался? Или...*', speaker: 'mila' },
                        { text: '*Не думай об этом.*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // Clock
        this.triggers.add(new Trigger(15, 1, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Часы показывают 3:47. Всегда 3:47.*', speaker: 'narrator' },
                        { text: '*Время, когда я...*', speaker: 'mila' }
                    ]
                }, g);
                g.audio.playClockTick();
            }
        }));

        // Right window
        this.triggers.add(new Trigger(17, 1, 1, 1, {
            onInteract: (g) => {
                if (g.notes.find('noteHospital2', g)) {
                    g.dialogue.show({
                        lines: [
                            { text: '*На подоконнике — записка. Мокрая от слёз.*', speaker: 'narrator' },
                            { text: '*"Милочка, я здесь. Прости меня. Вернись."*', speaker: 'mila' }
                        ]
                    }, g);
                }
            }
        }));

        // === CORRIDOR TRIGGERS ===
        // Notice board
        this.triggers.add(new Trigger(10, 9, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*"Отделение реанимации. Посещение: 10:00-12:00, 16:00-18:00."*', speaker: 'narrator' },
                        { text: '*"Исключение: палата 7 (по разрешению зав. отделением)."*', speaker: 'narrator' }
                    ]
                }, g);
            }
        }));

        // Bench
        this.triggers.add(new Trigger(3, 10, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Скамейка в коридоре. На ней кто-то забыл журнал.*', speaker: 'narrator' },
                        { text: '*"Жизнь после комы: истории тех, кто вернулся."*', speaker: 'mila' },
                        { text: '*Вернулся...*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // Vending machine
        this.triggers.add(new Trigger(17, 10, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Автомат сломан. Экран мигает.*', speaker: 'narrator' },
                        { text: '*На экране: "ВЫБЕРИ"*', speaker: 'narrator' }
                    ]
                }, g);
                g.audio.playGlitch();
            }
        }));

        // Exit
        this.triggers.add(new Trigger(10, h - 1, 1, 1, {
            onEnter: (g) => {
                g.changeRoom('corridor', 12, 7);
            }
        }));

        // === MOTHER NPC ===
        const motherNpc = new NPC(3, 3, {
            name: 'mother',
            sprite: game.spriteGen.cache.mother.idle,
            onInteract: (g) => {
                if (!g.state.getFlag('metMother')) {
                    g.state.setFlag('metMother', true);
                    g.dialogue.show(DIALOGUES.hospitalMother, g);
                    g.audio.playCrying();
                } else {
                    g.dialogue.show(DIALOGUES.motherTalk2, g);
                }
            }
        });
        const fixes = ['hospitalFix1', 'hospitalFix2', 'hospitalFix3', 'hospitalFix4']
            .filter(f => game.state.getFlag(f)).length;
        motherNpc.visible = fixes >= 2;
        this.entities.push(motherNpc);

        this.built = true;
    }

    checkHospitalComplete(game) {
        if (game.puzzle.checkHospitalComplete(game)) {
            game.state.setFlag('puzzleHospitalDone', true);

            for (const e of this.entities) {
                if (e.name === 'mother') e.visible = true;
            }

            game.effects.disable('breathe');
            game.camera.shake(3, 0.5);
            game.dialogue.show(DIALOGUES.hospitalChoice, game, () => {
                if (game.cutscene && CUTSCENES.hospitalReality) {
                    game.state.change('cutscene');
                    game.cutscene.start(CUTSCENES.hospitalReality, game, () => {
                        game.state.change('playing');
                    });
                }
            });
        } else {
            const fixes = ['hospitalFix1', 'hospitalFix2', 'hospitalFix3', 'hospitalFix4']
                .filter(f => game.state.getFlag(f)).length;
            if (fixes >= 2) {
                for (const e of this.entities) {
                    if (e.name === 'mother') e.visible = true;
                }
            }
        }
    }

    update(dt, game) {
        super.update(dt, game);
        // Heartbeat ambient
        if (this._heartbeatTimer !== undefined) {
            this._heartbeatTimer += dt;
            if (this._heartbeatTimer >= 2) {
                this._heartbeatTimer = 0;
                if (game.audio) game.audio.playHeartbeat();
            }
        }
    }

    enter(game) {
        super.enter(game);
        game.state.incrementFlag('_hospitalVisits');

        if (!game.state.getFlag('visitedHospital')) {
            game.eventManager.trigger('onEnterHospital', game);
            if (game.flashback && FLASHBACKS.hospital) {
                setTimeout(() => {
                    if (game.currentRoom === this) {
                        game.flashback.start(FLASHBACKS.hospital, game);
                    }
                }, 1500);
            }
        } else if (game.state.getFlag('puzzleHospitalDone')) {
            setTimeout(() => {
                if (game.currentRoom === this) {
                    game.dialogue.show({
                        lines: [{ text: '*Палата... чище. Мониторы пищат ровно. Покой.*', speaker: 'mila' }]
                    }, game);
                }
            }, 2000);
        }

        this._heartbeatTimer = 0;

        // Ghost patient in corridor
        if (game.state.getFlag('visitedHospital') && Math.random() < 0.3) {
            setTimeout(() => {
                if (game.currentRoom === this) {
                    const ghost = new NPC(8, 11, {
                        name: 'ghostPatient',
                        sprite: game.spriteGen.cache.shadow.idle,
                        solid: false,
                        onInteract: (g) => {
                            g.dialogue.show({
                                lines: [{ text: '*Бледная фигура в коридоре... другой пациент?*', speaker: 'mila' }]
                            }, g);
                        }
                    });
                    this.entities.push(ghost);
                    setTimeout(() => { ghost.visible = false; }, 7000);
                }
            }, 4000);
        }

        // Shadow
        setTimeout(() => {
            if (game.currentRoom === this && game.shadow) {
                game.shadow.baseSpeed = 1.3;
                game.shadow.activate(18, 1);
            }
        }, 12000);
    }
}
