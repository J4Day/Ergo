class Player extends Entity {
    constructor(x, y) {
        super(x, y);
        this.moving = false;
        this.moveTimer = 0;
        this.startX = 0;
        this.startY = 0;
        this.targetTileX = x;
        this.targetTileY = y;
        this.anim = new AnimationSet();
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.solid = true;
        this.interacting = false;
        this.corruptionSlow = false; // set by shadow when on corruption tile
        this.totalTilesMoved = 0;
        this.noCatchRun = true; // for "survivor" achievement
        this.frozen = false; // flashback/cutscene freeze
    }

    init(sprites) {
        this.sprites = sprites;
        this.sprite = sprites.downIdle;
    }

    update(dt, game) {
        if (game.state.is('dialogue') || game.state.is('transition') || game.state.is('cutscene') || this.frozen) {
            return;
        }

        // Sprint input
        const isSprinting = game.input.isDown('ShiftLeft') || game.input.isDown('ShiftRight');
        if (game.sprint) {
            if (isSprinting && !game.sprint.sprinting) game.sprint.startSprint();
            if (!isSprinting && game.sprint.sprinting) game.sprint.stopSprint();
            game.sprint.update(dt, game);
        }

        // Breath holding input
        if (game.breath) {
            const holdingBreath = game.input.isDown('Space');
            if (holdingBreath && !game.breath.holding) game.breath.startHolding();
            if (!holdingBreath && game.breath.holding) game.breath.stopHolding();
            game.breath.update(dt, game);
        }

        if (this.moving) {
            this.moveTimer += dt;
            let moveTime = this.corruptionSlow
                ? (CONFIG.PLAYER_MOVE_TIME / 1000) * 1.8
                : (CONFIG.PLAYER_MOVE_TIME / 1000);
            // Sprint makes movement faster
            if (game.sprint && game.sprint.sprinting) {
                moveTime *= game.sprint.moveTimeMultiplier;
            }
            // Holding breath makes movement slower
            if (game.breath && game.breath.holding) {
                moveTime *= 1.4;
            }
            const t = Math.min(this.moveTimer / moveTime, 1);
            // Smooth interpolation
            const ease = t * t * (3 - 2 * t);
            this.drawX = this.startX + (this.targetTileX * CONFIG.TILE_SIZE - this.startX) * ease;
            this.drawY = this.startY + (this.targetTileY * CONFIG.TILE_SIZE - this.startY) * ease;

            if (t >= 1) {
                this.tileX = this.targetTileX;
                this.tileY = this.targetTileY;
                this.drawX = this.tileX * CONFIG.TILE_SIZE;
                this.drawY = this.tileY * CONFIG.TILE_SIZE;
                this.moving = false;

                this.totalTilesMoved++;
                // Track sprint distance
                if (game.sprint && game.sprint.sprinting && game.meta) {
                    game.meta.onSprintTile();
                }
                // Check triggers at new position
                if (game.currentRoom) {
                    game.currentRoom.triggers.checkEnter(this.tileX, this.tileY, game);
                }
            }

            // Walk animation
            this.walkTimer += dt;
            if (this.walkTimer > 0.15) {
                this.walkTimer = 0;
                this.walkFrame = this.walkFrame === 1 ? 2 : 1;
                this.updateSprite();
            }
            return;
        }

        // Input
        let dx = 0, dy = 0;
        if (game.input.up) { dy = -1; this.direction = 'up'; }
        else if (game.input.down) { dy = 1; this.direction = 'down'; }
        else if (game.input.left) { dx = -1; this.direction = 'left'; }
        else if (game.input.right) { dx = 1; this.direction = 'right'; }

        if (dx !== 0 || dy !== 0) {
            const newX = this.tileX + dx;
            const newY = this.tileY + dy;

            // Check collision
            if (game.currentRoom && game.currentRoom.tilemap && !game.currentRoom.tilemap.isSolid(newX, newY)) {
                // Check entity collision
                let blocked = false;
                if (game.currentRoom) {
                    for (const e of game.currentRoom.entities) {
                        if (e.solid && e.tileX === newX && e.tileY === newY) {
                            blocked = true;
                            break;
                        }
                    }
                }
                if (!blocked) {
                    this.moving = true;
                    this.moveTimer = 0;
                    this.startX = this.drawX;
                    this.startY = this.drawY;
                    this.targetTileX = newX;
                    this.targetTileY = newY;
                    game.audio.playFootstep();
                }
            }
        }

        // Idle sprite
        this.walkFrame = 0;
        this.updateSprite();

        // Interaction
        if (game.input.confirm) {
            const facingX = this.tileX + (this.direction === 'right' ? 1 : this.direction === 'left' ? -1 : 0);
            const facingY = this.tileY + (this.direction === 'down' ? 1 : this.direction === 'up' ? -1 : 0);

            // Check triggers
            if (game.currentRoom) {
                const triggered = game.currentRoom.triggers.checkInteract(facingX, facingY, game);

                // Check NPC interaction
                if (!triggered) {
                    for (const e of game.currentRoom.entities) {
                        if (e.tileX === facingX && e.tileY === facingY && e.onInteract) {
                            e.onInteract(game);
                            break;
                        }
                    }
                }
            }
        }
    }

    updateSprite() {
        if (!this.sprites) return;
        const dir = this.direction;
        if (this.walkFrame === 0) {
            this.sprite = this.sprites[dir + 'Idle'] || this.sprites.downIdle;
        } else if (this.walkFrame === 1) {
            this.sprite = this.sprites[dir + 'Walk1'] || this.sprites.downIdle;
        } else {
            this.sprite = this.sprites[dir + 'Walk2'] || this.sprites.downIdle;
        }
    }

    teleport(x, y) {
        this.tileX = x;
        this.tileY = y;
        this.targetTileX = x;
        this.targetTileY = y;
        this.drawX = x * CONFIG.TILE_SIZE;
        this.drawY = y * CONFIG.TILE_SIZE;
        this.moving = false;
    }
}
