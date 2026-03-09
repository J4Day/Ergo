// Stealth System
// Player can hide behind certain objects (furniture, desks, trees)
// Shadow has line-of-sight detection
// Holding breath while behind cover = invisible to Shadow

class StealthSystem {
    constructor() {
        this.coverTiles = new Set(); // "x,y" keys of cover tiles
        this.playerHidden = false;
        this.lastDetectionCheck = 0;
        this.detectionInterval = 0.2; // check every 200ms
        this.shadowAlertLevel = 0; // 0=unaware, 0-1=suspicious, 1=detected
        this.alertDecayRate = 0.3;
        this.investigatePoint = null; // {x, y} where shadow goes to investigate
    }

    // Register cover tiles for current room
    buildCoverMap(room) {
        this.coverTiles.clear();
        if (!room || !room.tilemap) return;

        const w = room.width;
        const h = room.height;
        const objects = room.tilemap.layers.objects || [];
        const walls = room.tilemap.layers.walls || [];

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const objTile = objects[y * w + x] || 0;
                const wallTile = walls[y * w + x] || 0;

                // Objects that provide cover: furniture (6,7), desks, trees, bed
                if (objTile >= 6 && objTile <= 9) {
                    this.coverTiles.add(x + ',' + y);
                }
                // Wall tiles provide cover
                if (wallTile > 0) {
                    this.coverTiles.add(x + ',' + y);
                }
            }
        }
    }

    // Check if a tile is cover
    isCover(x, y) {
        return this.coverTiles.has(x + ',' + y);
    }

    // Check if player is adjacent to cover
    isPlayerNearCover(player) {
        const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        for (const [dx, dy] of dirs) {
            if (this.isCover(player.tileX + dx, player.tileY + dy)) {
                return true;
            }
        }
        return false;
    }

    // Simple line-of-sight check between shadow and player
    hasLineOfSight(shadow, player, tilemap) {
        if (!tilemap) return true;

        let x0 = shadow.tileX;
        let y0 = shadow.tileY;
        const x1 = player.tileX;
        const y1 = player.tileY;

        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (x0 !== x1 || y0 !== y1) {
            // Check if this tile blocks sight
            if (this.isCover(x0, y0) && !(x0 === shadow.tileX && y0 === shadow.tileY)) {
                return false;
            }
            if (tilemap.isSolid(x0, y0) && !(x0 === shadow.tileX && y0 === shadow.tileY)) {
                return false;
            }

            const e2 = err * 2;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }

        return true;
    }

    update(dt, game) {
        this.lastDetectionCheck += dt;
        if (this.lastDetectionCheck < this.detectionInterval) return;
        this.lastDetectionCheck = 0;

        const player = game.player;
        const shadow = game.shadow;
        const breath = game.breath;

        if (!player || !shadow || !shadow.active) {
            this.playerHidden = false;
            this.shadowAlertLevel = Math.max(0, this.shadowAlertLevel - this.alertDecayRate);
            return;
        }

        const nearCover = this.isPlayerNearCover(player);
        const holdingBreath = breath && breath.isHiding;
        const noLOS = game.currentRoom && game.currentRoom.tilemap &&
                      !this.hasLineOfSight(shadow, player, game.currentRoom.tilemap);

        // Player is hidden if: near cover AND (holding breath OR no line of sight)
        this.playerHidden = nearCover && (holdingBreath || noLOS);

        // Also hidden if just holding breath and far enough away (>6 tiles)
        if (holdingBreath && shadow.distanceTo(player) > 6) {
            this.playerHidden = true;
        }

        // Update alert level
        if (this.playerHidden) {
            // Alert decays when hidden
            this.shadowAlertLevel = Math.max(0, this.shadowAlertLevel - this.alertDecayRate * 0.5);
        } else {
            const dist = shadow.distanceTo(player);
            if (dist < 8) {
                // Detection ramps up based on distance
                const detectionRate = (8 - dist) / 8 * 2;
                this.shadowAlertLevel = Math.min(1, this.shadowAlertLevel + detectionRate * 0.2);
            } else {
                this.shadowAlertLevel = Math.max(0, this.shadowAlertLevel - this.alertDecayRate * 0.3);
            }
        }

        // When player was seen and then hides, shadow investigates last known position
        if (this.playerHidden && this.shadowAlertLevel > 0.3) {
            this.investigatePoint = { x: player.tileX, y: player.tileY };
        }
    }

    // Called by Shadow's chase logic to modify behavior
    getShadowTarget(shadow, player) {
        if (this.playerHidden && this.investigatePoint) {
            // Move toward last known position instead of player
            return this.investigatePoint;
        }
        if (this.playerHidden) {
            // Wander randomly - lost the player
            return null;
        }
        // Normal chase
        return { x: player.tileX, y: player.tileY };
    }
}
