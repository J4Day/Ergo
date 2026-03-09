// Hidden Sanity System
// Affects: hallucination frequency, whisper frequency, screen distortions
// Never shown as a bar - only manifests through effects

class SanitySystem {
    constructor() {
        this.value = 100; // 0 = insane, 100 = stable
        this.max = 100;
        this.displayValue = 100; // smoothed for effects
        this.lastWhisperTime = 0;
        this.hallucinationCooldown = 0;

        // Thresholds
        this.MILD = 70;      // subtle distortions begin
        this.MODERATE = 50;   // hallucinations, whispers
        this.SEVERE = 30;     // intense effects, shadow speaks
        this.CRITICAL = 15;   // near-breakdown

        // Ambient hallucination entities
        this.ambientEntities = []; // {x, y, type, life, opacity, flickerPhase}
    }

    // === MODIFIERS ===

    drain(amount) {
        this.value = Math.max(0, this.value - amount);
    }

    restore(amount) {
        this.value = Math.min(this.max, this.value + amount);
    }

    // Contextual drains
    onNearShadow(dist, dt) {
        if (dist < 6) {
            this.drain(dt * (6 - dist) * 1.5);
        }
    }

    onCorruptionTile(dt) {
        this.drain(dt * 2);
    }

    onMemoryRejected() {
        this.drain(12);
    }

    onShadowCatch() {
        this.drain(20);
    }

    onPanicAttack() {
        this.drain(25);
    }

    // Contextual restores
    onMemoryAccepted() {
        this.restore(15);
    }

    onNoteFound() {
        this.restore(5);
    }

    onPuzzleSolved() {
        this.restore(10);
    }

    onSafeRoom(dt) {
        // Slowly restore in white room / corridor
        this.restore(dt * 3);
    }

    // === QUERIES ===

    get level() {
        if (this.value > this.MILD) return 'stable';
        if (this.value > this.MODERATE) return 'mild';
        if (this.value > this.SEVERE) return 'moderate';
        if (this.value > this.CRITICAL) return 'severe';
        return 'critical';
    }

    get hallucinationChance() {
        if (this.value > this.MILD) return 0;
        if (this.value > this.MODERATE) return 0.005;
        if (this.value > this.SEVERE) return 0.015;
        if (this.value > this.CRITICAL) return 0.03;
        return 0.06;
    }

    get whisperInterval() {
        if (this.value > this.MILD) return 999;
        if (this.value > this.MODERATE) return 12;
        if (this.value > this.SEVERE) return 6;
        if (this.value > this.CRITICAL) return 3;
        return 1.5;
    }

    get glitchIntensity() {
        if (this.value > this.MILD) return 0;
        return (this.MILD - this.value) / this.MILD * 0.15;
    }

    get noiseIntensity() {
        if (this.value > this.MODERATE) return 0;
        return (this.MODERATE - this.value) / this.MODERATE * 0.08;
    }

    get chromaticOffset() {
        if (this.value > this.MODERATE) return 0;
        return Math.floor((this.MODERATE - this.value) / this.MODERATE * 3);
    }

    // === UPDATE ===

    update(dt, game) {
        // Smooth display value
        this.displayValue += (this.value - this.displayValue) * dt * 2;

        // Natural slow recovery when not being drained
        if (game.currentRoom) {
            const roomName = game.currentRoom.name;
            if (roomName === 'whiteRoom' || roomName === 'corridor') {
                this.onSafeRoom(dt);
            }
        }

        // Apply sanity-based effects
        this.applySanityEffects(dt, game);

        // Ambient whispers
        this.lastWhisperTime += dt;
        if (this.lastWhisperTime >= this.whisperInterval) {
            this.lastWhisperTime = 0;
            if (game.audio && game.state.is('playing')) {
                game.audio.playShadowWhisper();
            }
        }

        // Spawn ambient hallucination entities
        this.hallucinationCooldown -= dt;
        if (this.hallucinationCooldown <= 0 && Math.random() < this.hallucinationChance) {
            this.spawnAmbientEntity(game);
            this.hallucinationCooldown = 3 + Math.random() * 5;
        }

        // Update ambient entities
        this.updateAmbientEntities(dt, game);
    }

    applySanityEffects(dt, game) {
        if (!game.effects || !game.state.is('playing')) return;

        const gi = this.glitchIntensity;
        const ni = this.noiseIntensity;
        const co = this.chromaticOffset;

        // Only add sanity effects if not already overridden by shadow proximity
        if (gi > 0 && (!game.shadow || !game.shadow.active)) {
            game.effects.enable('glitch', { intensity: gi });
        }
        if (ni > 0 && (!game.shadow || !game.shadow.active)) {
            game.effects.enable('noise', { intensity: ni });
        }
        if (co > 0 && (!game.shadow || !game.shadow.active)) {
            game.effects.enable('chromatic', { offset: co });
        }

        // Severe: screen breathe
        if (this.value <= this.SEVERE) {
            const amount = (this.SEVERE - this.value) / this.SEVERE * 1.5;
            if (!game.shadow || !game.shadow.active) {
                game.effects.enable('breathe', { speed: 1, amount: amount });
            }
        }

        // Critical: vignette darkens
        if (this.value <= this.CRITICAL) {
            game.effects.enable('vignette', { strength: 0.7 + (this.CRITICAL - this.value) / this.CRITICAL * 0.3 });
        }
    }

