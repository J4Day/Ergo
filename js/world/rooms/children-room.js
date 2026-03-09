class ChildrenRoom extends Room {
    constructor() {
        super({
            name: 'childrenRoom',
            width: 12,
            height: 10,
            palette: ['#f5e6d0', '#e8d0b0', '#d4a080', '#c08060', '#806040', '#402020'],
            tilesetName: 'apartment',
            playerStart: { x: 6, y: 8 },
            effects: [
                { name: 'vignette', params: { strength: 0.4 } },
                { name: 'noise', params: { intensity: 0.02 } }
            ]
        });
        this.littleMilaSpawned = false;
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
            walls[x] = 2;
            walls[(h - 1) * w + x] = 3;
        }
        for (let y = 0; y < h; y++) {
            walls[y * w] = 3;
            walls[y * w + (w - 1)] = 3;
        }

        // === FURNITURE LAYOUT ===
        // Bed (left side, against wall)
        objects[2 * w + 2] = 6;
        objects[2 * w + 3] = 6;
        objects[3 * w + 2] = 6;

        // Toy shelf (right wall)
        objects[2 * w + 10] = 7;
        objects[3 * w + 10] = 7;

        // Small desk (center-right)
        objects[4 * w + 8] = 7;

        // Drawings on walls
        objects[1 * w + 5] = 10; // sun drawing
        objects[1 * w + 7] = 10; // family drawing
        objects[1 * w + 9] = 10; // house drawing

        // Teddy bear on floor (near bed)
        objects[4 * w + 2] = 15;

        // Toy box
        objects[6 * w + 9] = 7;

        // Carpet (different floor tile in center)
        for (let y = 4; y <= 6; y++) {
            for (let x = 4; x <= 7; x++) {
                ground[y * w + x] = 1; // could use different tile if available
            }
        }

        // Stars on ceiling (stickers)
        objects[1 * w + 3] = 14;
        objects[1 * w + 4] = 14;

        // Crayons scattered on floor
        objects[5 * w + 6] = 14;

        // Night light
        objects[3 * w + 4] = 14;

        // Exit door
        objects[(h - 1) * w + 6] = 5;
        ground[(h - 1) * w + 6] = 1;

        this.tilemap = new Tilemap(w, h, { ground, walls, objects });
        this.tilemap.setCollision(6, h - 1, false);

        this.triggers.clear();

        // === BED ===
        this.triggers.add(new Trigger(2, 2, 2, 2, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Маленькая кроватка. Одеяло со звёздами.*', speaker: 'narrator' },
                        { text: '*Мама читала мне сказки перед сном.*', speaker: 'mila' },
                        { text: '*"Жила-была девочка, которая не боялась темноты..."*', speaker: 'mila' },
                        { text: '*Я забыла, чем кончается сказка.*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // === TEDDY BEAR ===
        this.triggers.add(new Trigger(2, 4, 1, 1, {
            onInteract: (g) => {
                if (g.notes.find('noteChildRoom2', g)) {
                    g.dialogue.show({
                        lines: [
                            { text: '*Плюшевый мишка. Потёртый, один глаз пуговка.*', speaker: 'narrator' },
                            { text: '*Мама зашивала его три раза. Каждый раз — как новый.*', speaker: 'mila' },
                            { text: '*Он пахнет... домом. Настоящим домом.*', speaker: 'mila' }
                        ]
                    }, g);
                }
            }
        }));

        // === WALL DRAWINGS ===
        this.triggers.add(new Trigger(5, 1, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Рисунок солнца. Огромное, жёлтое, с лучами до краёв.*', speaker: 'narrator' },
                        { text: '*Я рисовала его каждый день. Когда солнце ещё имело смысл.*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        this.triggers.add(new Trigger(7, 1, 1, 1, {
            onInteract: (g) => {
                if (g.notes.find('noteChildRoom1', g)) {
                    g.dialogue.show({
                        lines: [
                            { text: '*Рисунок семьи. Мама, папа, я. Все держатся за руки.*', speaker: 'narrator' },
                            { text: '*Папа... Я уже не помню его лицо.*', speaker: 'mila' },
                            { text: '*Он ушёл, когда мне было четыре. Мама не говорила почему.*', speaker: 'mila' }
                        ]
                    }, g);
                }
            }
        }));

        this.triggers.add(new Trigger(9, 1, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Рисунок дома. Рядом — дерево с яблоками.*', speaker: 'narrator' },
                        { text: '*Бабушкин дом. Летние каникулы.*', speaker: 'mila' },
                        { text: '*Единственное место, где я чувствовала себя нужной.*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // === DESK with crayons ===
        this.triggers.add(new Trigger(8, 4, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Маленький стол. Карандаши, фломастеры, альбом.*', speaker: 'narrator' },
                        { text: '*Открыт на странице с недорисованным рисунком.*', speaker: 'narrator' },
                        { text: '*Два человека без лиц. Подпись: "Когда мама вернётся."*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // === CRAYONS on floor ===
        this.triggers.add(new Trigger(6, 5, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Разбросанные мелки. Красный сломан пополам.*', speaker: 'narrator' },
                        { text: '*Красным я рисовала сердечки. Пока не перестала.*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // === TOY SHELF ===
        this.triggers.add(new Trigger(10, 2, 1, 2, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Полка с игрушками. Куклы, машинки, пазл на 50 деталей.*', speaker: 'narrator' },
                        { text: '*Пазл собран наполовину. Я так и не закончила.*', speaker: 'mila' },
                        { text: '*Как и многое другое.*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // === TOY BOX ===
        this.triggers.add(new Trigger(9, 6, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Ящик с игрушками. На крышке — наклейки с бабочками.*', speaker: 'narrator' },
                        { text: '*Внутри... письмо? Детским почерком.*', speaker: 'narrator' },
                        { text: '*"Дорогой Дед Мороз. Я хочу чтобы мама не плакала."*', speaker: 'mila' },
                        { text: '*Мне было шесть.*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // === NIGHT LIGHT ===
        this.triggers.add(new Trigger(4, 3, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Ночник в форме звезды. Он ещё работает.*', speaker: 'narrator' },
                        { text: '*Тёплый свет. Безопасность. Дом.*', speaker: 'mila' },
                        { text: '*Почему мы теряем это?*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // === EXIT ===
        this.triggers.add(new Trigger(6, h - 1, 1, 1, {
            onEnter: (g) => {
                g.changeRoom('apartment', 10, 4);
            }
        }));

        this.built = true;
    }

    enter(game) {
        super.enter(game);

        if (game.achievements) game.achievements.unlock('explorer');
        if (game.meta) game.meta.onSecretRoom();
        if (game.shadow) game.shadow.deactivate();
        if (game.sanity) game.sanity.restore(15);

        if (game.audio) {
            game.audio.stopOST();
            game.audio.stopDrone();
            game.audio.playOST('lullaby');
        }

        // Little Mila
        if (!this.littleMilaSpawned && game.spriteGen) {
            const littleMila = new NPC(5, 5, {
                name: 'littleMila',
                sprite: game.spriteGen.cache.littleMila.idle,
                spriteOffsetY: 0,
                onInteract: (g) => {
                    g.dialogue.show({
                        lines: [
                            { text: '*Маленькая я. Сидит на ковре, рисует.*', speaker: 'narrator' },
                            { text: 'Смотри, что я нарисовала! Это мы с мамой!', speaker: 'littleMila' },
                            { text: '*Она улыбается. Так просто, так искренне.*', speaker: 'mila' },
                            { text: 'Ты ведь вернёшься? Тут без тебя грустно...', speaker: 'littleMila' },
                            { text: '*...я обещаю.*', speaker: 'mila' }
                        ]
                    }, g);
                }
            });
            this.entities.push(littleMila);
            this.littleMilaSpawned = true;
        }

        game.dialogue.show({
            lines: [
                { text: '*Эта комната... Моя детская.*', speaker: 'mila' },
                { text: '*Всё маленькое. Тёплое. Как будто ничего плохого не случалось.*', speaker: 'mila' }
            ]
        }, game);
    }
}
