class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeTimer = 0;
        this.driftAngle = 0;
        this.driftAmount = 0;
        this.zoom = 1;
    }

    follow(entity, roomWidth, roomHeight) {
        const roomPixelW = roomWidth * CONFIG.TILE_SIZE;
        const roomPixelH = roomHeight * CONFIG.TILE_SIZE;

        if (roomPixelW <= CONFIG.INTERNAL_WIDTH) {
            // Room fits on screen — center it
            this.targetX = -(CONFIG.INTERNAL_WIDTH - roomPixelW) / 2;
        } else {
            this.targetX = entity.drawX + 8 - CONFIG.INTERNAL_WIDTH / 2;
            const maxX = roomPixelW - CONFIG.INTERNAL_WIDTH;
            this.targetX = Math.max(0, Math.min(this.targetX, maxX));
        }

        if (roomPixelH <= CONFIG.INTERNAL_HEIGHT) {
            this.targetY = -(CONFIG.INTERNAL_HEIGHT - roomPixelH) / 2;
        } else {
            this.targetY = entity.drawY + 12 - CONFIG.INTERNAL_HEIGHT / 2;
            const maxY = roomPixelH - CONFIG.INTERNAL_HEIGHT;
            this.targetY = Math.max(0, Math.min(this.targetY, maxY));
        }
    }

    update(dt) {
        this.x += (this.targetX - this.x) * 0.15;
        this.y += (this.targetY - this.y) * 0.15;

        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
        }

        this.driftAngle += dt * 0.5;
    }

    shake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeTimer = duration;
    }

    get offsetX() {
        let ox = -Math.round(this.x);
        if (this.shakeTimer > 0) {
            ox += (Math.random() - 0.5) * this.shakeIntensity * 2;
        }
        if (this.driftAmount > 0) {
            ox += Math.sin(this.driftAngle) * this.driftAmount;
        }
        return Math.round(ox);
    }

    get offsetY() {
        let oy = -Math.round(this.y);
        if (this.shakeTimer > 0) {
            oy += (Math.random() - 0.5) * this.shakeIntensity * 2;
        }
        if (this.driftAmount > 0) {
            oy += Math.cos(this.driftAngle * 0.7) * this.driftAmount;
        }
        return Math.round(oy);
    }
}
