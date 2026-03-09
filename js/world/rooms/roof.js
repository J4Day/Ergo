// Roof — The place of the attempt
// Secret room, accessible from Corridor after specific conditions
// Powerful emotional moment, no puzzles, no shadow

class RoofRoom extends Room {
    constructor() {
        super({
            name: 'roof',
            width: 20,
            height: 12,
            palette: ['#0a0a1a', '#1a1a3a', '#2a2a5a', '#4a4a8a', '#8888cc', '#f0f0f0'],
            tilesetName: 'void',
            playerStart: { x: 2, y: 10 },
            effects: [
                { name: 'vignette', params: { strength: 0.3 } },
                { name: 'chromatic', params: { offset: 1 } },
                { name: 'noise', params: { intensity: 0.02 } }
            ],
            ambientParticle: (ps, g) => {
                ps.emit(0, Math.random() * 12 * 16, 1, {
                    spread: 4, speed: 2, life: 3, size: 1,
                    colors: ['#888', '#aaa', '#666'],
                    gravity: 0, fadeOut: true
                });
                if (Math.random() < 0.3) ParticlePresets.snowfall(ps, 0, 0);
            }
        });
        this.windTimer = 0;
        this.edgeDialogueShown = false;
    }

    build(game) {
        const w = this.width, h = this.height;
        const ground = new Array(w * h).fill(0);
        const walls = new Array(w * h).fill(0);
        const objects = new Array(w * h).fill(0);

        // === SKY / CITY SKYLINE (y:0-2) ===
        // Top rows are impassable — represent the sky and distant buildings
        for (let x = 0; x < w; x++) {
            walls[x] = 2;
            walls[1 * w + x] = 2;
        }
        // Skyline silhouette (y:2) — building shapes
        for (let x = 0; x < w; x++) {
            walls[2 * w + x] = 2;
        }
        // Gaps in skyline for depth (some shorter "buildings")
        walls[2 * w + 5] = 0;
        walls[2 * w + 6] = 0;
        walls[2 * w + 12] = 0;
        walls[2 * w + 17] = 0;
        // But these are still not walkable (no ground)

        // === RAILING (y:3) — partially broken ===
        for (let x = 0; x < w; x++) {
            if (x < 8 || x > 11) {
                walls[3 * w + x] = 3;
            }
            // Gap at x:8-11 — the broken railing, THE PLACE
        }

        // === MAIN ROOFTOP (y:4-10) ===
        for (let y = 4; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                ground[y * w + x] = 1;
            }
        }
        // Side walls
        for (let y = 3; y < h; y++) {
            walls[y * w] = 3;
            walls[y * w + (w - 1)] = 3;
        }
        // Bottom wall
        for (let x = 0; x < w; x++) {
            walls[(h - 1) * w + x] = 3;
        }

        // === STAIRWELL ENCLOSURE (bottom-left, x:1-4, y:8-10) ===
        // Small structure representing the door to stairs
        walls[8 * w + 5] = 3;
        walls[9 * w + 5] = 3;
        walls[8 * w + 1] = 3;
        walls[8 * w + 2] = 3;
        walls[8 * w + 3] = 3;
        walls[8 * w + 4] = 3;
        // Door in enclosure
        walls[8 * w + 3] = 0;
        ground[8 * w + 3] = 1;
        objects[8 * w + 3] = 5;

        // === HVAC UNITS (obstacles) ===
        // Large unit center-right
        walls[6 * w + 14] = 3;
        walls[6 * w + 15] = 3;
        walls[7 * w + 14] = 3;
        walls[7 * w + 15] = 3;
        objects[6 * w + 14] = 7;
        objects[6 * w + 15] = 7;
        objects[7 * w + 14] = 7;
        objects[7 * w + 15] = 7;

        // Small unit left
        walls[5 * w + 3] = 3;
        objects[5 * w + 3] = 7;

        // Pipes along right wall
        objects[5 * w + 18] = 14;
        objects[7 * w + 18] = 14;
        objects[9 * w + 18] = 14;

        // === SCATTERED OBJECTS — evidence ===
        // Broken glass (near the edge)
        objects[4 * w + 9] = 12;
        objects[4 * w + 10] = 12;

        // Phone on ground (near edge)
        objects[4 * w + 8] = 14;

        // Shoe (one shoe, left behind)
        objects[5 * w + 10] = 15;

