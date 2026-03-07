class Entity {
    constructor(x, y) {
        this.tileX = x;
        this.tileY = y;
        this.drawX = x * CONFIG.TILE_SIZE;
        this.drawY = y * CONFIG.TILE_SIZE;
        this.sprite = null;
        this.visible = true;
        this.solid = false;
        this.direction = 'down'; // up, down, left, right
        this.spriteOffsetY = -8; // For 16x24 sprites on 16x16 tile
    }

    update(dt, game) {
        // Override
    }

    draw(renderer, camera) {
        if (!this.visible || !this.sprite) return;
        renderer.drawSprite(this.sprite, this.drawX, this.drawY + this.spriteOffsetY, camera);
    }

    distanceTo(other) {
        return Math.abs(this.tileX - other.tileX) + Math.abs(this.tileY - other.tileY);
    }
}
