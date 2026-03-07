class VoidRoom extends Room {
    constructor() {
        super({
            name: 'void',
            width: 16,
            height: 12,
            palette: CONFIG.PALETTES.void,
            tilesetName: 'void',
            playerStart: { x: 8, y: 10 },
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

        // Sparse floor - only a path
        // Center path
        for (let y = 1; y < h; y++) {
            ground[y * w + 7] = 1;
            ground[y * w + 8] = 1;
        }
        // Wider area at top for confrontation
        for (let y = 1; y < 5; y++) {
            for (let x = 4; x < 12; x++) {
                ground[y * w + x] = 1;
            }
        }

        // Edges are void (walls/impassable)
        for (let x = 0; x < w; x++) {
            walls[x] = 2;
        }
        for (let y = 0; y < h; y++) {
            walls[y * w] = 3;
            walls[y * w + (w - 1)] = 3;
        }

        this.tilemap = new Tilemap(w, h, { ground, walls, objects });

        this.triggers.clear();

        // Shadow confrontation at center
        this.triggers.add(new Trigger(7, 3, 2, 1, {
            once: true,
            onEnter: (g) => {
                // Disable shadow chasing - this is the confrontation
                if (g.shadow) g.shadow.deactivate();

                g.dialogue.show(DIALOGUES.shadowSpeak, g, () => {
                    g.dialogue.show(DIALOGUES.voidChoice, g, () => {
                        this.triggerEnding(g);
                    });
                });
            }
        }));

        // Exit back
        this.triggers.add(new Trigger(7, 11, 2, 1, {
            onEnter: (g) => {
                g.changeRoom('corridor', 5, 3);
            }
        }));

        this.built = true;
    }

    triggerEnding(game) {
        const ending = STORY_FLAGS.getEnding(game.state.flags);

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
        }
    }

    endingAwakening(game) {
        game.effects.flash(1.5, '#fff');
        game.audio.stopDrone();
        game.audio.stopPulse();
        game.audio.stopOST();
        game.audio.playOST('awakening');

        setTimeout(() => {
            game.dialogue.show(DIALOGUES.endingAwakening, game, () => {
                game.state.change('ending');
                game.titleTimer = 0;
                game.endingType = 'A';
                game.saveSystem.deleteSave();
            });
        }, 1500);
    }

    endingOblivion(game) {
        game.effects.enable('glitch', { intensity: 0.5 });
        game.audio.playGlitch();
        game.audio.stopOST();

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

                // Auto-restart after showing ending screen
                setTimeout(() => {
                    game.state.resetFlags();
                    game.inventory.clear();
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

    enter(game) {
        super.enter(game);
        if (!game.state.getFlag('visitedVoid')) {
            game.eventManager.trigger('onEnterVoid', game);
        }

        // Place shadow NPC visually at confrontation point (not chasing)
        const shadowNpc = new NPC(8, 3, {
            name: 'shadowNpc',
            sprite: game.spriteGen.cache.shadow.idle,
            solid: true,
            onInteract: null
        });
        this.entities.push(shadowNpc);
    }
}
