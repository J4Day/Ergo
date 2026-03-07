class Shadow extends Entity {
    constructor(x, y) {
        super(x, y);
        this.active = false;
        this.speed = 1.5; // seconds between moves
        this.baseSpeed = 1.5;
        this.moveTimer = 0;
        this.glitchTimer = 0;
        this.chaseStarted = false;
        this.visible = false;
        this.solid = false;

        // Smooth movement
        this.moving = false;
        this.startDrawX = 0;
        this.startDrawY = 0;
        this.moveLerp = 0;

        // Visual trail (last N positions)
        this.trail = [];
        this.trailMax = 7;

        // Flicker
        this.flickerTimer = 0;
        this.flickerVisible = true;

        // Whisper cooldown
        this.whisperTimer = 0;

        // === FEAR SYSTEM ===
        this.fearLevel = 0; // 0-1 intensity
        this.fearPulseTimer = 0;
        this.heartbeatTimer = 0;
        this.heartbeatInterval = 2.0; // seconds between beats, decreases with fear

        // === CORRUPTION ===
        this.corruptionTrail = []; // tiles the shadow has walked on
        this.corruptionMax = 30;

        // === HALLUCINATIONS ===
        this.hallucinationTimer = 0;
        this.hallucinations = []; // {x, y, type, life, maxLife}
        this.hallucinationCooldown = 0;

        // === ADAPTIVE AI ===
        this.catchCount = 0; // times caught player in this room
        this.ambushMode = false;
        this.ambushTimer = 0;
        this.teleportCooldown = 0;
        this.lastPlayerTileX = -1;
        this.lastPlayerTileY = -1;
        this.playerStillTimer = 0; // track if player is stationary

        // === JUMPSCARE ===
        this.jumpscareActive = false;
        this.jumpscareTimer = 0;
        this.jumpscareDuration = 1.2;

        // === FACE FLASH ===
        this.faceFlashTimer = 0;
        this.faceFlashActive = false;
    }

    activate(x, y) {
        this.tileX = x;
        this.tileY = y;
        this.drawX = x * CONFIG.TILE_SIZE;
        this.drawY = y * CONFIG.TILE_SIZE;
        this.active = true;
        this.visible = true;
        this.chaseStarted = true;
        this.trail = [];
        this.corruptionTrail = [];
        this.hallucinations = [];
        this.ambushMode = false;
        this.teleportCooldown = 0;
        // Get faster each activation
        this.speed = Math.max(0.6, this.baseSpeed - this.catchCount * 0.15);
    }

    deactivate() {
        this.active = false;
        this.visible = false;
        this.chaseStarted = false;
        this.trail = [];
        // Corruption and hallucinations linger after shadow leaves
        this.ambushMode = false;
        this.jumpscareActive = false;
        this.faceFlashActive = false;
    }

    update(dt, game) {
        // Update hallucinations even when not active (they linger)
        this.updateHallucinations(dt, game);

        // Update jumpscare
        if (this.jumpscareActive) {
            this.updateJumpscare(dt, game);
            return;
        }

        if (!this.active || game.state.is('dialogue') || game.state.is('transition')) return;

        this.glitchTimer += dt;
        this.whisperTimer += dt;
        this.teleportCooldown -= dt;

        // === FEAR LEVEL CALCULATION ===
        if (game.player) {
            const dist = this.distanceTo(game.player);
            const targetFear = dist < 8 ? Math.min(1, (8 - dist) / 8) : 0;
            // Fear ramps up fast, fades slow
            if (targetFear > this.fearLevel) {
                this.fearLevel += (targetFear - this.fearLevel) * dt * 3;
            } else {
                this.fearLevel += (targetFear - this.fearLevel) * dt * 0.5;
            }
        }

        // Smooth interpolation for movement
        if (this.moving) {
            this.moveLerp += dt / (this.speed * 0.3);
            if (this.moveLerp >= 1) {
                this.moveLerp = 1;
                this.moving = false;
                this.drawX = this.tileX * CONFIG.TILE_SIZE;
                this.drawY = this.tileY * CONFIG.TILE_SIZE;
            } else {
                const ease = this.moveLerp * this.moveLerp;
                this.drawX = this.startDrawX + (this.tileX * CONFIG.TILE_SIZE - this.startDrawX) * ease;
                this.drawY = this.startDrawY + (this.tileY * CONFIG.TILE_SIZE - this.startDrawY) * ease;
            }
        }

        // === FLICKER — more intense when closer ===
        this.flickerTimer += dt;
        if (game.player) {
            const dist = this.distanceTo(game.player);
            const flickerChance = dist < 2 ? 0.3 : dist < 4 ? 0.15 : 0.05;
            if (this.flickerTimer > 0.08) {
                this.flickerTimer = 0;
                this.flickerVisible = Math.random() > flickerChance;
            }
        }

        // === AMBUSH MODE — if player is still, shadow teleports closer ===
        if (game.player) {
            if (game.player.tileX === this.lastPlayerTileX &&
                game.player.tileY === this.lastPlayerTileY) {
                this.playerStillTimer += dt;
            } else {
                this.playerStillTimer = 0;
                this.lastPlayerTileX = game.player.tileX;
                this.lastPlayerTileY = game.player.tileY;
            }

            // Teleport ambush if player stands still too long
            if (this.playerStillTimer > 4 && this.teleportCooldown <= 0 && !this.moving) {
                this.tryTeleportCloser(game);
                this.playerStillTimer = 0;
                this.teleportCooldown = 8;
            }
        }

        // === MOVEMENT — chase player with smarter pathing ===
        this.moveTimer += dt;
        if (this.moveTimer >= this.speed && !this.moving) {
            this.moveTimer = 0;
            this.chaseMove(game);
        }

        // === CORRUPTION TRAIL ===
        // Leave corruption on tiles we pass through
        if (!this.moving && this.active) {
            const key = this.tileX + ',' + this.tileY;
            if (!this.corruptionTrail.some(c => c.key === key)) {
                this.corruptionTrail.push({
                    key, x: this.tileX, y: this.tileY,
                    life: 15, maxLife: 15 // corruption lasts 15 seconds
                });
                if (this.corruptionTrail.length > this.corruptionMax) {
                    this.corruptionTrail.shift();
                }
            }
        }

        // Decay corruption
        for (let i = this.corruptionTrail.length - 1; i >= 0; i--) {
            this.corruptionTrail[i].life -= dt;
            if (this.corruptionTrail[i].life <= 0) {
                this.corruptionTrail.splice(i, 1);
            }
        }

        // === PLAYER ON CORRUPTION — slowdown + distortion ===
        if (game.player) {
            const onCorruption = this.corruptionTrail.some(
                c => c.x === game.player.tileX && c.y === game.player.tileY
            );
            game.player.corruptionSlow = onCorruption;
        }

        // Fade trail
        for (let i = this.trail.length - 1; i >= 0; i--) {
            this.trail[i].alpha -= dt * 0.6;
            if (this.trail[i].alpha <= 0) this.trail.splice(i, 1);
        }

        // === PROXIMITY EFFECTS — escalating horror ===
        this.updateProximityEffects(dt, game);

        // === HALLUCINATION SPAWNING ===
        this.hallucinationCooldown -= dt;
        if (this.fearLevel > 0.4 && this.hallucinationCooldown <= 0 && game.player) {
            this.spawnHallucination(game);
            this.hallucinationCooldown = 6 - this.fearLevel * 3; // more frequent when closer
        }

        // === FACE FLASH — brief subliminal shadow face ===
        this.faceFlashTimer -= dt;
        if (this.fearLevel > 0.5 && this.faceFlashTimer <= 0 && Math.random() < 0.005) {
            this.faceFlashActive = true;
            this.faceFlashTimer = 8 + Math.random() * 12;
            setTimeout(() => { this.faceFlashActive = false; }, 120); // 120ms subliminal flash
        }
    }

    chaseMove(game) {
        const player = game.player;
        const dx = player.tileX - this.tileX;
        const dy = player.tileY - this.tileY;

        // Sometimes take suboptimal paths to seem more unpredictable
        let moveX = 0, moveY = 0;
        if (Math.random() < 0.15) {
            // Random lateral move — feels like stalking
            const dirs = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
            const pick = dirs[Math.floor(Math.random() * dirs.length)];
            moveX = pick.x;
            moveY = pick.y;
        } else {
            if (Math.abs(dx) > Math.abs(dy)) {
                moveX = dx > 0 ? 1 : -1;
            } else if (dy !== 0) {
                moveY = dy > 0 ? 1 : -1;
            }
        }

        const newX = this.tileX + moveX;
        const newY = this.tileY + moveY;

        if (game.currentRoom && game.currentRoom.tilemap && !game.currentRoom.tilemap.isSolid(newX, newY)) {
            this.trail.push({ x: this.drawX, y: this.drawY, alpha: 1 });
            if (this.trail.length > this.trailMax) this.trail.shift();

            this.startDrawX = this.drawX;
            this.startDrawY = this.drawY;
            this.tileX = newX;
            this.tileY = newY;
            this.moving = true;
            this.moveLerp = 0;
        }

        if (this.tileX === player.tileX && this.tileY === player.tileY) {
            this.onCatchPlayer(game);
        }
    }

    tryTeleportCloser(game) {
        if (!game.currentRoom || !game.currentRoom.tilemap) return;
        const player = game.player;
        const dist = this.distanceTo(player);
        if (dist <= 3) return; // already close

        // Find a tile 2-3 tiles away from player, out of view
        const candidates = [];
        for (let dy = -4; dy <= 4; dy++) {
            for (let dx = -4; dx <= 4; dx++) {
                const nx = player.tileX + dx;
                const ny = player.tileY + dy;
                const d = Math.abs(dx) + Math.abs(dy);
                if (d >= 3 && d <= 5 && !game.currentRoom.tilemap.isSolid(nx, ny)) {
                    candidates.push({x: nx, y: ny});
                }
            }
        }

        if (candidates.length > 0) {
            const pick = candidates[Math.floor(Math.random() * candidates.length)];

            // Glitch effect at old position
            if (game.currentRoom) {
                ParticlePresets.glitchBurst(game.currentRoom.particles, this.drawX + 8, this.drawY + 12);
            }
            game.audio.playGlitch();

            // Briefly invisible, then appear
            this.visible = false;
            this.tileX = pick.x;
            this.tileY = pick.y;
            this.drawX = pick.x * CONFIG.TILE_SIZE;
            this.drawY = pick.y * CONFIG.TILE_SIZE;

            setTimeout(() => {
                this.visible = true;
                if (game.currentRoom) {
                    ParticlePresets.glitchBurst(game.currentRoom.particles, this.drawX + 8, this.drawY + 12);
                }
            }, 300);
        }
    }

    updateProximityEffects(dt, game) {
        if (!game.player) return;
        const dist = this.distanceTo(game.player);

        // === HEARTBEAT — accelerates with proximity ===
        this.heartbeatTimer += dt;
        if (dist < 6) {
            this.heartbeatInterval = Math.max(0.4, 2.0 - (6 - dist) * 0.3);
            if (this.heartbeatTimer >= this.heartbeatInterval) {
                this.heartbeatTimer = 0;
                game.audio.playHeartbeat();
            }
        }

        // === VISUAL EFFECTS — escalating ===
        if (dist < 8) {
            const intensity = (8 - dist) / 8;

            // Glitch increases dramatically
            game.effects.enable('glitch', { intensity: 0.03 + intensity * 0.25 });

            // Chromatic aberration
            game.effects.enable('chromatic', { offset: Math.max(1, Math.floor(intensity * 4)) });

            // Noise increases
            if (intensity > 0.3) {
                game.effects.enable('noise', { intensity: 0.02 + intensity * 0.08 });
            }

            // VHS scanlines at close range
            if (dist < 4) {
                game.effects.enable('vhs');
            }

            // Screen breathing/distortion at very close range
            if (dist < 3) {
                game.effects.enable('breathe', { speed: 2 + intensity * 3, amount: intensity * 2 });
            }
        } else {
            // Reset effects when far
            if (this.fearLevel < 0.05) {
                game.effects.disable('vhs');
                game.effects.disable('breathe');
            }
        }

        // === WHISPERS — more frequent and varied when close ===
        if (dist < 5 && this.whisperTimer > (dist < 3 ? 2 : 4)) {
            this.whisperTimer = 0;
            game.audio.playShadowWhisper();
        }

        // === CAMERA DRIFT when very close ===
        if (dist < 3 && game.camera) {
            game.camera.driftAmount = (3 - dist) * 0.5;
        } else if (game.camera) {
            game.camera.driftAmount = Math.max(0, (game.camera.driftAmount || 0) - dt);
        }
    }

    // === HALLUCINATION SYSTEM ===

    spawnHallucination(game) {
        if (this.hallucinations.length >= 3) return;
        if (!game.currentRoom || !game.currentRoom.tilemap) return;

        const types = ['fakeItem', 'fakeShadow', 'fakeNPC', 'fakeExit'];
        const type = types[Math.floor(Math.random() * types.length)];
        const player = game.player;

        // Spawn near player's view
        let hx, hy;
        for (let attempt = 0; attempt < 10; attempt++) {
            hx = player.tileX + Math.floor(Math.random() * 8) - 4;
            hy = player.tileY + Math.floor(Math.random() * 6) - 3;
            if (!game.currentRoom.tilemap.isSolid(hx, hy) &&
                !(hx === player.tileX && hy === player.tileY)) {
                break;
            }
        }

        this.hallucinations.push({
            x: hx, y: hy, type,
            life: 2.5 + Math.random() * 3,
            maxLife: 5,
            flickerPhase: Math.random() * Math.PI * 2,
            opacity: 0
        });
    }

    updateHallucinations(dt, game) {
        for (let i = this.hallucinations.length - 1; i >= 0; i--) {
            const h = this.hallucinations[i];
            h.life -= dt;

            // Fade in, hold, fade out
            if (h.life > h.maxLife - 0.5) {
                h.opacity = Math.min(1, (h.maxLife - h.life) / 0.5);
            } else if (h.life < 0.5) {
                h.opacity = Math.max(0, h.life / 0.5);
            } else {
                h.opacity = 0.6 + Math.sin(h.flickerPhase + this.glitchTimer * 5) * 0.3;
            }

            // Player touches hallucination — dissolve + scare
            if (game.player && h.opacity > 0.3 &&
                game.player.tileX === h.x && game.player.tileY === h.y) {
                // Burst into glitch particles
                if (game.currentRoom) {
                    ParticlePresets.glitchBurst(game.currentRoom.particles,
                        h.x * CONFIG.TILE_SIZE + 8, h.y * CONFIG.TILE_SIZE + 8);
                }
                game.audio.playGlitch();
                game.camera.shake(2, 0.2);
                h.life = 0;
            }

            if (h.life <= 0) {
                this.hallucinations.splice(i, 1);
            }
        }
    }

    // === CATCH — REAL CONSEQUENCES ===

    onCatchPlayer(game) {
        this.catchCount++;
        game.state.incrementFlag('shadowEncounters');

        // Start jumpscare sequence
        this.jumpscareActive = true;
        this.jumpscareTimer = 0;

        // Freeze player
        game.player.moving = false;

        // Intense audio
        game.audio.playShadowScream();

        // Screen goes dark with glitch
        game.effects.enable('glitch', { intensity: 0.8 });
        game.effects.enable('chromatic', { offset: 8 });
        game.effects.enable('noise', { intensity: 0.3 });
        game.effects.flash(0.3, '#ff0000');
        game.camera.shake(8, 1.0);

        // Massive particle burst
        if (game.currentRoom) {
            ParticlePresets.glitchBurst(game.currentRoom.particles,
                game.player.drawX + 8, game.player.drawY + 12);
            ParticlePresets.shadowCorruption(game.currentRoom.particles,
                game.player.drawX + 8, game.player.drawY + 12);
        }
    }

    updateJumpscare(dt, game) {
        this.jumpscareTimer += dt;

        // Phase 1: Screen freeze with shadow face (0 - 0.8s)
        if (this.jumpscareTimer < 0.8) {
            this.faceFlashActive = true;
            game.effects.enable('glitch', { intensity: 0.5 + Math.random() * 0.3 });
            // Distort heartbeat rapidly
            if (Math.random() < 0.15) game.audio.playHeartbeat();
            return;
        }

        // Phase 2: Blackout (0.8 - 1.0s)
        if (this.jumpscareTimer < 1.0) {
            this.faceFlashActive = false;
            game.effects.flash(0.3, '#000');
            return;
        }

        // Phase 3: Consequences + teleport (1.0s+)
        if (this.jumpscareTimer >= 1.0 && this.jumpscareActive) {
            this.jumpscareActive = false;
            this.faceFlashActive = false;

            // === STEAL ITEM if player has one ===
            const stolenItem = this.tryStealItem(game);

            // Reset effects
            game.effects.disable('vhs');
            game.effects.disable('breathe');
            game.effects.enable('glitch', { intensity: 0.1 });
            game.effects.enable('chromatic', { offset: 1 });
            game.effects.enable('noise', { intensity: 0.03 });

            // Choose dialogue based on what happened
            let dialogueLines;
            if (stolenItem) {
                dialogueLines = {
                    lines: [
                        { text: "*Тьма... Холод пронизывает насквозь.*", speaker: 'mila' },
                        { text: `*${stolenItem.name}... Где?! Она забрала это!*`, speaker: 'mila' },
                        { text: "Я возьму всё. По кусочку.", speaker: 'shadow' }
                    ]
                };
            } else if (this.catchCount >= 3) {
                dialogueLines = {
                    lines: [
                        { text: "*Опять... Опять она поймала меня.*", speaker: 'mila' },
                        { text: "Сколько раз ещё ты будешь бежать?", speaker: 'shadow' },
                        { text: "Ты устала. Я чувствую.", speaker: 'shadow' }
                    ]
                };
            } else {
                dialogueLines = DIALOGUES.shadowCatch;
            }

            game.dialogue.show(dialogueLines, game);

            // Teleport player back to room start
            const start = game.currentRoom.playerStart;
            game.player.teleport(start.x, start.y);
            game.camera.follow(game.player, game.currentRoom.width, game.currentRoom.height);
            game.camera.x = game.camera.targetX;
            game.camera.y = game.camera.targetY;

            this.deactivate();

            // Reactivate faster each time
            const reactivateDelay = Math.max(5000, 10000 - this.catchCount * 1500);
            setTimeout(() => {
                if (game.currentRoom && game.currentRoom.name !== 'whiteRoom' &&
                    game.currentRoom.name !== 'void' && game.currentRoom.name !== 'corridor') {
                    const room = game.currentRoom;
                    // Spawn behind player (scarier)
                    const behindX = game.player.direction === 'left' ? Math.min(room.width - 2, game.player.tileX + 4)
                        : game.player.direction === 'right' ? Math.max(1, game.player.tileX - 4)
                        : Math.random() < 0.5 ? 1 : room.width - 2;
                    const behindY = game.player.direction === 'up' ? Math.min(room.height - 2, game.player.tileY + 4)
                        : game.player.direction === 'down' ? Math.max(1, game.player.tileY - 4)
                        : Math.random() < 0.5 ? 1 : room.height - 2;
                    this.activate(behindX, behindY);
                }
            }, reactivateDelay);
        }
    }

    tryStealItem(game) {
        if (game.inventory.items.length === 0) return null;
        // Only steal puzzle items (not key story items)
        const stealable = game.inventory.items.filter(item =>
            item.id.startsWith('photoFragment') || item.id.startsWith('flower')
        );
        if (stealable.length === 0) return null;

        // 60% chance to steal, increases with catch count
        if (Math.random() > 0.4 + this.catchCount * 0.1) return null;

        const victim = stealable[Math.floor(Math.random() * stealable.length)];
        game.inventory.remove(victim.id);
        return victim;
    }

    // === DRAWING ===

    draw(renderer, camera) {
        if (!this.visible && !this.jumpscareActive) {
            // Still draw corruption and hallucinations
            this.drawCorruption(renderer, camera);
            this.drawHallucinations(renderer, camera);
            return;
        }

        // Draw corruption zones
        this.drawCorruption(renderer, camera);

        // Draw hallucinations
        this.drawHallucinations(renderer, camera);

        // Draw trail (darker, more ominous)
        for (const t of this.trail) {
            renderer.ictx.globalAlpha = t.alpha * 0.3;
            renderer.drawSprite(this.sprite, t.x, t.y + this.spriteOffsetY, camera);
        }
        renderer.ictx.globalAlpha = 1;

        if (!this.flickerVisible && !this.jumpscareActive) return;

        // Glitch offset — more extreme when close
        let ox = 0, oy = 0;
        const glitchChance = 0.08 + this.fearLevel * 0.2;
        if (Math.random() < glitchChance) {
            const intensity = 3 + this.fearLevel * 6;
            ox = Math.floor((Math.random() - 0.5) * intensity);
            oy = Math.floor((Math.random() - 0.5) * intensity * 0.4);
        }

        // Main sprite
        renderer.drawSprite(
            this.sprite,
            this.drawX + ox,
            this.drawY + this.spriteOffsetY + oy,
            camera
        );

        // Red/blue split afterimage — more frequent when close
        const splitChance = 0.15 + this.fearLevel * 0.35;
        if (Math.random() < splitChance) {
            renderer.ictx.globalAlpha = 0.15 + this.fearLevel * 0.15;
            renderer.ictx.globalCompositeOperation = 'screen';
            // Red channel shifted left
            renderer.drawSprite(
                this.sprite,
                this.drawX + ox - 2 - this.fearLevel * 2,
                this.drawY + this.spriteOffsetY + oy,
                camera
            );
            // Blue channel shifted right
            renderer.drawSprite(
                this.sprite,
                this.drawX + ox + 2 + this.fearLevel * 2,
                this.drawY + this.spriteOffsetY + oy,
                camera
            );
            renderer.ictx.globalCompositeOperation = 'source-over';
            renderer.ictx.globalAlpha = 1;
        }

        // Draw shadow face overlay during jumpscare
        if (this.faceFlashActive) {
            this.drawShadowFace(renderer);
        }
    }

    drawCorruption(renderer, camera) {
        const ctx = renderer.ictx;
        for (const c of this.corruptionTrail) {
            const alpha = (c.life / c.maxLife) * 0.35;
            const px = c.x * CONFIG.TILE_SIZE + camera.offsetX;
            const py = c.y * CONFIG.TILE_SIZE + camera.offsetY;

            // Dark corruption stain
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#1a0020';
            ctx.fillRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);

            // Pulsing tendrils
            const pulse = Math.sin(this.glitchTimer * 3 + c.x * 2 + c.y * 3) * 0.5 + 0.5;
            ctx.globalAlpha = alpha * pulse * 0.4;
            ctx.fillStyle = '#ff0040';
            // Random corruption pixels
            for (let i = 0; i < 3; i++) {
                const cx = px + ((c.x * 7 + i * 13 + Math.floor(this.glitchTimer * 2)) % 14) + 1;
                const cy = py + ((c.y * 11 + i * 7 + Math.floor(this.glitchTimer * 3)) % 14) + 1;
                ctx.fillRect(cx, cy, 1, 1);
            }
        }
        ctx.globalAlpha = 1;
    }

    drawHallucinations(renderer, camera) {
        const ctx = renderer.ictx;
        for (const h of this.hallucinations) {
            if (h.opacity <= 0) continue;
            const px = h.x * CONFIG.TILE_SIZE + camera.offsetX;
            const py = h.y * CONFIG.TILE_SIZE + camera.offsetY;

            ctx.globalAlpha = h.opacity * 0.7;

            switch (h.type) {
                case 'fakeShadow':
                    // Ghost copy of shadow sprite
                    if (this.sprite) {
                        // Glitch offset
                        const gx = Math.random() < 0.3 ? Math.floor(Math.random() * 4 - 2) : 0;
                        renderer.drawSprite(this.sprite, px - camera.offsetX + gx, py - camera.offsetY + this.spriteOffsetY, camera);
                    }
                    break;

                case 'fakeItem':
                    // Glowing fake collectible
                    ctx.fillStyle = '#ffcc00';
                    ctx.fillRect(px + 6, py + 6, 4, 4);
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(px + 7, py + 7, 2, 2);
                    break;

                case 'fakeNPC':
                    // Dark humanoid silhouette
                    ctx.fillStyle = '#333';
                    ctx.fillRect(px + 5, py - 4, 6, 8); // head
                    ctx.fillRect(px + 3, py + 4, 10, 10); // body
                    // White eyes
                    if (Math.sin(this.glitchTimer * 3 + h.flickerPhase) > 0) {
                        ctx.fillStyle = '#fff';
                        ctx.fillRect(px + 6, py - 2, 2, 1);
                        ctx.fillRect(px + 9, py - 2, 2, 1);
                    }
                    break;

                case 'fakeExit':
                    // Fake door shape
                    ctx.fillStyle = '#554433';
                    ctx.fillRect(px + 2, py - 2, 12, 16);
                    ctx.fillStyle = '#332211';
                    ctx.fillRect(px + 4, py, 8, 12);
                    ctx.fillStyle = '#aa8855';
                    ctx.fillRect(px + 11, py + 5, 2, 2);
                    break;
            }
        }
        ctx.globalAlpha = 1;
    }

    drawShadowFace(renderer) {
        const ctx = renderer.ictx;
        const w = CONFIG.INTERNAL_WIDTH;
        const h = CONFIG.INTERNAL_HEIGHT;
        const cx = w / 2;
        const cy = h / 2;

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, w, h);

        // Giant shadow face — pixel art style
        const faceW = 64;
        const faceH = 48;
        const fx = cx - faceW / 2;
        const fy = cy - faceH / 2;

        // Face shape
        ctx.fillStyle = '#0a0010';
        ctx.fillRect(fx + 8, fy, faceW - 16, faceH);
        ctx.fillRect(fx, fy + 8, faceW, faceH - 16);
        ctx.fillRect(fx + 4, fy + 4, faceW - 8, faceH - 8);

        // Eyes — large, glowing, wrong
        const eyeFlicker = Math.random();
        ctx.fillStyle = eyeFlicker > 0.2 ? '#ff0000' : '#ffffff';
        // Left eye
        ctx.fillRect(fx + 12, fy + 14, 10, 4);
        ctx.fillRect(fx + 14, fy + 12, 6, 8);
        // Right eye
        ctx.fillRect(fx + faceW - 22, fy + 14, 10, 4);
        ctx.fillRect(fx + faceW - 20, fy + 12, 6, 8);

        // Pupils (sometimes move)
        ctx.fillStyle = '#000';
        const pupilShift = Math.floor(Math.random() * 3) - 1;
        ctx.fillRect(fx + 16 + pupilShift, fy + 15, 3, 2);
        ctx.fillRect(fx + faceW - 18 + pupilShift, fy + 15, 3, 2);

        // Mouth — wide distorted grin
        ctx.fillStyle = eyeFlicker > 0.3 ? '#ff0000' : '#330000';
        const mouthY = fy + 32;
        for (let mx = 0; mx < 30; mx++) {
            const my = Math.sin(mx * 0.5 + this.jumpscareTimer * 10) * 2;
            ctx.fillRect(fx + 17 + mx, mouthY + my, 1, 2);
        }

        // Teeth
        ctx.fillStyle = '#ddd';
        for (let t = 0; t < 8; t++) {
            const tx = fx + 20 + t * 4;
            ctx.fillRect(tx, mouthY - 1, 2, 2);
            ctx.fillRect(tx, mouthY + 2, 2, 2);
        }

        // Glitch lines across face
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        for (let i = 0; i < 4; i++) {
            const gy = Math.floor(Math.random() * h);
            ctx.fillRect(0, gy, w, 1);
        }
    }
}
