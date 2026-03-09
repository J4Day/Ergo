// Sprint System
// Hold Shift to run - ~3 seconds of sprint, long recovery
// Sprinting makes noise (Shadow can detect)

class SprintSystem {
    constructor() {
        this.stamina = 100;
        this.maxStamina = 100;
        this.drainRate = 33;        // ~3 seconds full sprint
        this.recoveryRate = 12.5;   // ~8 seconds full recovery
        this.sprinting = false;
        this.minStaminaToStart = 20; // need at least 20% to start sprinting
        this.sprintMoveMultiplier = 0.55; // 45% faster movement
        this.noiseTimer = 0;
        this.noiseInterval = 0.4;   // footstep noise frequency when sprinting
        this.exhausted = false;     // true when stamina hits 0, can't sprint until 30%
        this.exhaustionThreshold = 30;
    }

    get canSprint() {
        if (this.exhausted) return this.stamina >= this.exhaustionThreshold;
        return this.stamina >= this.minStaminaToStart;
    }

    get moveTimeMultiplier() {
        return this.sprinting ? this.sprintMoveMultiplier : 1;
    }

    startSprint() {
        if (!this.canSprint) return false;
        this.sprinting = true;
        this.exhausted = false;
        return true;
    }

    stopSprint() {
        this.sprinting = false;
    }

    update(dt, game) {
        if (this.sprinting) {
            this.stamina -= this.drainRate * dt;

            // Make noise - alerts shadow
            this.noiseTimer += dt;
            if (this.noiseTimer >= this.noiseInterval) {
                this.noiseTimer = 0;
                if (game.audio) {
                    game.audio.playFootstep();
                }
                // Alert shadow to player position
                if (game.shadow && game.shadow.active && game.stealth) {
                    game.stealth.shadowAlertLevel = Math.min(1,
                        game.stealth.shadowAlertLevel + 0.15);
                    game.stealth.investigatePoint = {
                        x: game.player.tileX,
                        y: game.player.tileY
                    };
                }
            }

            // Ran out
            if (this.stamina <= 0) {
                this.stamina = 0;
                this.sprinting = false;
                this.exhausted = true;
            }
        } else {
            // Recovery (slower than drain)
            this.stamina = Math.min(this.maxStamina, this.stamina + this.recoveryRate * dt);
            if (this.exhausted && this.stamina >= this.exhaustionThreshold) {
                this.exhausted = false;
            }
            this.noiseTimer = 0;
        }
    }
}
