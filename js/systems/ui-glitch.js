class UIGlitchSystem {
    constructor() {
        this.time = 0;
        this.activeGlitches = [];
        this.textCorruptionChance = 0;
        this.hudShiftX = 0;
        this.hudShiftY = 0;
        this.fakeDeath = false;
        this.fakeDeathTimer = 0;
        this.textScrambleActive = false;
        this.textScrambleTimer = 0;
        this.phantomInput = null;
        this.phantomInputTimer = 0;
        this.screenTear = false;
        this.screenTearY = 0;
        this.screenTearTimer = 0;
        this.invertTimer = 0;
        this.cursorDrift = { x: 0, y: 0 };
    }

    update(dt, game) {
        this.time += dt;

        const sanityLevel = game.sanity ? game.sanity.level : 'stable';
        this.updateIntensity(sanityLevel);

        // Decay active glitches
        this.activeGlitches = this.activeGlitches.filter(g => {
            g.timer -= dt;
            return g.timer > 0;
        });

        // HUD drift
        if (this.hudShiftX !== 0 || this.hudShiftY !== 0) {
            this.hudShiftX *= 0.92;
            this.hudShiftY *= 0.92;
            if (Math.abs(this.hudShiftX) < 0.1) this.hudShiftX = 0;
            if (Math.abs(this.hudShiftY) < 0.1) this.hudShiftY = 0;
        }

        // Fake death screen
        if (this.fakeDeath) {
            this.fakeDeathTimer -= dt;
            if (this.fakeDeathTimer <= 0) this.fakeDeath = false;
        }

        // Text scramble
        if (this.textScrambleActive) {
            this.textScrambleTimer -= dt;
            if (this.textScrambleTimer <= 0) this.textScrambleActive = false;
        }

        // Screen tear
        if (this.screenTear) {
            this.screenTearTimer -= dt;
            if (this.screenTearTimer <= 0) this.screenTear = false;
        }

        // Brief invert
        if (this.invertTimer > 0) {
            this.invertTimer -= dt;
        }

        // Random glitch triggers based on sanity
        this.tryTriggerGlitch(sanityLevel, game);
    }

    updateIntensity(sanityLevel) {
        switch (sanityLevel) {
            case 'stable':
                this.textCorruptionChance = 0;
                break;
            case 'mild':
                this.textCorruptionChance = 0.02;
                break;
            case 'moderate':
                this.textCorruptionChance = 0.08;
                break;
            case 'severe':
                this.textCorruptionChance = 0.15;
                break;
            case 'critical':
                this.textCorruptionChance = 0.3;
                break;
        }
    }

    tryTriggerGlitch(sanityLevel, game) {
        if (sanityLevel === 'stable') return;

        const roll = Math.random();
        const threshold = {
            mild: 0.0003,
            moderate: 0.001,
            severe: 0.003,
            critical: 0.008
        }[sanityLevel] || 0;

        if (roll > threshold) return;

        const glitchType = Math.random();

        if (glitchType < 0.2) {
            // HUD shift
            this.hudShiftX = (Math.random() - 0.5) * 8;
            this.hudShiftY = (Math.random() - 0.5) * 4;
        } else if (glitchType < 0.35) {
            // Screen tear
            this.screenTear = true;
            this.screenTearY = Math.random() * CONFIG.INTERNAL_HEIGHT;
            this.screenTearTimer = 0.1 + Math.random() * 0.2;
        } else if (glitchType < 0.5) {
            // Text scramble (affects next dialogue)
            this.textScrambleActive = true;
            this.textScrambleTimer = 2 + Math.random() * 3;
        } else if (glitchType < 0.6 && sanityLevel === 'critical') {
            // Fake death flash (critical only)
            this.fakeDeath = true;
            this.fakeDeathTimer = 0.3 + Math.random() * 0.5;
        } else if (glitchType < 0.75) {
            // Brief color invert
            this.invertTimer = 0.05 + Math.random() * 0.1;
        } else {
            // Phantom text overlay
            this.activeGlitches.push({
                type: 'text',
                text: this.getGlitchText(sanityLevel),
                x: Math.random() * CONFIG.INTERNAL_WIDTH,
                y: Math.random() * CONFIG.INTERNAL_HEIGHT,
                timer: 0.5 + Math.random() * 1.5,
                alpha: 0.15 + Math.random() * 0.25
            });
        }
    }

    getGlitchText(level) {
        const texts = {
            mild: ['...', '?', '*', '~'],
            moderate: ['помоги', 'кто здесь', 'нет', 'не уходи', 'тихо', '...мила...'],
            severe: ['ВЫХОДА НЕТ', 'ОНА ЗНАЕТ', 'ВСПОМНИ', 'БОЛЬНО', 'НЕ СМОТРИ', 'ТЫ ЗДЕСЬ'],
            critical: ['УМРИ', 'ПЕТЛЯ', 'ТЫ МЕРТВА', 'ПРОСНИСЬ', 'ТЕНЬ ЖДЁТ', 'Ṃ̷̈И̸̛Л̷̊А̸͝']
        };
        const pool = texts[level] || texts.mild;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    // Corrupt a text string for dialogue display
    corruptText(text) {
        if (!this.textScrambleActive && Math.random() > this.textCorruptionChance) {
            return text;
        }

        const chars = text.split('');
        const glitchChars = '̸̷̶̡̧̨̛̖̗̘̙̜̝̞̟̠̣̤̥̦̩̪̫̬̭̮̯̰̱̲̳̹̺̻̼͇͈͉͍͎̀́̂̃̄̅̆̇̈̉̊̋̌̍̎̏̐̑̒̓̔̽̾̿̀́͂̓̈́͆͊͋͌̕̚ͅ';
        const corruptions = Math.max(1, Math.floor(chars.length * (this.textScrambleActive ? 0.3 : 0.1)));

        for (let i = 0; i < corruptions; i++) {
            const idx = Math.floor(Math.random() * chars.length);
            if (Math.random() < 0.5) {
                // Add zalgo
                chars[idx] += glitchChars[Math.floor(Math.random() * glitchChars.length)];
            } else {
                // Replace with random
                const replacements = '█▓▒░╳╬◈◆▪';
                chars[idx] = replacements[Math.floor(Math.random() * replacements.length)];
            }
        }

        return chars.join('');
    }

    draw(ctx) {
        const w = CONFIG.INTERNAL_WIDTH;
        const h = CONFIG.INTERNAL_HEIGHT;

        // Screen tear effect
        if (this.screenTear) {
            const tearY = Math.floor(this.screenTearY);
            const tearH = 2 + Math.floor(Math.random() * 4);
            const shift = Math.floor((Math.random() - 0.5) * 16);
            try {
                const imgData = ctx.getImageData(0, tearY, w, tearH);
                ctx.putImageData(imgData, shift, tearY);
            } catch (e) {}
        }

        // Brief invert
        if (this.invertTimer > 0) {
            ctx.globalCompositeOperation = 'difference';
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
            ctx.globalCompositeOperation = 'source-over';
        }

        // Fake death screen
        if (this.fakeDeath) {
            ctx.fillStyle = `rgba(0,0,0,${0.8 + Math.random() * 0.2})`;
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#ff0000';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('ТЫ МЕРТВА', w / 2 + (Math.random() - 0.5) * 4, h / 2);
        }

        // Phantom text overlays
        for (const g of this.activeGlitches) {
            if (g.type === 'text') {
                ctx.globalAlpha = g.alpha * (g.timer / 2);
                ctx.fillStyle = '#ff0000';
                ctx.font = '8px monospace';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                const ox = Math.sin(this.time * 10 + g.x) * 1;
                ctx.fillText(g.text, g.x + ox, g.y);
                ctx.globalAlpha = 1;
            }
        }

        // Cursor drift (subtle HUD displacement indicator)
        if (this.hudShiftX !== 0 || this.hudShiftY !== 0) {
            ctx.globalAlpha = 0.05;
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(0, 0, w, 1);
            ctx.fillRect(0, h - 1, w, 1);
            ctx.globalAlpha = 1;
        }
    }
}