        // Cigarette butts (someone else was here before)
        objects[7 * w + 2] = 14;

        // Puddles from rain
        objects[6 * w + 8] = 12;
        objects[9 * w + 12] = 12;

        // Note under a stone
        objects[6 * w + 17] = 14;

        // Scratches/graffiti on HVAC
        objects[6 * w + 13] = 12;

        this.tilemap = new Tilemap(w, h, { ground, walls, objects });
        this.tilemap.setCollision(3, 8, false); // stairwell door

        // Make railing gap area walkable at y:4 (just behind gap)
        for (let x = 8; x <= 11; x++) {
            this.tilemap.setCollision(x, 4, false);
        }

        // Skyline gaps are NOT walkable (no ground tile)

        this.triggers.clear();

        // === STAIRWELL EXIT ===
        this.triggers.add(new Trigger(3, 8, 1, 1, {
            onEnter: (g) => {
                g.changeRoom('corridor', 5, 3);
            }
        }));

        // === THE EDGE — broken railing ===
        this.triggers.add(new Trigger(8, 4, 4, 1, {
            onInteract: (g) => {
                if (!this.edgeDialogueShown) {
                    this.edgeDialogueShown = true;
                    g.camera.shake(1, 0.5);
                    g.dialogue.show({
                        lines: [
                            { text: '*Край. Ограждение сломано именно здесь.*', speaker: 'narrator' },
                            { text: '*Ветер бьёт в лицо. Город далеко внизу.*', speaker: 'mila' },
                            { text: '*Огни фонарей. Машины. Жизнь, которую я хотела покинуть.*', speaker: 'mila' },
                            { text: '*Я помню этот момент. Каждую секунду.*', speaker: 'mila' },
                            { text: '*Холод перил. Звук сирен вдалеке.*', speaker: 'mila' },
                            { text: '*Один шаг. Всего один.*', speaker: 'mila' },
                            { text: '*...*', speaker: 'narrator' },
                            { text: '*Но сейчас я стою здесь. И я помню.*', speaker: 'mila' },
                            { text: '*Помню, что было после. Темнота. Удар. Голоса.*', speaker: 'mila' },
                            { text: '*\"Пульс есть!\" — кричал кто-то.*', speaker: 'narrator' },
                            { text: '*Кто-то боролся за меня. Даже когда я перестала.*', speaker: 'mila' }
                        ]
                    }, g);

                    if (g.achievements) g.achievements.unlock('rooftop');
                } else {
                    g.dialogue.show({
                        lines: [
                            { text: '*Край. Я больше не хочу стоять здесь.*', speaker: 'mila' },
                            { text: '*Но я должна помнить. Чтобы не забыть, зачем возвращаться.*', speaker: 'mila' }
                        ]
                    }, g);
                }
            }
        }));

        // === PHONE (last message) ===
        this.triggers.add(new Trigger(8, 4, 1, 1, {
            onInteract: (g) => {
                if (g.notes.find('noteRoof1', g)) {
                    g.dialogue.show({
                        lines: [
                            { text: '*Экран телефона. Последнее сообщение. Отправлено.*', speaker: 'narrator' },
                            { text: '"Мам, прости. Я не смогла больше."', speaker: 'mila' },
                            { text: '*23:47. За двенадцать минут до...*', speaker: 'narrator' },
                            { text: '*Она прочитала в 23:48. Одна минута.*', speaker: 'mila' },
                            { text: '*Одна минута — и она уже звонила в скорую.*', speaker: 'mila' }
                        ]
                    }, g);
                }
            }
        }));

        // === NOTE under stone ===
        this.triggers.add(new Trigger(17, 6, 1, 1, {
            onInteract: (g) => {
                if (g.notes.find('noteRoof2', g)) {
                    g.dialogue.show({
                        lines: [
                            { text: '*Записка, зажатая под камнем. Мой почерк.*', speaker: 'narrator' },
                            { text: '*\"Ветер. Город внизу. Огни. Красиво.\"*', speaker: 'mila' },
                            { text: '*\"Странно думать о красоте, когда...\"*', speaker: 'mila' },
                            { text: '*Строчка обрывается. Ручка упала.*', speaker: 'narrator' }
                        ]
                    }, g);
                }
            }
        }));

