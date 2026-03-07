class SchoolRoom extends Room {
    constructor() {
        super({
            name: 'school',
            width: 20,
            height: 16,
            palette: CONFIG.PALETTES.school,
            tilesetName: 'school',
            playerStart: { x: 1, y: 14 },
            effects: [
                { name: 'vignette', params: { strength: 0.7 } },
                { name: 'noise', params: { intensity: 0.04 } },
                { name: 'glitch', params: { intensity: 0.05 } }
            ]
        });
    }

    build(game) {
        const w = this.width, h = this.height;
        const ground = new Array(w * h).fill(0);
        const walls = new Array(w * h).fill(0);
        const objects = new Array(w * h).fill(0);

        // Generate a simple maze
        // 1 = path, 0 = wall
        const maze = this.generateMaze(w, h);

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (maze[y][x] === 1) {
                    ground[y * w + x] = 1;
                } else {
                    walls[y * w + x] = 3;
                }
            }
        }

        // Ensure start and end are accessible
        ground[14 * w + 1] = 1;
        walls[14 * w + 1] = 0;
        ground[1 * w + 18] = 1;
        walls[1 * w + 18] = 0;

        // Place some desks as decoration
        const deskPositions = [
            { x: 4, y: 4 }, { x: 8, y: 6 }, { x: 14, y: 10 }, { x: 10, y: 2 }
        ];
        deskPositions.forEach(p => {
            if (ground[p.y * w + p.x] === 1) {
                objects[p.y * w + p.x] = 7;
            }
        });

        // Exit door at top-right
        objects[1 * w + 18] = 5;

        // Entry back to corridor at bottom-left
        ground[(h - 1) * w + 1] = 1;
        walls[(h - 1) * w + 1] = 0;
        objects[(h - 1) * w + 1] = 5;

        this.tilemap = new Tilemap(w, h, { ground, walls, objects });
        this.tilemap.setCollision(1, h - 1, false);
        this.tilemap.setCollision(18, 1, false);

        this.triggers.clear();

        // Little Mila NPC
        const littleMila = new NPC(10, 8, {
            name: 'littleMila',
            sprite: game.spriteGen.cache.littleMila.idle,
            spriteOffsetY: 0,
            onInteract: (g) => {
                if (!g.state.getFlag('metLittleMila')) {
                    g.state.setFlag('metLittleMila', true);
                    g.dialogue.show(DIALOGUES.schoolLittleMila, g);
                    g.inventory.add(ITEMS.childDrawing);
                } else {
                    g.dialogue.show({
                        lines: [{ text: 'Ты уже близко! Смотри на рисунки!', speaker: 'littleMila' }]
                    }, g);
                }
            }
        });
        this.entities.push(littleMila);

        // Exit trigger - reaching the end
        this.triggers.add(new Trigger(18, 1, 1, 1, {
            onEnter: (g) => {
                if (!g.state.getFlag('puzzleSchoolDone')) {
                    g.state.setFlag('puzzleSchoolDone', true);
                    g.dialogue.show(DIALOGUES.schoolChoice, g, () => {
                        g.changeRoom('corridor', 7, 13);
                    });
                } else {
                    g.changeRoom('corridor', 7, 13);
                }
            }
        }));

        // Back to corridor
        this.triggers.add(new Trigger(1, h - 1, 1, 1, {
            onEnter: (g) => {
                g.changeRoom('corridor', 7, 13);
            }
        }));

        this.built = true;
    }

    generateMaze(w, h) {
        // Iterative backtracker maze
        const maze = Array.from({ length: h }, () => new Array(w).fill(0));

        const stack = [[1, 1]];
        maze[1][1] = 1;

        while (stack.length > 0) {
            const [x, y] = stack[stack.length - 1];
            const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]].sort(() => Math.random() - 0.5);
            let carved = false;
            for (const [dx, dy] of dirs) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 1 && nx < w - 1 && ny >= 1 && ny < h - 1 && maze[ny][nx] === 0) {
                    maze[y + dy / 2][x + dx / 2] = 1;
                    maze[ny][nx] = 1;
                    stack.push([nx, ny]);
                    carved = true;
                    break;
                }
            }
            if (!carved) stack.pop();
        }

        // Ensure start (1,14) and end (18,1) are reachable
        // Open some extra paths
        maze[14][1] = 1;
        maze[13][1] = 1;
        maze[1][18] = 1;
        maze[1][17] = 1;
        maze[2][18] = 1;

        // Add some extra openings for playability
        for (let y = 2; y < h - 2; y += 4) {
            for (let x = 2; x < w - 2; x += 4) {
                maze[y][x] = 1;
                if (x + 1 < w) maze[y][x + 1] = 1;
            }
        }

        return maze;
    }

    enter(game) {
        super.enter(game);
        if (!game.state.getFlag('visitedSchool')) {
            game.eventManager.trigger('onEnterSchool', game);
        }

        // Shadow appears in school after a bit
        setTimeout(() => {
            if (game.currentRoom === this && game.shadow) {
                game.shadow.activate(18, 14);
                game.shadow.speed = 1.8;
            }
        }, 12000);
    }
}
