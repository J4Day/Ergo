class NPC extends Entity {
    constructor(x, y, config) {
        super(x, y);
        this.name = config.name || 'npc';
        this.sprite = config.sprite || null;
        this.solid = config.solid !== false;
        this.dialogueId = config.dialogueId || null;
        this.onInteract = config.onInteract || null;
        this.patrol = config.patrol || null; // Array of {x, y} points
        this.patrolIndex = 0;
        this.patrolTimer = 0;
        this.patrolSpeed = config.patrolSpeed || 2;
        this.facePlayer = config.facePlayer !== false;
        this.floatEffect = config.floatEffect || false;
        this.floatTimer = 0;
        this.spriteOffsetY = config.spriteOffsetY || -8;
    }

    update(dt, game) {
        // Float effect (for Doctor's face)
        if (this.floatEffect) {
            this.floatTimer += dt;
        }

        // Patrol
        if (this.patrol && this.patrol.length > 1 && !game.state.is('dialogue')) {
            this.patrolTimer += dt;
            if (this.patrolTimer > this.patrolSpeed) {
                this.patrolTimer = 0;
                this.patrolIndex = (this.patrolIndex + 1) % this.patrol.length;
                const target = this.patrol[this.patrolIndex];
                this.tileX = target.x;
                this.tileY = target.y;
                this.drawX = target.x * CONFIG.TILE_SIZE;
                this.drawY = target.y * CONFIG.TILE_SIZE;
            }
        }
    }

    draw(renderer, camera) {
        if (!this.visible || !this.sprite) return;
        let offsetY = this.spriteOffsetY;
        if (this.floatEffect) {
            offsetY += Math.sin(this.floatTimer * 2) * 2;
        }
        renderer.drawSprite(this.sprite, this.drawX, this.drawY + offsetY, camera);
    }
}
