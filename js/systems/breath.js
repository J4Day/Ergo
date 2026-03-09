// Breath Holding System
// Hold Space to hold breath - become hidden from Shadow
// Screen darkens, heartbeat intensifies
// Overdoing it triggers panic attack

class BreathSystem {
    constructor() {
        this.holding = false;
        this.breathStamina = 100;   // 0-100
        this.maxStamina = 100;
        this.drainRate = 33;         // ~3 seconds to empty
        this.recoveryRate = 12;      // ~8 seconds to fully recover
        this.panicThreshold = 0;     // triggers panic at 0
        this.cooldown = 0;           // can't hold again right after panic
        this.panicActive = false;
        this.panicTimer = 0;
        this.panicDuration = 2.5;
        this.holdDuration = 0;       // how long currently holding

        // Visual
        this.darknessAlpha = 0;
        this.heartbeatTimer = 0;
        this.breathSoundTimer = 0;
    }

    get canHold() {
        return this.breathStamina > 5 && this.cooldown <= 0 && !this.panicActive;
    }

    get isHiding() {
        return this.holding && !this.panicActive;
    }

    startHolding() {
        if (!this.canHold) return false;
        this.holding = true;
        this.holdDuration = 0;
        return true;
    }

    stopHolding() {
        this.holding = false;
        this.holdDuration = 0;
    }

    update(dt, game) {
        // Panic attack update
        if (this.panicActive) {
            this.updatePanic(dt, game);
            return;
        }

        // Cooldown after panic
        if (this.cooldown > 0) {
            this.cooldown -= dt;
        }

        // Handle breath holding
        if (this.holding) {
            this.holdDuration += dt;
            this.breathStamina -= this.drainRate * dt;

            // Heartbeat gets faster as stamina depletes
            this.heartbeatTimer += dt;
            const beatInterval = 0.3 + (this.breathStamina / 100) * 1.2;
            if (this.heartbeatTimer >= beatInterval) {
                this.heartbeatTimer = 0;
                if (game.audio) game.audio.playHeartbeat();
            }

            // Darkness increases
            this.darknessAlpha = Math.min(0.7, (100 - this.breathStamina) / 100 * 0.7);

            // Screen effects intensify
            if (game.effects) {
                const intensity = 1 - this.breathStamina / 100;
                game.effects.enable('vignette', { strength: 0.5 + intensity * 0.4 });
                if (intensity > 0.5) {
                    game.effects.enable('noise', { intensity: intensity * 0.04 });
                }
            }

            // Ran out - panic attack!
            if (this.breathStamina <= 0) {
                this.triggerPanic(game);
            }
        } else {
            // Recovery
            this.breathStamina = Math.min(this.maxStamina, this.breathStamina + this.recoveryRate * dt);
            this.darknessAlpha = Math.max(0, this.darknessAlpha - dt * 2);
            this.holdDuration = 0;
        }
    }

    triggerPanic(game) {
        this.holding = false;
        this.panicActive = true;
        this.panicTimer = 0;
        this.cooldown = 4; // can't hold for 4 seconds after panic
        this.breathStamina = 0;

        // Effects
        if (game.audio) {
            game.audio.playShadowScream(); // loud gasp/scream
            game.audio.playHeartbeat();
        }
        if (game.camera) {
            game.camera.shake(5, 1.5);
        }
        if (game.effects) {
            game.effects.flash(0.5, '#ff0000');
            game.effects.enable('glitch', { intensity: 0.4 });
            game.effects.enable('chromatic', { offset: 4 });
        }
        if (game.sanity) {
            game.sanity.onPanicAttack();
        }
    }

    updatePanic(dt, game) {
        this.panicTimer += dt;
        this.darknessAlpha = Math.max(0, 0.5 - this.panicTimer * 0.3);

        // Heavy breathing effect
        this.breathSoundTimer += dt;
        if (this.breathSoundTimer > 0.5) {
            this.breathSoundTimer = 0;
            if (game.audio) game.audio.playHeartbeat();
        }

        // Screen distortion fading
        if (game.effects && this.panicTimer > 1) {
            const fade = (this.panicTimer - 1) / (this.panicDuration - 1);
            game.effects.enable('glitch', { intensity: 0.4 * (1 - fade) });
        }

        if (this.panicTimer >= this.panicDuration) {
            this.panicActive = false;
            this.panicTimer = 0;
            this.breathStamina = 20; // partial recovery
            if (game.effects) {
                game.effects.disable('glitch');
                game.effects.disable('chromatic');
            }
        }
    }

    draw(ctx) {
        if (this.darknessAlpha <= 0 && !this.holding) return;

        const w = CONFIG.INTERNAL_WIDTH;
        const h = CONFIG.INTERNAL_HEIGHT;

        // Darkness overlay
        if (this.darknessAlpha > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${this.darknessAlpha})`;
            ctx.fillRect(0, 0, w, h);
        }

        // Breath indicator (subtle, no UI bar — just a visual cue)
        if (this.holding) {
            // Pulsing vignette
            const pulse = Math.sin(Date.now() * 0.005) * 0.1;
            const gradient = ctx.createRadialGradient(w / 2, h / 2, w * 0.15, w / 2, h / 2, w * 0.5);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, `rgba(0,0,20,${0.3 + pulse + this.darknessAlpha * 0.3})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);
        }

        // Panic visual
        if (this.panicActive) {
            const intensity = Math.max(0, 1 - this.panicTimer / this.panicDuration);
            ctx.fillStyle = `rgba(80, 0, 0, ${intensity * 0.3})`;
            ctx.fillRect(0, 0, w, h);

            // Rapid screen pulse
            if (Math.sin(this.panicTimer * 20) > 0) {
                ctx.fillStyle = `rgba(255, 0, 0, ${intensity * 0.05})`;
                ctx.fillRect(0, 0, w, h);
            }
        }
    }
}