    // Faceless figures, distorted shapes - not enemies, just atmosphere
    spawnAmbientEntity(game) {
        if (this.ambientEntities.length >= 4) return;
        if (!game.currentRoom || !game.player) return;

        const types = ['facelessStudent', 'distortedSilhouette', 'floatingEye', 'mirrorMila'];
        const type = types[Math.floor(Math.random() * types.length)];
        const p = game.player;

        let ex = p.tileX + Math.floor(Math.random() * 10) - 5;
        let ey = p.tileY + Math.floor(Math.random() * 8) - 4;

        // Don't spawn on player
        if (ex === p.tileX && ey === p.tileY) ex += 2;

        this.ambientEntities.push({
            x: ex, y: ey, type,
            life: 3 + Math.random() * 4,
            maxLife: 7,
            opacity: 0,
            flickerPhase: Math.random() * Math.PI * 2
        });
    }

    updateAmbientEntities(dt, game) {
        const time = game.effects ? game.effects.time : 0;
        for (let i = this.ambientEntities.length - 1; i >= 0; i--) {
            const e = this.ambientEntities[i];
            e.life -= dt;

            // Fade in/out
            if (e.life > e.maxLife - 0.8) {
                e.opacity = Math.min(0.6, (e.maxLife - e.life) / 0.8 * 0.6);
            } else if (e.life < 1) {
                e.opacity = Math.max(0, e.life * 0.6);
            } else {
                e.opacity = 0.3 + Math.sin(e.flickerPhase + time * 3) * 0.2;
            }

            // Player walks into it - dissolve
            if (game.player && game.player.tileX === e.x && game.player.tileY === e.y && e.opacity > 0.2) {
                e.life = 0;
                if (game.currentRoom) {
                    ParticlePresets.glitchBurst(game.currentRoom.particles,
                        e.x * CONFIG.TILE_SIZE + 8, e.y * CONFIG.TILE_SIZE + 8);
                }
                this.drain(3);
            }

            if (e.life <= 0) {
                this.ambientEntities.splice(i, 1);
            }
        }
    }

    drawAmbientEntities(renderer, camera) {
        const ctx = renderer.ictx;
        const ts = CONFIG.TILE_SIZE;

        for (const e of this.ambientEntities) {
            if (e.opacity <= 0) continue;
            const px = e.x * ts + camera.offsetX;
            const py = e.y * ts + camera.offsetY;

            ctx.globalAlpha = e.opacity;

            switch (e.type) {
                case 'facelessStudent':
                    // Dark humanoid, no face
                    ctx.fillStyle = '#222';
                    ctx.fillRect(px + 4, py - 6, 8, 8); // head
                    ctx.fillRect(px + 2, py + 2, 12, 12); // body
                    ctx.fillRect(px + 2, py + 14, 4, 6); // legs
                    ctx.fillRect(px + 10, py + 14, 4, 6);
                    // No face - just smooth dark
                    ctx.fillStyle = '#181818';
                    ctx.fillRect(px + 5, py - 4, 6, 4);
                    break;

                case 'distortedSilhouette':
                    // Warped dark shape
                    ctx.fillStyle = '#111';
                    const warp = Math.sin(e.flickerPhase + Date.now() * 0.003) * 3;
                    ctx.fillRect(px + 3 + warp, py - 8, 10, 24);
                    ctx.fillRect(px + 1, py + 2, 14, 8);
                    break;

                case 'floatingEye':
                    // Single large eye
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(px + 4, py + 4, 8, 4);
                    ctx.fillStyle = '#ff0000';
                    ctx.fillRect(px + 7, py + 5, 3, 2);
                    ctx.fillStyle = '#000';
                    ctx.fillRect(px + 8, py + 5, 1, 2);
                    break;

                case 'mirrorMila':
                    // Distorted copy of player sprite, slightly wrong
                    ctx.fillStyle = '#d5ceb3';
                    ctx.fillRect(px + 5, py - 4, 6, 6); // head
                    ctx.fillStyle = '#e0e0e0';
                    ctx.fillRect(px + 4, py + 2, 8, 10); // body
                    // Wrong eyes - red
                    ctx.fillStyle = '#ff0000';
                    ctx.fillRect(px + 6, py - 2, 2, 1);
                    ctx.fillRect(px + 9, py - 2, 2, 1);
                    // Distorted smile
                    ctx.fillRect(px + 6, py + 1, 5, 1);
                    break;
            }
        }
        ctx.globalAlpha = 1;
    }
}
