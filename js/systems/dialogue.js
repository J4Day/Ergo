class DialogueSystem {
    constructor() {
        this.active = false;
        this.lines = [];
        this.currentLine = 0;
        this.displayedChars = 0;
        this.charTimer = 0;
        this.charSpeed = 0.03; // seconds per character
        this.finished = false;
        this.choice = null;
        this.selectedChoice = 0;
        this.onComplete = null;
        this.waitingForChoice = false;
    }

    show(dialogue, game, onComplete) {
        if (!dialogue) return;
        this.active = true;
        this.lines = dialogue.lines || [];
        this.choice = dialogue.choice || null;
        this.currentLine = 0;
        this.displayedChars = 0;
        this.charTimer = 0;
        this.finished = false;
        this.selectedChoice = 0;
        this.waitingForChoice = false;
        this.onComplete = onComplete || null;
        this._game = game;
        this._wrappedCache = {}; // clear wrap cache for new dialogue
        game.state.change('dialogue');
    }

    update(dt, game) {
        if (!this.active) return;

        if (this.waitingForChoice) {
            if (game.input.dirUp || game.input.dirLeft) {
                this.selectedChoice = Math.max(0, this.selectedChoice - 1);
                game.audio.playSelect();
            }
            if (game.input.dirDown || game.input.dirRight) {
                this.selectedChoice = Math.min(this.choice.options.length - 1, this.selectedChoice + 1);
                game.audio.playSelect();
            }
            if (game.input.confirm) {
                const option = this.choice.options[this.selectedChoice];
                if (option.flag) {
                    game.state.setFlag(option.flag, option.value);
                    // Play appropriate memory sound
                    if (option.value === true) {
                        game.audio.playMemoryAccept();
                        game.effects.flash(0.4, '#fff');
                        // Sanity restore
                        if (game.sanity) game.sanity.onMemoryAccepted();
                    } else {
                        game.audio.playMemoryReject();
                        game.effects.flash(0.4, '#200000');
                        game.camera.shake(2, 0.3);
                        // Sanity drain - irreversible consequence
                        if (game.sanity) game.sanity.onMemoryRejected();
                    }
                    // Puzzle solved (memory confronted)
                    if (game.sanity && option.flag.startsWith('memory')) {
                        game.sanity.onPuzzleSolved();
                    }
                }
                this.close(game);
            }
            return;
        }

        if (!this.finished) {
            this.charTimer += dt;
            const line = this.lines[this.currentLine];
            if (line && this.charTimer >= this.charSpeed) {
                this.charTimer = 0;
                this.displayedChars++;
                if (this.displayedChars >= line.text.length) {
                    this.finished = true;
                }
            }
        }

        if (game.input.confirm) {
            game.audio.playConfirm();
            if (!this.finished) {
                // Show full line instantly
                this.displayedChars = this.lines[this.currentLine].text.length;
                this.finished = true;
            } else {
                // Next line
                this.currentLine++;
                if (this.currentLine >= this.lines.length) {
                    if (this.choice) {
                        this.waitingForChoice = true;
                    } else {
                        this.close(game);
                    }
                } else {
                    this.displayedChars = 0;
                    this.charTimer = 0;
                    this.finished = false;
                }
            }
        }
    }

    close(game) {
        this.active = false;
        game.state.change('playing');
        if (this.onComplete) this.onComplete(game);
    }

    draw(ctx) {
        if (!this.active) return;

        const w = CONFIG.INTERNAL_WIDTH;
        const h = CONFIG.INTERNAL_HEIGHT;
        const boxH = 48;
        const boxY = h - boxH - 4;
        const boxX = 4;
        const boxW = w - 8;

        // Dialog box background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        // Border
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

        if (this.waitingForChoice && this.choice) {
            // Draw choice prompt
            ctx.fillStyle = '#ccc';
            ctx.font = '8px monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(this.choice.prompt, boxX + 6, boxY + 4);

            this.choice.options.forEach((opt, i) => {
                const isSelected = i === this.selectedChoice;
                ctx.fillStyle = isSelected ? '#fff' : '#888';
                const prefix = isSelected ? '> ' : '  ';
                ctx.fillText(prefix + opt.text, boxX + 8, boxY + 16 + i * 12);
            });
            return;
        }

        if (this.currentLine < this.lines.length) {
            const line = this.lines[this.currentLine];
            let text = line.text.substring(0, this.displayedChars);
            // UI Glitch: corrupt text if system is active
            if (this._game && this._game.uiGlitch) {
                text = this._game.uiGlitch.corruptText(text);
            }

            // Speaker color
            let color = '#fff';
            if (line.speaker === 'mila') color = '#ddd';
            else if (line.speaker === 'narrator') color = '#aaa';
            else if (line.speaker === 'shadow') color = '#ff4444';
            else if (line.speaker === 'doctor') color = '#88ccff';
            else if (line.speaker === 'littleMila') color = '#ffaa88';
            else if (line.speaker === 'mother') color = '#ffccdd';

            // Speaker name
            const names = {
                mila: 'Мила', shadow: 'Тень', doctor: 'Доктор Лис',
                littleMila: 'Маленькая Мила', mother: 'Мама', narrator: ''
            };
            const name = names[line.speaker] || '';

            ctx.font = '8px monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            if (name) {
                ctx.fillStyle = color;
                ctx.fillText(name, boxX + 6, boxY + 4);
            }

            // Wrap text
            ctx.fillStyle = color;
            const nameOffset = name ? 14 : 6;
            const maxWidth = boxW - 16;
            this.drawWrappedText(ctx, text, boxX + 6, boxY + nameOffset, maxWidth, 10);

            // Blinking cursor
            if (this.finished && Math.floor(Date.now() / 500) % 2 === 0) {
                ctx.fillStyle = '#fff';
                ctx.fillText('_', boxX + boxW - 14, boxY + boxH - 12);
            }
        }
    }

    drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
        // Cache wrapped lines per text string to avoid measureText every frame
        if (!this._wrappedCache) this._wrappedCache = {};
        let lines = this._wrappedCache[text];
        if (!lines) {
            const words = text.split(' ');
            lines = [];
            let line = '';
            for (const word of words) {
                const testLine = line + word + ' ';
                if (ctx.measureText(testLine).width > maxWidth && line !== '') {
                    lines.push(line.trim());
                    line = word + ' ';
                } else {
                    line = testLine;
                }
            }
            if (line.trim()) lines.push(line.trim());
            this._wrappedCache[text] = lines;
        }
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], x, y + i * lineHeight);
        }
    }
}
