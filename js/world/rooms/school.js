class SchoolRoom extends Room {
    constructor() {
        super({
            name: 'school',
            width: 20,
            height: 16,
            palette: CONFIG.PALETTES.school,
            tilesetName: 'school',
            playerStart: { x: 10, y: 14 },
            effects: [
                { name: 'vignette', params: { strength: 0.7 } },
                { name: 'noise', params: { intensity: 0.04 } },
                { name: 'glitch', params: { intensity: 0.05 } },
                { name: 'eyes', params: { count: 4 } },
                { name: 'fog', params: { density: 0.08, color: '0,50,0' } }
            ]
        });
    }

    build(game) {
        const w = this.width, h = this.height;
        const ground = new Array(w * h).fill(0);
        const walls = new Array(w * h).fill(0);
        const objects = new Array(w * h).fill(0);

        // === OUTER WALLS ===
        for (let x = 0; x < w; x++) {
            walls[x] = 2;
            walls[(h - 1) * w + x] = 3;
        }
        for (let y = 0; y < h; y++) {
            walls[y * w] = 3;
            walls[y * w + (w - 1)] = 3;
        }

        // === FLOOR ===
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                ground[y * w + x] = 1;
            }
        }

        // === MAIN CORRIDOR (y:8-9, full width) ===
        // Already floored. Lockers along corridor walls.

        // === HORIZONTAL DIVIDER: corridor top wall (y:7) ===
        for (let x = 1; x < w - 1; x++) {
            walls[7 * w + x] = 3;
        }
        // Doorways into classrooms
        walls[7 * w + 4] = 0;  // left classroom door
        ground[7 * w + 4] = 1;
        walls[7 * w + 15] = 0; // right classroom door
        ground[7 * w + 15] = 1;

        // === HORIZONTAL DIVIDER: corridor bottom wall (y:10) ===
        for (let x = 1; x < w - 1; x++) {
            walls[10 * w + x] = 3;
        }
        // Doorways to south areas
        walls[10 * w + 4] = 0;  // storage/bathroom
        ground[10 * w + 4] = 1;
        walls[10 * w + 15] = 0; // teacher's office
        ground[10 * w + 15] = 1;

        // === LEFT CLASSROOM (x:1-8, y:1-6) ===
        // Blackboard on north wall
        objects[1 * w + 3] = 10;
        objects[1 * w + 4] = 10;
        objects[1 * w + 5] = 10;
        // Desks in rows
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 3; col++) {
                objects[(3 + row * 2) * w + (2 + col * 2)] = 7;
            }
        }
        // Teacher's desk (near blackboard)
        objects[2 * w + 7] = 7;
        // Window
        objects[1 * w + 1] = 10;

        // === VERTICAL DIVIDER between classrooms (x:9, y:1-6) ===
        for (let y = 1; y <= 6; y++) {
            walls[y * w + 9] = 3;
        }
        // Connecting door between classrooms
        walls[4 * w + 9] = 0;
        ground[4 * w + 9] = 1;

        // === RIGHT CLASSROOM (x:10-18, y:1-6) ===
        // Blackboard
        objects[1 * w + 13] = 10;
        objects[1 * w + 14] = 10;
        // Desks
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 3; col++) {
                objects[(3 + row * 2) * w + (11 + col * 2)] = 7;
            }
        }
        // Broken window
        objects[1 * w + 17] = 10;
        // Locker in corner
        objects[2 * w + 18] = 7;

        // === CORRIDOR DETAILS (y:8-9) ===
        // Lockers along top wall of corridor
        objects[8 * w + 2] = 7;
        objects[8 * w + 3] = 7;
        objects[8 * w + 7] = 7;
        objects[8 * w + 8] = 7;
        objects[8 * w + 11] = 7;
        objects[8 * w + 12] = 7;
        objects[8 * w + 17] = 7;
        objects[8 * w + 18] = 7;
        // Bench in corridor
        objects[9 * w + 10] = 7;
        // Notice board
        objects[8 * w + 10] = 14;

        // === STORAGE / BATHROOM (x:1-8, y:11-14) — south-left ===
        // Vertical divider
        for (let y = 11; y < h - 1; y++) {
            walls[y * w + 9] = 3;
        }
        // Shelves
        objects[11 * w + 2] = 7;
        objects[11 * w + 3] = 7;
        // Broken mirror
        objects[11 * w + 7] = 10;
        // Mop and bucket (decoration)
        objects[13 * w + 1] = 14;
        // Puddle
        objects[12 * w + 5] = 12;

        // === TEACHER'S OFFICE (x:10-18, y:11-14) — south-right ===
        // Teacher's desk
        objects[12 * w + 14] = 7;
        objects[12 * w + 15] = 7;
        // Filing cabinet
        objects[11 * w + 18] = 7;
        // Chair
        objects[13 * w + 14] = 7;
        // Photo on desk
        objects[12 * w + 16] = 14;
        // Window
        objects[11 * w + 11] = 10;

        // === EXIT DOOR (bottom center) ===
        objects[(h - 1) * w + 10] = 5;
        ground[(h - 1) * w + 10] = 1;

        this.tilemap = new Tilemap(w, h, { ground, walls, objects });
        this.tilemap.setCollision(10, h - 1, false);
        this.tilemap.setCollision(4, 7, false);
        this.tilemap.setCollision(15, 7, false);
        this.tilemap.setCollision(4, 10, false);
        this.tilemap.setCollision(15, 10, false);
        this.tilemap.setCollision(9, 4, false);

        this.triggers.clear();

        // === SOUND PUZZLE ===
        // 5 bells in different rooms. Correct order: C, D, E, G, A (0,1,2,3,4)
        this.soundSequence = [];
        this.soundTarget = [0, 1, 2, 3, 4];
        this.soundBells = [
            { x: 1, y: 2, note: 2 },   // E — left classroom, near window
            { x: 14, y: 3, note: 0 },   // C — right classroom, by desk
            { x: 18, y: 13, note: 4 },  // A — teacher's office, corner
            { x: 6, y: 9, note: 1 },    // D — corridor
            { x: 3, y: 13, note: 3 },   // G — storage room
        ];

        this.soundBells.forEach(bell => {
            objects[bell.y * w + bell.x] = 14;
            this.tilemap.setTile('objects', bell.x, bell.y, 14);
        });

        // Sound bell triggers
        this.soundBells.forEach(bell => {
            this.triggers.add(new Trigger(bell.x, bell.y, 1, 1, {
                onInteract: (g) => {
                    this.activateBell(bell.note, g);
                }
            }));
        });

        this._lastGuidePos = null;
        this._guideTimer = 0;

        // === LITTLE MILA NPC ===
        const littleMila = new NPC(5, 4, {
            name: 'littleMila',
            sprite: game.spriteGen.cache.littleMila.idle,
            spriteOffsetY: 0,
            onInteract: (g) => {
                if (!g.state.getFlag('metLittleMila')) {
                    g.state.setFlag('metLittleMila', true);
                    g.dialogue.show(DIALOGUES.schoolLittleMila, g, () => {
                        g.inventory.add(ITEMS.childDrawing);
                        g.dialogue.show({
                            lines: [
                                { text: '*На рисунке — пять нот. До, Ре, Ми, Соль, Ля.*', speaker: 'narrator' },
                                { text: '*Мамина колыбельная. Если найти колокольчики...*', speaker: 'mila' }
                            ]
                        }, g);
                    });
                } else if (g.inventory.has('childDrawing') && !g.state.getFlag('schoolSoundPuzzleDone')) {
                    g.dialogue.show({
                        lines: [
                            { text: 'Посмотри на рисунок! Там ноты — До, Ре, Ми, Соль, Ля!', speaker: 'littleMila' },
                            { text: 'Найди колокольчики и сыграй мелодию!', speaker: 'littleMila' }
                        ]
                    }, g);
                } else {
                    g.dialogue.show({
                        lines: [{ text: '*Маленькая Мила улыбается.*', speaker: 'narrator' }]
                    }, g);
                }
            }
        });
        this.entities.push(littleMila);

        // === LEFT CLASSROOM TRIGGERS ===
        // Blackboard
        this.triggers.add(new Trigger(3, 1, 3, 1, {
            onInteract: (g) => {
                g.dialogue.show(DIALOGUES.schoolBlackboard, g);
                g.audio.playGlitch();
            }
        }));

        // Window (left classroom)
        this.triggers.add(new Trigger(1, 1, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*За окном — школьный двор. Пустой.*', speaker: 'narrator' },
                        { text: '*Качели скрипят. Никого нет.*', speaker: 'mila' },
                        { text: '*Перемена, а я сидела в классе. Одна.*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // Teacher's desk (left classroom)
        this.triggers.add(new Trigger(7, 2, 1, 1, {
            onInteract: (g) => {
                if (g.notes.find('noteSchool1', g)) {
                    g.dialogue.show({
                        lines: [
                            { text: '*Учительский стол. Классный журнал открыт.*', speaker: 'narrator' },
                            { text: '*На парте: "Странная" — красным маркером.*', speaker: 'narrator' },
                            { text: '*Это не оценка. Это приговор.*', speaker: 'mila' }
                        ]
                    }, g);
                }
            }
        }));

        // Desk with note (left classroom)
        this.triggers.add(new Trigger(4, 3, 1, 1, {
            onInteract: (g) => {
                if (g.notes.find('noteSchool3', g)) {
                    g.dialogue.show({
                        lines: [
                            { text: '*Детский рисунок в парте. Девочка одна в углу.*', speaker: 'narrator' },
                            { text: '*Фигуры без лиц вокруг. Все смеются.*', speaker: 'narrator' }
                        ]
                    }, g);
                }
            }
        }));

        // === RIGHT CLASSROOM TRIGGERS ===
        // Blackboard (right)
        this.triggers.add(new Trigger(13, 1, 2, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*На доске мелом: \"ТИХОНЯ\" — большими буквами.*', speaker: 'narrator' },
                        { text: '*Внизу кто-то приписал: \"мы тебя видим\"*', speaker: 'narrator' },
                        { text: '*Видели? Нет. Они не видели ничего.*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // Broken window (right classroom)
        this.triggers.add(new Trigger(17, 1, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Окно разбито. Осколки на подоконнике.*', speaker: 'narrator' },
                        { text: '*Сквозь трещины слышен ветер. И голоса.*', speaker: 'mila' },
                        { text: '*\"Почему ты такая?\" \"Что с тобой не так?\"*', speaker: 'mila' }
                    ]
                }, g);
                g.audio.playWindAmbient();
            }
        }));

        // Locker in right classroom
        this.triggers.add(new Trigger(18, 2, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show(DIALOGUES.schoolLocker, g);
            }
        }));

        // Desk with diary (right classroom)
        this.triggers.add(new Trigger(11, 5, 1, 1, {
            onInteract: (g) => {
                if (g.notes.find('noteSchool2', g)) {
                    g.dialogue.show({
                        lines: [
                            { text: '*Дневник оценок. Все пятёрки.*', speaker: 'narrator' },
                            { text: '*\"Мила очень тихая. Нужно обратить внимание.\"*', speaker: 'narrator' },
                            { text: '*Никто не обратил.*', speaker: 'mila' }
                        ]
                    }, g);
                }
            }
        }));

        // === CORRIDOR TRIGGERS ===
        // Notice board
        this.triggers.add(new Trigger(10, 8, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Доска объявлений. \"Расписание на понедельник.\"*', speaker: 'narrator' },
                        { text: '*\"Психолог принимает вт, чт. Каб. 12.\"*', speaker: 'narrator' },
                        { text: '*Я так и не дошла до кабинета 12.*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // Bench
        this.triggers.add(new Trigger(10, 9, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Скамейка. Тут я ждала, пока все уйдут.*', speaker: 'narrator' },
                        { text: '*Проще быть последней, чем идти мимо них.*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // === STORAGE ROOM TRIGGERS (south-left) ===
        // Broken mirror
        this.triggers.add(new Trigger(7, 11, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Треснутое зеркало. Лицо в осколках.*', speaker: 'narrator' },
                        { text: '*Я разбила его. После того, что они сказали.*', speaker: 'mila' },
                        { text: '*Кровь на руке. Учительница не спросила почему.*', speaker: 'mila' }
                    ]
                }, g);
                g.audio.playGlitch();
                g.effects.flash(0.15, '#446');
            }
        }));

        // Puddle
        this.triggers.add(new Trigger(5, 12, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Лужа на полу. Отражение... не моё.*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // Mop
        this.triggers.add(new Trigger(1, 13, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Подсобка уборщицы. Единственная, кто здоровалась.*', speaker: 'mila' },
                        { text: '*\"Привет, солнышко.\" Так просто. Так важно.*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // === TEACHER'S OFFICE TRIGGERS (south-right) ===
        // Teacher's desk
        this.triggers.add(new Trigger(14, 12, 2, 1, {
            onInteract: (g) => {
                g.dialogue.show(DIALOGUES.schoolPhone, g);
            }
        }));

        // Filing cabinet
        this.triggers.add(new Trigger(18, 11, 1, 1, {
            onInteract: (g) => {
                if (g.notes.find('noteSchool4', g)) {
                    g.dialogue.show({
                        lines: [
                            { text: '*Личные дела учеников. Моё — тонкое.*', speaker: 'narrator' },
                            { text: '*\"Успеваемость отличная. Социализация — ниже нормы.\"*', speaker: 'narrator' },
                            { text: '*\"Рекомендовано наблюдение.\" Дата — два года назад.*', speaker: 'mila' },
                            { text: '*Два года. Наблюдали.*', speaker: 'mila' }
                        ]
                    }, g);
                }
            }
        }));

        // Photo on teacher's desk
        this.triggers.add(new Trigger(16, 12, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Фото класса. Все улыбаются.*', speaker: 'narrator' },
                        { text: '*Я стою с края. Почти обрезана.*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // Window in teacher's office
        this.triggers.add(new Trigger(11, 11, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Окно учительской. Вид на парковку.*', speaker: 'narrator' },
                        { text: '*Мама приезжала за мной каждый день. Ждала в машине.*', speaker: 'mila' },
                        { text: '*Я не хотела, чтобы кто-то видел.*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // === PUZZLE COMPLETION EXIT ===
        // Exit at bottom center — always leads back to corridor
        // But also the puzzle completion gate in right classroom corner
        this.triggers.add(new Trigger(18, 6, 1, 1, {
            onInteract: (g) => {
                if (g.state.getFlag('schoolSoundPuzzleDone') && !g.state.getFlag('puzzleSchoolDone')) {
                    g.state.setFlag('puzzleSchoolDone', true);
                    g.dialogue.show(DIALOGUES.schoolChoice, g, () => {
                        if (g.cutscene && CUTSCENES.schoolMemory) {
                            g.state.change('cutscene');
                            g.cutscene.start(CUTSCENES.schoolMemory, g, () => {
                                g.state.change('playing');
                            });
                        }
                    });
                } else if (!g.state.getFlag('schoolSoundPuzzleDone')) {
                    g.dialogue.show({
                        lines: [{ text: '*Шкафчик заперт. Мелодия... она откроет замок.*', speaker: 'mila' }]
                    }, g);
                }
            }
        }));

        // Exit to corridor
        this.triggers.add(new Trigger(10, h - 1, 1, 1, {
            onEnter: (g) => {
                g.changeRoom('corridor', 7, 13);
            }
        }));

        this.built = true;
    }

    activateBell(noteIndex, game) {
        this.soundSequence.push(noteIndex);
        const seqIdx = this.soundSequence.length - 1;
        const isCorrect = this.soundTarget[seqIdx] === noteIndex;

        game.audio.playSoundPuzzleTone(noteIndex, isCorrect);

        if (!isCorrect) {
            setTimeout(() => {
                game.audio.playSoundPuzzleError();
                game.dialogue.show({
                    lines: [{ text: '*Звук оборвался. Мелодия не та. Нужно начать сначала.*', speaker: 'narrator' }]
                }, game);
            }, 600);
            this.soundSequence = [];
            return;
        }

        const hints = [
            '*До... Первая нота.*',
            '*Ре... Мелодия поднимается.*',
            '*Ми... Что-то знакомое...*',
            '*Соль... Почти...*',
            '*Ля! Мелодия звучит!*'
        ];
        game.dialogue.show({
            lines: [{ text: hints[seqIdx], speaker: 'mila' }]
        }, game);

        if (this.soundSequence.length === this.soundTarget.length) {
            setTimeout(() => {
                game.audio.playSoundPuzzleComplete();
                game.camera.shake(2, 0.5);
                game.dialogue.show({
                    lines: [
                        { text: '*Мелодия из детства. Мамина колыбельная.*', speaker: 'mila' },
                        { text: '*Стены школы вздрагивают. Что-то открылось.*', speaker: 'narrator' }
                    ]
                }, game);
                game.state.setFlag('schoolSoundPuzzleDone', true);
                if (game.sanity) game.sanity.onPuzzleSolved();
            }, 800);
        }
    }

    updateSoundGuide(dt, game) {
        if (!game.player || game.state.getFlag('schoolSoundPuzzleDone')) return;

        this._guideTimer = (this._guideTimer || 0) + dt;
        if (this._guideTimer < 3) return;
        this._guideTimer = 0;

        const nextIdx = this.soundSequence.length;
        if (nextIdx >= this.soundTarget.length) return;

        const targetNote = this.soundTarget[nextIdx];
        const targetBell = this.soundBells.find(b => b.note === targetNote);
        if (!targetBell) return;

        const px = game.player.tileX;
        const py = game.player.tileY;
        const dist = Math.abs(px - targetBell.x) + Math.abs(py - targetBell.y);

        if (dist <= 2) {
            game.audio.playSoundPuzzleGuide('hot');
        } else if (dist <= 6) {
            game.audio.playSoundPuzzleGuide('warm');
        } else {
            game.audio.playSoundPuzzleGuide('cold');
        }
    }

    update(dt, game) {
        super.update(dt, game);
        this.updateSoundGuide(dt, game);
    }

    enter(game) {
        super.enter(game);
        game.state.incrementFlag('_schoolVisits');

        if (!game.state.getFlag('visitedSchool')) {
            game.eventManager.trigger('onEnterSchool', game);

            if (game.flashback && FLASHBACKS.school) {
                setTimeout(() => {
                    if (game.currentRoom === this) {
                        game.flashback.start(FLASHBACKS.school, game);
                    }
                }, 1500);
            }
        } else {
            setTimeout(() => {
                if (game.currentRoom === this) {
                    game.audio.playWhisper(1);
                    game.dialogue.show({
                        lines: [{ text: '*Коридоры школы... тише, чем я помню.*', speaker: 'mila' }]
                    }, game);
                }
            }, 2000);
        }

        if (!game.state.getFlag('schoolSoundPuzzleDone')) {
            setTimeout(() => {
                if (game.currentRoom === this) {
                    game.dialogue.show({
                        lines: [
                            { text: '*В школе спрятаны колокольчики. Их пять.*', speaker: 'narrator' },
                            { text: '*Если сыграть мелодию правильно... До, Ре, Ми, Соль, Ля...*', speaker: 'mila' }
                        ]
                    }, game);
                }
            }, 5000);
        }

        // Phantom children on revisit
        if (game.state.getFlag('visitedSchool')) {
            setTimeout(() => {
                if (game.currentRoom === this) {
                    const ghostChild = new NPC(12, 9, {
                        name: 'phantomChild',
                        sprite: game.spriteGen.cache.littleMila.idle,
                        solid: false,
                        onInteract: (g) => {
                            g.dialogue.show({
                                lines: [{ text: '*Фигура исчезает, как только я подхожу ближе.*', speaker: 'mila' }]
                            }, g);
                            ghostChild.visible = false;
                        }
                    });
                    ghostChild.visible = true;
                    this.entities.push(ghostChild);
                    setTimeout(() => { ghostChild.visible = false; }, 10000);
                }
            }, 6000);
        }

        // Shadow
        setTimeout(() => {
            if (game.currentRoom === this && game.shadow) {
                game.shadow.baseSpeed = 1.6;
                game.shadow.activate(18, 14);
            }
        }, 12000);
    }
}
