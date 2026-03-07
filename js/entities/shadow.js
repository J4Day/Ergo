class Shadow extends Entity {
    constructor(x, y) {
        super(x, y);
        this.active = false;
        this.speed = 1.5; // seconds per tile
        this.moveTimer = 0;
        this.glitchTimer = 0;
        this.chaseStarted = false;
        this.visible = false;
        this.solid = false;
    }

    activate(x, y) {
        this.tileX = x;
        this.tileY = y;
        this.drawX = x * CONFIG.TILE_SIZE;
        this.drawY = y * CONFIG.TILE_SIZE;
        this.active = true;
        this.visible = true;
        this.chaseStarted = true;
    }

    deactivate() {
        this.active = false;
        this.visible = false;
        this.chaseStarted = false;
    }

    update(dt, game) {
        if (!this.active || game.state.is('dialogue') || game.state.is('transition')) return;

        this.glitchTimer += dt;

        // Move towards player
        this.moveTimer += dt;
        if (this.moveTimer >= this.speed) {
            this.moveTimer = 0;

            const player = game.player;
            const dx = player.tileX - this.tileX;
            const dy = player.tileY - this.tileY;

            // Simple pathfinding: move in the direction with greater distance
            let moveX = 0, moveY = 0;
            if (Math.abs(dx) > Math.abs(dy)) {
                moveX = dx > 0 ? 1 : -1;
            } else if (dy !== 0) {
                moveY = dy > 0 ? 1 : -1;
            }

            const newX = this.tileX + moveX;
            const newY = this.tileY + moveY;

            if (game.currentRoom && game.currentRoom.tilemap && !game.currentRoom.tilemap.isSolid(newX, newY)) {
                this.tileX = newX;
                this.tileY = newY;
                this.drawX = newX * CONFIG.TILE_SIZE;
                this.drawY = newY * CONFIG.TILE_SIZE;
            }

            // Check if caught player
            if (this.tileX === player.tileX && this.tileY === player.tileY) {
                this.onCatchPlayer(game);
            }
        }

        // Periodically intensify effects as shadow gets closer
        if (game.player) {
            const dist = this.distanceTo(game.player);
            if (dist < 5) {
                game.effects.enable('glitch', { intensity: 0.1 + (5 - dist) * 0.1 });
                if (dist < 3 && Math.random() < 0.02) {
                    game.audio.playHeartbeat();
                }
            }
        }
    }

    onCatchPlayer(game) {
        game.state.incrementFlag('shadowEncounters');
        game.audio.playGlitch();
        game.effects.flash(0.5, '#000');
        game.camera.shake(4, 0.5);

        // Show brief dialogue
        game.dialogue.show(DIALOGUES.shadowChase, game);

        // Teleport player to room start
        const start = game.currentRoom.playerStart;
        game.player.teleport(start.x, start.y);

        // Deactivate shadow temporarily
        this.deactivate();

        // Reactivate after delay
        setTimeout(() => {
            if (game.currentRoom && game.currentRoom.name !== 'whiteRoom' && game.currentRoom.name !== 'void') {
                const room = game.currentRoom;
                const sx = Math.random() < 0.5 ? 1 : room.width - 2;
                const sy = Math.random() < 0.5 ? 1 : room.height - 2;
                this.activate(sx, sy);
            }
        }, 8000);
    }

    draw(renderer, camera) {
        if (!this.visible || !this.sprite) return;

        // Glitch offset effect
        let ox = 0, oy = 0;
        if (Math.random() < 0.1) {
            ox = Math.floor((Math.random() - 0.5) * 4);
        }

        renderer.drawSprite(
            this.sprite,
            this.drawX + ox,
            this.drawY + this.spriteOffsetY + oy,
            camera
        );

        // Afterimage
        if (Math.random() < 0.3) {
            renderer.ictx.globalAlpha = 0.3;
            renderer.drawSprite(
                this.sprite,
                this.drawX + ox + (Math.random() - 0.5) * 6,
                this.drawY + this.spriteOffsetY + (Math.random() - 0.5) * 4,
                camera
            );
            renderer.ictx.globalAlpha = 1;
        }
    }
}
