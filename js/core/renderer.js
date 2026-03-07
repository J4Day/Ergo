class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.internal = document.createElement('canvas');
        this.internal.width = CONFIG.INTERNAL_WIDTH;
        this.internal.height = CONFIG.INTERNAL_HEIGHT;
        this.ictx = this.internal.getContext('2d');
        this.ictx.imageSmoothingEnabled = false;
        this.ctx.imageSmoothingEnabled = false;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const scaleX = Math.floor(window.innerWidth / CONFIG.INTERNAL_WIDTH);
        const scaleY = Math.floor(window.innerHeight / CONFIG.INTERNAL_HEIGHT);
        const scale = Math.max(1, Math.min(scaleX, scaleY));
        this.canvas.width = CONFIG.INTERNAL_WIDTH * scale;
        this.canvas.height = CONFIG.INTERNAL_HEIGHT * scale;
        this.ctx.imageSmoothingEnabled = false;
        this.scale = scale;
    }

    clear(color) {
        this.ictx.fillStyle = color || '#000';
        this.ictx.fillRect(0, 0, CONFIG.INTERNAL_WIDTH, CONFIG.INTERNAL_HEIGHT);
    }

    drawTilemap(tilemap, layer, camera, tilesetCanvas) {
        if (!tilemap || !tilesetCanvas) return;
        const ts = CONFIG.TILE_SIZE;
        const startX = Math.max(0, Math.floor(-camera.offsetX / ts));
        const startY = Math.max(0, Math.floor(-camera.offsetY / ts));
        const endX = Math.min(tilemap.width, startX + CONFIG.TILES_X + 2);
        const endY = Math.min(tilemap.height, startY + CONFIG.TILES_Y + 2);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tile = tilemap.getTile(layer, x, y);
                if (tile <= 0) continue;
                const srcX = ((tile - 1) % 16) * ts;
                const srcY = Math.floor((tile - 1) / 16) * ts;
                this.ictx.drawImage(
                    tilesetCanvas,
                    srcX, srcY, ts, ts,
                    x * ts + camera.offsetX, y * ts + camera.offsetY, ts, ts
                );
            }
        }
    }

    drawSprite(sprite, x, y, camera) {
        if (!sprite) return;
        this.ictx.drawImage(
            sprite,
            Math.round(x + camera.offsetX),
            Math.round(y + camera.offsetY)
        );
    }

    drawRect(x, y, w, h, color) {
        this.ictx.fillStyle = color;
        this.ictx.fillRect(Math.round(x), Math.round(y), w, h);
    }

    drawText(text, x, y, color, align) {
        this.ictx.fillStyle = color || '#fff';
        this.ictx.font = '8px monospace';
        this.ictx.textAlign = align || 'left';
        this.ictx.textBaseline = 'top';
        // Pixel font rendering
        const chars = text.split('');
        let cx = x;
        if (align === 'center') cx = x - (chars.length * 5) / 2;
        if (align === 'right') cx = x - chars.length * 5;
        this.ictx.fillText(text, Math.round(cx), Math.round(y));
    }

    present() {
        this.ctx.drawImage(
            this.internal, 0, 0,
            CONFIG.INTERNAL_WIDTH, CONFIG.INTERNAL_HEIGHT,
            0, 0,
            this.canvas.width, this.canvas.height
        );
    }

    getImageData() {
        return this.ictx.getImageData(0, 0, CONFIG.INTERNAL_WIDTH, CONFIG.INTERNAL_HEIGHT);
    }

    putImageData(imageData) {
        this.ictx.putImageData(imageData, 0, 0);
    }
}
