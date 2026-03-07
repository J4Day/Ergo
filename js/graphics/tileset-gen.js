class TilesetGen {
    constructor() {
        this.cache = {};
    }

    generate(name, palette) {
        const ts = CONFIG.TILE_SIZE;
        const canvas = document.createElement('canvas');
        canvas.width = ts * 16;
        canvas.height = ts * 16;
        const ctx = canvas.getContext('2d');

        // Tile indices:
        // 1 = floor, 2 = wall top, 3 = wall side, 4 = door closed, 5 = door open
        // 6 = special A, 7 = special B, 8 = special C, 9 = special D
        // 10 = decoration A, 11 = decoration B, 12 = crack, 13 = water
        // 14 = object A, 15 = object B, 16 = object C

        const tiles = {
            1: (x, y) => this.drawFloor(ctx, x, y, ts, palette),
            2: (x, y) => this.drawWallTop(ctx, x, y, ts, palette),
            3: (x, y) => this.drawWallSide(ctx, x, y, ts, palette),
            4: (x, y) => this.drawDoor(ctx, x, y, ts, palette, false),
            5: (x, y) => this.drawDoor(ctx, x, y, ts, palette, true),
            6: (x, y) => this.drawSpecialA(ctx, x, y, ts, palette, name),
            7: (x, y) => this.drawSpecialB(ctx, x, y, ts, palette, name),
            8: (x, y) => this.drawSpecialC(ctx, x, y, ts, palette, name),
            9: (x, y) => this.drawSpecialD(ctx, x, y, ts, palette, name),
            10: (x, y) => this.drawDecoA(ctx, x, y, ts, palette, name),
            11: (x, y) => this.drawDecoB(ctx, x, y, ts, palette, name),
            12: (x, y) => this.drawCrack(ctx, x, y, ts, palette),
            13: (x, y) => this.drawWater(ctx, x, y, ts, palette),
            14: (x, y) => this.drawObjectA(ctx, x, y, ts, palette, name),
            15: (x, y) => this.drawObjectB(ctx, x, y, ts, palette, name),
            16: (x, y) => this.drawObjectC(ctx, x, y, ts, palette, name),
        };

        for (let i = 1; i <= 16; i++) {
            const tx = ((i - 1) % 16) * ts;
            const ty = Math.floor((i - 1) / 16) * ts;
            if (tiles[i]) tiles[i](tx, ty);
        }

        this.cache[name] = canvas;
        return canvas;
    }

    drawFloor(ctx, x, y, ts, palette) {
        ctx.fillStyle = palette[0];
        ctx.fillRect(x, y, ts, ts);
        // Subtle texture
        ctx.fillStyle = palette[1];
        for (let i = 0; i < 4; i++) {
            const px = x + Math.floor(Math.random() * ts);
            const py = y + Math.floor(Math.random() * ts);
            ctx.fillRect(px, py, 1, 1);
        }
    }

    drawWallTop(ctx, x, y, ts, palette) {
        ctx.fillStyle = palette[3] || palette[1];
        ctx.fillRect(x, y, ts, ts);
        ctx.fillStyle = palette[4] || palette[2];
        ctx.fillRect(x, y + ts - 2, ts, 2);
    }

    drawWallSide(ctx, x, y, ts, palette) {
        ctx.fillStyle = palette[3] || palette[1];
        ctx.fillRect(x, y, ts, ts);
        ctx.fillStyle = palette[2] || palette[0];
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(x + Math.floor(Math.random() * ts), y + Math.floor(Math.random() * ts), 1, 1);
        }
    }

    drawDoor(ctx, x, y, ts, palette, open) {
        if (open) {
            ctx.fillStyle = palette[5] || '#000';
            ctx.fillRect(x, y, ts, ts);
        } else {
            ctx.fillStyle = palette[2];
            ctx.fillRect(x, y, ts, ts);
            ctx.fillStyle = palette[4] || palette[3];
            ctx.fillRect(x + 2, y + 2, ts - 4, ts - 4);
            // Door knob
            ctx.fillStyle = palette[5] || '#fff';
            ctx.fillRect(x + ts - 5, y + ts / 2, 2, 2);
        }
    }

    drawSpecialA(ctx, x, y, ts, palette, name) {
        // Room-specific tile
        ctx.fillStyle = palette[0];
        ctx.fillRect(x, y, ts, ts);
        if (name === 'apartment') {
            // TV with static
            ctx.fillStyle = palette[3];
            ctx.fillRect(x + 2, y + 2, 12, 10);
            ctx.fillStyle = palette[4];
            for (let i = 0; i < 20; i++) {
                ctx.fillRect(x + 3 + Math.floor(Math.random() * 10), y + 3 + Math.floor(Math.random() * 8), 1, 1);
            }
            ctx.fillRect(x + 6, y + 13, 4, 2);
        } else if (name === 'garden') {
            // Dead tree
            ctx.fillStyle = palette[3];
            ctx.fillRect(x + 7, y + 4, 2, 12);
            ctx.fillRect(x + 4, y + 4, 8, 2);
            ctx.fillRect(x + 3, y + 2, 3, 2);
            ctx.fillRect(x + 10, y + 2, 3, 2);
        } else if (name === 'hospital') {
            // Bed
            ctx.fillStyle = palette[1];
            ctx.fillRect(x + 1, y + 4, 14, 8);
            ctx.fillStyle = palette[2];
            ctx.fillRect(x + 1, y + 4, 14, 2);
        } else {
            ctx.fillStyle = palette[2];
            ctx.fillRect(x + 2, y + 2, ts - 4, ts - 4);
        }
    }

    drawSpecialB(ctx, x, y, ts, palette, name) {
        ctx.fillStyle = palette[0];
        ctx.fillRect(x, y, ts, ts);
        if (name === 'apartment') {
            // Tilted furniture
            ctx.fillStyle = palette[2];
            ctx.fillRect(x + 1, y + 6, 14, 8);
            ctx.fillStyle = palette[3];
            ctx.fillRect(x + 2, y + 3, 3, 3);
            ctx.fillRect(x + 11, y + 3, 3, 3);
        } else if (name === 'garden') {
            // Grave
            ctx.fillStyle = palette[4];
            ctx.fillRect(x + 4, y + 2, 8, 12);
            ctx.fillStyle = palette[3];
            ctx.fillRect(x + 5, y + 3, 6, 10);
            ctx.fillRect(x + 6, y + 1, 4, 2);
        } else if (name === 'school') {
            // Desk
            ctx.fillStyle = palette[2];
            ctx.fillRect(x + 1, y + 4, 14, 10);
            ctx.fillStyle = palette[3];
            ctx.fillRect(x + 2, y + 14, 2, 2);
            ctx.fillRect(x + 12, y + 14, 2, 2);
        } else {
            ctx.fillStyle = palette[3];
            ctx.fillRect(x + 3, y + 3, ts - 6, ts - 6);
        }
    }

    drawSpecialC(ctx, x, y, ts, palette, name) {
        ctx.fillStyle = palette[0];
        ctx.fillRect(x, y, ts, ts);
        if (name === 'garden') {
            // Empty flowerbed
            ctx.fillStyle = palette[3];
            ctx.fillRect(x + 2, y + 8, 12, 6);
            ctx.fillStyle = palette[4];
            ctx.fillRect(x + 3, y + 9, 10, 4);
        } else if (name === 'apartment') {
            // Photo fragment
            ctx.fillStyle = palette[5];
            ctx.fillRect(x + 4, y + 4, 8, 8);
            ctx.fillStyle = palette[1];
            ctx.fillRect(x + 5, y + 5, 6, 6);
        } else {
            ctx.fillStyle = palette[4];
            ctx.fillRect(x + 4, y + 4, 8, 8);
        }
    }

    drawSpecialD(ctx, x, y, ts, palette, name) {
        ctx.fillStyle = palette[0];
        ctx.fillRect(x, y, ts, ts);
        if (name === 'garden') {
            // Planted flower
            ctx.fillStyle = palette[3];
            ctx.fillRect(x + 2, y + 8, 12, 6);
            ctx.fillStyle = palette[4];
            ctx.fillRect(x + 3, y + 9, 10, 4);
            // Flower
            ctx.fillStyle = palette[5];
            ctx.fillRect(x + 7, y + 3, 2, 6);
            ctx.fillStyle = '#ff6666';
            ctx.fillRect(x + 6, y + 1, 4, 3);
        } else {
            ctx.fillStyle = palette[5];
            ctx.fillRect(x + 3, y + 3, ts - 6, ts - 6);
        }
    }

    drawDecoA(ctx, x, y, ts, palette, name) {
        ctx.fillStyle = palette[0];
        ctx.fillRect(x, y, ts, ts);
        ctx.fillStyle = palette[2];
        // Window or painting
        ctx.fillRect(x + 3, y + 3, 10, 10);
        ctx.fillStyle = palette[1];
        ctx.fillRect(x + 4, y + 4, 8, 8);
    }

    drawDecoB(ctx, x, y, ts, palette, name) {
        ctx.fillStyle = palette[0];
        ctx.fillRect(x, y, ts, ts);
        ctx.fillStyle = palette[4] || palette[2];
        // Stain / mark
        ctx.fillRect(x + 4, y + 6, 3, 2);
        ctx.fillRect(x + 6, y + 8, 4, 3);
        ctx.fillRect(x + 5, y + 10, 2, 2);
    }

    drawCrack(ctx, x, y, ts, palette) {
        ctx.fillStyle = palette[0];
        ctx.fillRect(x, y, ts, ts);
        ctx.fillStyle = palette[4] || '#333';
        // Crack pattern
        ctx.fillRect(x + 7, y, 1, 4);
        ctx.fillRect(x + 8, y + 3, 1, 3);
        ctx.fillRect(x + 7, y + 5, 1, 4);
        ctx.fillRect(x + 6, y + 8, 1, 3);
        ctx.fillRect(x + 7, y + 10, 1, 4);
        ctx.fillRect(x + 5, y + 6, 1, 2);
        ctx.fillRect(x + 9, y + 4, 1, 2);
    }

    drawWater(ctx, x, y, ts, palette) {
        ctx.fillStyle = palette[3] || '#1a1a3e';
        ctx.fillRect(x, y, ts, ts);
        ctx.fillStyle = palette[4] || '#0f0f2e';
        for (let i = 0; i < 6; i++) {
            const wx = x + Math.floor(Math.random() * (ts - 3));
            const wy = y + Math.floor(Math.random() * ts);
            ctx.fillRect(wx, wy, 3, 1);
        }
    }

    drawObjectA(ctx, x, y, ts, palette, name) {
        ctx.fillStyle = palette[0];
        ctx.fillRect(x, y, ts, ts);
        // Note/paper
        ctx.fillStyle = palette[5] || '#f0f0f0';
        ctx.fillRect(x + 4, y + 4, 8, 10);
        ctx.fillStyle = palette[4] || '#333';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(x + 5, y + 6 + i * 2, 6, 1);
        }
    }

    drawObjectB(ctx, x, y, ts, palette, name) {
        ctx.fillStyle = palette[0];
        ctx.fillRect(x, y, ts, ts);
        // Key item
        ctx.fillStyle = palette[5] || '#ffcc00';
        ctx.fillRect(x + 5, y + 5, 6, 6);
        ctx.fillStyle = palette[4] || '#cc9900';
        ctx.fillRect(x + 6, y + 6, 4, 4);
    }

    drawObjectC(ctx, x, y, ts, palette, name) {
        ctx.fillStyle = palette[0];
        ctx.fillRect(x, y, ts, ts);
        // Collectible
        ctx.fillStyle = palette[5] || '#ff66ff';
        ctx.fillRect(x + 6, y + 3, 4, 4);
        ctx.fillRect(x + 5, y + 7, 6, 2);
        ctx.fillRect(x + 7, y + 7, 2, 4);
    }

    generateAll() {
        for (const [name, palette] of Object.entries(CONFIG.PALETTES)) {
            this.generate(name, palette);
        }
    }
}
