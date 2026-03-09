class WhiteRoom extends Room {
    constructor() {
        super({
            name: 'whiteRoom',
            width: 16,
            height: 12,
            palette: CONFIG.PALETTES.whiteRoom,
            tilesetName: 'whiteRoom',
            playerStart: { x: 8, y: 8 },
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

        const decay = game.state.getFlag('whiteRoomDecay') || 0;

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

        // Central divider wall (creates two zones: left = empty, right = memory)
        for (let y = 2; y < 7; y++) {
            walls[y * w + 8] = 3;
        }
        // Gap in divider
        walls[5 * w + 8] = 0;
        ground[5 * w + 8] = 1;

        // Left zone: start area — clean, white
        // A single chair in center-left
        objects[5 * w + 4] = 7;

        // Right zone: memory/decay area
        // Mirror on right wall
        objects[3 * w + 14] = 10;
        // Small table
        objects[6 * w + 12] = 7;

        // Door at top center
        walls[8] = 0;
        ground[8] = 1;
        objects[8] = 4;

        // Note on floor (first visit)
        if (!game.state.getFlag('gameStarted')) {
            objects[6 * w + 8] = 14;
        }

        // Decay progression: cracks spread from right zone
        const crackPositions = [
            { x: 12, y: 3 }, { x: 14, y: 5 }, { x: 10, y: 7 },
            { x: 6, y: 4 }, { x: 3, y: 6 }, { x: 2, y: 2 },
            { x: 13, y: 8 }, { x: 5, y: 9 }
        ];
        for (let i = 0; i < Math.min(decay, crackPositions.length); i++) {
            const cp = crackPositions[i];
            objects[cp.y * w + cp.x] = 12;
        }

        // Stains at higher decay
        if (decay >= 3) {
            objects[4 * w + 10] = 11;
            objects[7 * w + 3] = 11;
        }
        if (decay >= 4) {
            objects[3 * w + 5] = 11;
            objects[8 * w + 13] = 11;
        }

        // At high decay, divider wall starts breaking
        if (decay >= 4) {
            walls[3 * w + 8] = 0;
            ground[3 * w + 8] = 1;
            objects[3 * w + 8] = 12;
        }

        this.tilemap = new Tilemap(w, h, { ground, walls, objects });
        this.tilemap.setCollision(8, 0, false);
        // Make divider gap passable
        this.tilemap.setCollision(8, 5, false);
        if (decay >= 4) this.tilemap.setCollision(8, 3, false);

        this.triggers.clear();

        // Note trigger
        this.triggers.add(new Trigger(8, 6, 1, 1, {
            onInteract: (g) => {
                g.notes.find('noteWhiteRoom1', g);
                g.dialogue.show(DIALOGUES.whiteRoomNote, g);
            }
        }));

        // Chair interaction
        this.triggers.add(new Trigger(4, 5, 1, 1, {
            onInteract: (g) => {
                if (decay < 2) {
                    g.dialogue.show({
                        lines: [
                            { text: '*Единственный стул в пустой комнате. Для кого он?*', speaker: 'mila' },
                            { text: '*Для того, кто ждёт. Для того, кто решает.*', speaker: 'narrator' }
                        ]
                    }, g);
                } else {
                    g.dialogue.show({
                        lines: [
                            { text: '*Стул покосился. Одна ножка треснула.*', speaker: 'narrator' },
                            { text: '*Как и всё остальное здесь.*', speaker: 'mila' }
                        ]
                    }, g);
                }
            }
        }));

        // Mirror (right zone)
        this.triggers.add(new Trigger(14, 3, 1, 1, {
            onInteract: (g) => {
                if (decay < 3) {
                    g.dialogue.show({
                        lines: [
                            { text: '*Зеркало. Отражение... моё? Глаза другие.*', speaker: 'mila' },
                            { text: '*Они смотрят на меня с... жалостью?*', speaker: 'mila' }
                        ]
                    }, g);
                } else {
                    g.dialogue.show({
                        lines: [
                            { text: '*Зеркало треснуло. В осколках — разные лица.*', speaker: 'narrator' },
                            { text: '*Маленькая я. Школьная я. Больничная я.*', speaker: 'mila' },
                            { text: '*Все мои версии. Все сломанные.*', speaker: 'mila' }
                        ]
                    }, g);
                    g.audio.playGlitch();
                }
            }
        }));

        // Table (right zone)
        this.triggers.add(new Trigger(12, 6, 1, 1, {
            onInteract: (g) => {
                if (g.notes.find('noteWhiteRoom2', g)) {
                    g.dialogue.show({
                        lines: [
                            { text: '*На столе — бланк. "Информированное согласие на лечение."*', speaker: 'narrator' },
                            { text: '*Подпись... моя? Дата стёрта.*', speaker: 'mila' }
                        ]
                    }, g);
                }
            }
        }));

        // Crack interactions (high decay)
        if (decay >= 2) {
            this.triggers.add(new Trigger(12, 3, 1, 1, {
                onInteract: (g) => {
                    g.dialogue.show({
                        lines: [
                            { text: '*Сквозь трещину... звук. Бип... бип... бип...*', speaker: 'narrator' },
                            { text: '*Монитор? В реальности?*', speaker: 'mila' }
                        ]
                    }, g);
                    g.audio.playRadioStatic(true);
                }
            }));
        }

        // NG+ meta note
        if (game.meta && game.meta.isNewGamePlus && decay >= 3) {
            this.triggers.add(new Trigger(10, 7, 1, 1, {
                onInteract: (g) => {
                    const noteText = LORE_NOTES.noteMeta1.text.replace('{loopCount}', g.meta.data.totalLoops || '?');
                    if (g.notes.find('noteMeta1', g)) {
                        g.dialogue.show({
                            lines: [{ text: noteText, speaker: 'narrator' }]
                        }, g);
                    }
                }
            }));
        }

        // Door to corridor
        this.triggers.add(new Trigger(8, 0, 1, 1, {
            onEnter: (g) => {
                g.changeRoom('corridor', 7, 13);
            }
        }));

        this.built = true;
    }

    enter(game) {
        super.enter(game);

        if (!game.state.getFlag('gameStarted')) {
            game.eventManager.trigger('onGameStart', game);

            if (game.meta && game.meta.isNewGamePlus) {
                setTimeout(() => {
                    if (game.currentRoom === this) {
                        const meta = game.meta.knownByGame;
                        let extraLine = null;
                        if (meta.loopedBefore) {
                            extraLine = { text: '*...Подождите. Я уже была здесь. Я помню.*', speaker: 'mila' };
                        } else if (meta.diedBefore) {
                            extraLine = { text: '*...Что-то знакомое. Дежавю?*', speaker: 'mila' };
                        }
                        if (extraLine) {
                            game.dialogue.show({ lines: [extraLine] }, game);
                        }
                    }
                }, 3000);
            }
        } else {
            game.eventManager.trigger('onWhiteRoomReturn', game);

            const decay = game.state.getFlag('whiteRoomDecay') || 0;
            if (decay === 3) {
                setTimeout(() => {
                    if (game.currentRoom === this) {
                        game.dialogue.show(DIALOGUES.whiteRoomDecay3, game);
                        game.audio.playRadioStatic(true);
                    }
                }, 3000);
            } else if (decay >= 5) {
                setTimeout(() => {
                    if (game.currentRoom === this) {
                        game.dialogue.show(DIALOGUES.whiteRoomDecay5, game);
                        game.audio.playBreathing();
                    }
                }, 3000);
            }
        }

        // Moments of silence
        const decay = game.state.getFlag('whiteRoomDecay') || 0;
        if (decay >= 3 && Math.random() < 0.3) {
            setTimeout(() => {
                if (game.currentRoom === this) {
                    game.triggerSilence(4);
                }
            }, 8000);
        }

        game.saveSystem.save(game);
    }
}
