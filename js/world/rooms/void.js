class VoidRoom extends Room {
    constructor() {
        super({
            name: 'void',
            width: 20,
            height: 16,
            palette: CONFIG.PALETTES.void,
            tilesetName: 'void',
            playerStart: { x: 10, y: 14 },
            effects: [
                { name: 'vignette', params: { strength: 0.8 } },
                { name: 'glitch', params: { intensity: 0.1 } },
                { name: 'chromatic', params: { offset: 3 } },
                { name: 'noise', params: { intensity: 0.06 } },
                { name: 'pulse', params: { speed: 0.4, amount: 0.12 } },
                { name: 'eyes', params: { count: 6 } }
            ]
        });
    }

    build(game) {
        const w = this.width, h = this.height;
        const ground = new Array(w * h).fill(0);
        const walls = new Array(w * h).fill(0);
        const objects = new Array(w * h).fill(0);

        // Nothing by default — void

        // === FRAGMENTED PATH (winding, not straight) ===
        // Entry platform (bottom center)
        for (let y = 13; y < 15; y++) {
            for (let x = 8; x < 13; x++) {
                ground[y * w + x] = 1;
            }
        }

        // Path segment 1: up-left (y:11-12, x:6-10)
        for (let y = 11; y <= 12; y++) {
            for (let x = 6; x <= 10; x++) {
                ground[y * w + x] = 1;
            }
        }

        // Path segment 2: narrow bridge (y:9-10, x:8-9)
        ground[9 * w + 8] = 1;
        ground[9 * w + 9] = 1;
        ground[10 * w + 8] = 1;
        ground[10 * w + 9] = 1;

        // Path segment 3: right platform (y:7-9, x:10-14)
        for (let y = 7; y <= 9; y++) {
            for (let x = 10; x <= 14; x++) {
                ground[y * w + x] = 1;
            }
        }

        // Path segment 4: narrow up (y:5-6, x:10-11)
        ground[5 * w + 10] = 1;
        ground[5 * w + 11] = 1;
        ground[6 * w + 10] = 1;
        ground[6 * w + 11] = 1;

        // Path segment 5: left wide area (y:3-5, x:6-12) — confrontation arena
        for (let y = 2; y <= 5; y++) {
            for (let x = 5; x <= 14; x++) {
                ground[y * w + x] = 1;
            }
        }

        // Isolated floating platforms with lore
        // Left platform
        ground[8 * w + 2] = 1;
        ground[8 * w + 3] = 1;
        ground[9 * w + 2] = 1;
        ground[9 * w + 3] = 1;

        // Right platform
        ground[5 * w + 17] = 1;
        ground[5 * w + 18] = 1;
        ground[6 * w + 17] = 1;
        ground[6 * w + 18] = 1;

        // Thin bridges to platforms
        ground[9 * w + 4] = 1;
        ground[9 * w + 5] = 1;
        ground[5 * w + 15] = 1;
        ground[5 * w + 16] = 1;

        // Edge walls (invisible, prevent falling off map)
        for (let x = 0; x < w; x++) walls[x] = 2;
        for (let y = 0; y < h; y++) {
            walls[y * w] = 3;
            walls[y * w + (w - 1)] = 3;
        }

        this.tilemap = new Tilemap(w, h, { ground, walls, objects });

        this.triggers.clear();

        // === LORE on main path ===
        this.triggers.add(new Trigger(9, 12, 1, 1, {
            onInteract: (g) => {
                if (g.notes.find('noteVoid1', g)) {
                    g.dialogue.show({
                        lines: [
                            { text: '*Обрывок мысли, материализовавшийся в текст.*', speaker: 'narrator' },
                            { text: '*"Если меня не станет, всем станет легче."*', speaker: 'mila' },
                            { text: '*Эта мысль... она лгала.*', speaker: 'mila' }
                        ]
                    }, g);
                }
            }
        }));

        // === LEFT PLATFORM — memory fragment ===
        this.triggers.add(new Trigger(2, 8, 2, 2, {
            onInteract: (g) => {
                if (g.notes.find('noteVoid2', g)) {
                    g.dialogue.show({
                        lines: [
                            { text: '*Осколок воспоминания. Я маленькая. Мама уходит.*', speaker: 'narrator' },
                            { text: '*"Я вернусь, Милочка." Хлопает дверь.*', speaker: 'narrator' },
                            { text: '*Этот звук остался навсегда.*', speaker: 'mila' }
                        ]
                    }, g);
                }
            }
        }));

        // === RIGHT PLATFORM — shadow's memory ===
        this.triggers.add(new Trigger(17, 5, 2, 2, {
            onInteract: (g) => {
                if (g.notes.find('noteVoid3', g)) {
                    g.dialogue.show({
                        lines: [
                            { text: '*Тёмный осколок. Голос Тени.*', speaker: 'narrator' },
                            { text: '*"Я родилась в ту ночь, когда ты впервые подумала об этом."*', speaker: 'shadow' },
                            { text: '*"Ты создала меня из боли. Я — твоё дитя."*', speaker: 'shadow' }
                        ]
                    }, g);
                    g.audio.playShadowWhisper();
                }
            }
        }));

        // === WHISPER TRIGGERS on path ===
        this.triggers.add(new Trigger(8, 10, 2, 1, {
            once: true,
            onEnter: (g) => {
                g.audio.playWhisper(0);
                g.dialogue.show(DIALOGUES.shadowWhisper1, g);
            }
        }));
        this.triggers.add(new Trigger(12, 8, 1, 1, {
            once: true,
            onEnter: (g) => {
                g.audio.playWhisper(2);
                g.dialogue.show(DIALOGUES.shadowWhisper3, g);
            }
        }));
        this.triggers.add(new Trigger(10, 6, 2, 1, {
            once: true,
            onEnter: (g) => {
                g.audio.playShadowWhisper();
                g.dialogue.show(DIALOGUES.shadowWhisper4, g);
            }
        }));

        // === SHADOW CONFRONTATION (center of arena) ===
        this.triggers.add(new Trigger(9, 3, 2, 1, {
            once: true,
            onEnter: (g) => {
                if (g.shadow) g.shadow.deactivate();

                if (g.cutscene && CUTSCENES.beforeVoid) {
                    g.state.change('cutscene');
                    g.cutscene.start(CUTSCENES.beforeVoid, g, () => {
                        g.state.change('playing');
                        this._showConfrontation(g);
                    });
                } else {
                    this._showConfrontation(g);
                }
            }
        }));

        // Exit
        this.triggers.add(new Trigger(10, 14, 2, 1, {
            onEnter: (g) => {
                g.changeRoom('corridor', 7, 3);
            }
        }));

        this.built = true;
    }

    _showConfrontation(game) {
        game.dialogue.show(DIALOGUES.shadowSpeak, game, () => {
            game.dialogue.show(DIALOGUES.shadowPhilosophy, game, () => {
                game.dialogue.show(DIALOGUES.voidChoice, game, () => {
                    this.triggerEnding(game);
                });
            });
        });
    }

    triggerEnding(game) {
        const ending = STORY_FLAGS.getEnding(game.state.flags, game.meta);

        game.state.change('cutscene');

        switch (ending) {
            case CONFIG.ENDINGS.AWAKENING:
                this.endingAwakening(game);
                break;
            case CONFIG.ENDINGS.OBLIVION:
                this.endingOblivion(game);
                break;
            case CONFIG.ENDINGS.LOOP:
                this.endingLoop(game);
                break;
            case CONFIG.ENDINGS.FORGIVENESS:
                this.endingForgiveness(game);
                break;
        }
    }

    endingAwakening(game) {
        game.effects.flash(1.5, '#fff');
        game.audio.stopDrone();
        game.audio.stopPulse();
        game.audio.stopOST();
        game.audio.playOST('awakening');

        if (game.player && game.player.noCatchRun) {
            game.achievements.unlock('survivor');
        }
        if (STORY_FLAGS.getAcceptedCount(game.state.flags) >= 5) {
            game.achievements.unlock('rememberEverything');
        }

        setTimeout(() => {
            game.dialogue.show(DIALOGUES.endingAwakening, game, () => {
                game.state.change('ending');
                game.titleTimer = 0;
                game.endingType = 'A';
                game.saveSystem.deleteSave();
                game.meta.onPlaythroughEnd('A');
                game.achievements.unlock('awakening');
            });
        }, 1500);
    }

    endingOblivion(game) {
        game.effects.enable('glitch', { intensity: 0.5 });
        game.audio.playGlitch();
        game.audio.stopOST();

        if (STORY_FLAGS.getRejectedCount(game.state.flags) >= 5) {
            game.achievements.unlock('forgetEverything');
        }

        setTimeout(() => {
            game.audio.stopDrone();
            game.audio.stopPulse();
        }, 2000);

        setTimeout(() => {
            game.dialogue.show(DIALOGUES.endingOblivion, game, () => {
                game.state.change('ending');
                game.titleTimer = 0;
                game.endingType = 'B';
                game.saveSystem.deleteSave();
                game.meta.onPlaythroughEnd('B');
                game.achievements.unlock('oblivion');
            });
        }, 500);
    }

    endingLoop(game) {
        game.effects.flash(1, '#000');
        game.audio.playGlitch();
        game.audio.stopOST();

        setTimeout(() => {
            game.dialogue.show(DIALOGUES.endingLoop, game, () => {
                game.state.change('ending');
                game.titleTimer = 0;
                game.endingType = 'C';
                game.meta.onPlaythroughEnd('C');
                game.meta.onLoop();
                game.achievements.unlock('loop');

                setTimeout(() => {
                    game.state.resetFlags();
                    game.inventory.clear();
                    game.notes.found = [];
                    game.sanity.value = 100;
                    game.effects.disableAll();
                    game.rooms = {};
                    game.initRooms();
                    game.endingType = null;
                    game.changeRoom('whiteRoom');
                    game.state.change('playing');
                }, 5000);
            });
        }, 1000);
    }

    endingForgiveness(game) {
        game.effects.flash(2, '#8866cc');
        game.audio.stopDrone();
        game.audio.stopPulse();
        game.audio.stopOST();
        game.audio.playOST('awakening');

        setTimeout(() => {
            game.dialogue.show(DIALOGUES.endingForgiveness, game, () => {
                game.state.change('ending');
                game.titleTimer = 0;
                game.endingType = 'D';
                game.saveSystem.deleteSave();
                game.meta.onPlaythroughEnd('D');
                game.achievements.unlock('secretEnding');
                game.achievements.unlock('rememberEverything');
            });
        }, 2000);
    }

    enter(game) {
        super.enter(game);
        if (!game.state.getFlag('visitedVoid')) {
            game.eventManager.trigger('onEnterVoid', game);
        }
        game.achievements.unlock('faceYourShadow');

        // Shadow NPC at confrontation point
        const shadowNpc = new NPC(10, 3, {
            name: 'shadowNpc',
            sprite: game.spriteGen.cache.shadow.idle,
            solid: true,
            onInteract: null
        });
        this.entities.push(shadowNpc);
    }
}