        // === BROKEN GLASS ===
        this.triggers.add(new Trigger(9, 4, 2, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Осколки стекла. Бутылка? Нет... часть перил.*', speaker: 'narrator' },
                        { text: '*Они обломились. Или я...*', speaker: 'mila' },
                        { text: '*Не помню. Не хочу помнить.*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // === SHOE ===
        this.triggers.add(new Trigger(10, 5, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Кроссовок. Один. Левый.*', speaker: 'narrator' },
                        { text: '*Второй остался внизу. Двенадцать этажей.*', speaker: 'mila' },
                        { text: '*Мама купила их за неделю до...*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // === CIGARETTE BUTTS ===
        this.triggers.add(new Trigger(2, 7, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Окурки. Чьи-то. Не мои.*', speaker: 'narrator' },
                        { text: '*Кто-то приходил сюда раньше. Смотреть на город.*', speaker: 'mila' },
                        { text: '*Интересно, о чём они думали.*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // === HVAC GRAFFITI ===
        this.triggers.add(new Trigger(13, 6, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*На стенке кондиционера — царапины. Слова.*', speaker: 'narrator' },
                        { text: '*\"Здесь был Саша 2019\"*', speaker: 'narrator' },
                        { text: '*А ниже, другим почерком: \"Мне страшно\"*', speaker: 'mila' },
                        { text: '*Это... мой почерк.*', speaker: 'mila' }
                    ]
                }, g);
                if (g.notes) g.notes.find('noteRoof3', g);
            }
        }));

        // === PUDDLE near edge ===
        this.triggers.add(new Trigger(8, 6, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Лужа. В ней отражается небо.*', speaker: 'narrator' },
                        { text: '*Такое же небо было той ночью. Чистое. Звёзды.*', speaker: 'mila' },
                        { text: '*Красиво. Невыносимо красиво.*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // === PIPES (reality bleed) ===
        this.triggers.add(new Trigger(18, 5, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Трубы гудят. Но это не ветер.*', speaker: 'narrator' },
                        { text: '*\"Давление падает...\" — голос издалека.*', speaker: 'narrator' },
                        { text: '*Больница. Они говорят обо мне.*', speaker: 'mila' }
                    ]
                }, g);
                g.audio.playRadioStatic(true);
            }
        }));

        // === SMALL HVAC ===
        this.triggers.add(new Trigger(3, 5, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Вентиляционный блок. За ним — пустая бутылка воды.*', speaker: 'narrator' },
                        { text: '*Я пила воду перед... Зачем? Привычка?*', speaker: 'mila' },
                        { text: '*Тело хотело жить. Даже когда я — нет.*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        // === SKYLINE VIEW (interact with gap in skyline wall) ===
        this.triggers.add(new Trigger(5, 4, 2, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Город. Огни. Окна, за которыми живут люди.*', speaker: 'narrator' },
                        { text: '*Каждое окно — чья-то жизнь. Чья-то боль.*', speaker: 'mila' },
                        { text: '*Я не единственная, кто стоял на краю.*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        this.triggers.add(new Trigger(17, 4, 1, 1, {
            onInteract: (g) => {
                g.dialogue.show({
                    lines: [
                        { text: '*Вдалеке — неоновая вывеска. \"АПТЕКА 24\".*', speaker: 'narrator' },
                        { text: '*Работает круглосуточно. Как боль.*', speaker: 'mila' }
                    ]
                }, g);
            }
        }));

        this.built = true;
    }

    enter(game) {
        super.enter(game);

        if (game.audio) {
            game.audio.stopOST();
            game.audio.startDrone(35, 0.03);
        }

        if (game.meta) game.meta.onRoof();
        if (game.shadow) game.shadow.deactivate();
        if (game.sanity) game.sanity.drain(10);

        game.dialogue.show({
            lines: [
                { text: '*Крыша. Ветер. Ночное небо.*', speaker: 'narrator' },
                { text: '*Я была здесь. Я помню.*', speaker: 'mila' },
                { text: '*Всё на месте. Как будто ждало меня.*', speaker: 'mila' }
            ]
        }, game);
    }

    update(dt, game) {
        super.update(dt, game);

        this.windTimer += dt;
        if (this.windTimer > 3 && game.audio && game.audio.initialized) {
            this.windTimer = 0;
            if (Math.random() < 0.5) {
                game.audio.playWindAmbient();
            } else {
                game.audio.playShadowWhisper();
            }
        }
    }
}
