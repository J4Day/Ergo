// Lore Notes System
// Collectible notes scattered through rooms
// Build atmosphere and reveal backstory

class NotesSystem {
    constructor() {
        this.found = []; // array of note IDs found
        this.viewing = false;
        this.viewIndex = 0;
        this.scrollOffset = 0;
    }

    find(noteId, game) {
        if (this.found.includes(noteId)) return false;
        this.found.push(noteId);
        if (game.audio) game.audio.playItemPickup();
        if (game.sanity) game.sanity.onNoteFound();
        return true;
    }

    hasFound(noteId) {
        return this.found.includes(noteId);
    }

    get count() {
        return this.found.length;
    }

    get total() {
        return Object.keys(LORE_NOTES).length;
    }

    toggle() {
        this.viewing = !this.viewing;
        this.viewIndex = 0;
        this.scrollOffset = 0;
    }

    update(dt, game) {
        if (!this.viewing) return;

        if (game.input.dirUp) {
            if (this.viewIndex > 0) {
                this.viewIndex--;
                this.scrollOffset = 0;
                if (game.audio) game.audio.playSelect();
            }
        }
        if (game.input.dirDown) {
            if (this.viewIndex < this.found.length - 1) {
                this.viewIndex++;
                this.scrollOffset = 0;
                if (game.audio) game.audio.playSelect();
            }
        }
        // Scroll note text with left/right
        if (game.input.dirLeft) {
            this.scrollOffset = Math.max(0, this.scrollOffset - 1);
        }
        if (game.input.dirRight) {
            this.scrollOffset++;
        }
        if (game.input.cancel || game.input.isPressed('KeyN')) {
            this.viewing = false;
        }
    }

    draw(ctx) {
        if (!this.viewing) return;

        const w = CONFIG.INTERNAL_WIDTH;
        const h = CONFIG.INTERNAL_HEIGHT;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
        ctx.fillRect(0, 0, w, h);

        ctx.font = '8px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Title
        ctx.fillStyle = '#888';
        ctx.fillText(`Записки (${this.found.length}/${this.total})`, 8, 4);

        if (this.found.length === 0) {
            ctx.fillStyle = '#555';
            ctx.fillText('Пока ничего не найдено...', 8, 20);
            ctx.fillStyle = '#333';
            ctx.textAlign = 'center';
            ctx.fillText('N/Esc — закрыть', w / 2, h - 10);
            return;
        }

        // Note list on left (scrollable)
        const listW = 90;
        const listTop = 18;
        const itemH = 10;
        const maxVisible = Math.floor((h - 36) / itemH);

        // Calculate list scroll so selected item is visible
        let listScroll = 0;
        if (this.found.length > maxVisible) {
            listScroll = Math.max(0, Math.min(
                this.viewIndex - Math.floor(maxVisible / 2),
                this.found.length - maxVisible
            ));
        }

        // Scroll indicator top
        if (listScroll > 0) {
            ctx.fillStyle = '#555';
            ctx.textAlign = 'center';
            ctx.fillText('▲', listW / 2, listTop - 6);
            ctx.textAlign = 'left';
        }

        for (let vi = 0; vi < maxVisible && vi + listScroll < this.found.length; vi++) {
            const i = vi + listScroll;
            const note = LORE_NOTES[this.found[i]];
            if (!note) continue;
            const isSelected = i === this.viewIndex;
            ctx.fillStyle = isSelected ? '#fff' : '#666';
            const prefix = isSelected ? '> ' : '  ';
            const title = note.title.length > 12 ? note.title.substring(0, 11) + '.' : note.title;
            ctx.fillText(prefix + title, 4, listTop + vi * itemH);
        }

        // Scroll indicator bottom
        if (listScroll + maxVisible < this.found.length) {
            ctx.fillStyle = '#555';
            ctx.textAlign = 'center';
            ctx.fillText('▼', listW / 2, listTop + maxVisible * itemH);
            ctx.textAlign = 'left';
        }

        // Divider
        ctx.fillStyle = '#333';
        ctx.fillRect(listW, 14, 1, h - 24);

        // Note content on right (scrollable with ←→)
        if (this.viewIndex >= 0 && this.viewIndex < this.found.length) {
            const note = LORE_NOTES[this.found[this.viewIndex]];
            if (note) {
                ctx.fillStyle = '#aaa';
                ctx.fillText(note.title, listW + 6, 18);

                // Word wrap the content into lines
                const maxW = w - listW - 14;
                const lines = this._wrapText(ctx, note.text, maxW);

                // Clamp scroll offset
                const textTop = 32;
                const lineH = 10;
                const maxLines = Math.floor((h - textTop - 18) / lineH);
                const maxScroll = Math.max(0, lines.length - maxLines);
                if (this.scrollOffset > maxScroll) this.scrollOffset = maxScroll;

                // Draw visible lines
                ctx.fillStyle = '#777';
                for (let i = 0; i < maxLines && i + this.scrollOffset < lines.length; i++) {
                    ctx.fillText(lines[i + this.scrollOffset], listW + 6, textTop + i * lineH);
                }

                // Text scroll indicators
                if (this.scrollOffset > 0) {
                    ctx.fillStyle = '#555';
                    ctx.textAlign = 'right';
                    ctx.fillText('◄', w - 4, textTop - 2);
                    ctx.textAlign = 'left';
                }
                if (this.scrollOffset < maxScroll) {
                    ctx.fillStyle = '#555';
                    ctx.textAlign = 'right';
                    ctx.fillText('►', w - 4, textTop + maxLines * lineH);
                    ctx.textAlign = 'left';
                }
            }
        }

        // Controls hint
        ctx.fillStyle = '#444';
        ctx.textAlign = 'center';
        ctx.fillText('↑↓ выбор  ←→ прокрутка  N/Esc закрыть', w / 2, h - 8);
    }

    _wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let line = '';

        for (const word of words) {
            const test = line + word + ' ';
            if (ctx.measureText(test).width > maxWidth && line !== '') {
                lines.push(line.trim());
                line = word + ' ';
            } else {
                line = test;
            }
        }
        if (line.trim()) lines.push(line.trim());
        return lines;
    }

    // Serialize for save
    serialize() {
        return this.found.slice();
    }

    deserialize(data) {
        this.found = data || [];
    }
}

// All lore notes in the game
const LORE_NOTES = {
    // White Room
    noteWhiteRoom1: {
        title: 'Записка (1)',
        text: '"Ты выбрала быть здесь. Вспомни - почему." Мой почерк. Но я не помню, когда это писала. Бумага пожелтела. Сколько я здесь?'
    },
    noteWhiteRoom2: {
        title: 'Трещина',
        text: 'В трещине на стене что-то блестит. Осколок зеркала? В отражении - лицо. Моё? Нет... глаза другие. Пустые.'
    },

    // Corridor
    noteCorridor1: {
        title: 'Рецепт',
        text: 'Бланк рецепта. "Пациент: М. ...ова. Диагноз: тяжёлый депрессивный эпизод, суицидальная попытка. Состояние: кома. Прогноз: неопределённый."'
    },
    noteCorridor2: {
        title: 'Из дневника (1)',
        text: '"Сегодня она снова не пришла. Мама сказала, что занята. Всегда занята. Я рисовала один весь вечер."'
    },

    // Apartment
    noteApartment1: {
        title: 'Счёт за воду',
        text: 'Счёт за три месяца. Неоплаченный. На обороте детским почерком: "Мама, когда ты вернёшься?" Без ответа.'
    },
    noteApartment2: {
        title: 'Фото (обратная)',
        text: 'На обороте фотографии: "Мила, 5 лет. Последний день рождения вместе." Дальше зачёркнуто.'
    },
    noteApartment3: {
        title: 'SMS (не отправлено)',
        text: '"Мам, мне плохо. Можешь приехать?" Черновик. Не отправлено. Дата - за неделю до...'
    },

    // School
    noteSchool1: {
        title: 'Записка на парте',
        text: '"Странная" - написано красным маркером. Под ней другим почерком: "Зачем ты вообще приходишь?"'
    },
    noteSchool2: {
        title: 'Дневник оценок',
        text: 'Все пятёрки. Идеальные оценки. На полях учительский комментарий: "Мила очень тихая. Нужно обратить внимание." Никто не обратил.'
    },
    noteSchool3: {
        title: 'Рисунок на парте',
        text: 'Детский рисунок. Девочка одна в углу. Вокруг - фигуры без лиц. Она улыбается, но слёзы нарисованы синим.'
    },

    // Garden
    noteGarden1: {
        title: 'Надпись на камне',
        text: 'Полустёртые буквы на могильном камне. "Здесь покоится..." - дальше мох. Но я знаю, чьё это имя.'
    },
    noteGarden2: {
        title: 'Засохший цветок',
        text: 'Между страницами книги - засохшая ромашка. Мама дарила такие. "Ромашка - цветок надежды," - говорила она. Когда перестала?'
    },

    // Hospital
    noteHospital1: {
        title: 'Медкарта',
        text: '"Поступила: экстренно. Падение с высоты. Множественные переломы. Черепно-мозговая травма. Введена в медикаментозную кому."'
    },
    noteHospital2: {
        title: 'Записка от мамы',
        text: '"Милочка, я здесь. Я никуда не уйду. Прости меня. Пожалуйста, вернись." Бумага мокрая от слёз.'
    },
    noteHospital3: {
        title: 'Журнал медсестры',
        text: '"Посетитель (мать) присутствует ежедневно. Отказывается уходить на ночь. Приносит цветы. Разговаривает с пациенткой."'
    },

    // Void
    noteVoid1: {
        title: 'Обрывок мысли',
        text: '"Если меня не станет, всем станет легче." Я помню эту мысль. Она казалась такой логичной. Такой правильной. Она лгала.'
    },

    // Secret / Roof
    noteRoof1: {
        title: 'Последнее сообщение',
        text: '"Мам, прости. Я не смогла больше." Отправлено. 23:47. Через 12 минут - вызов скорой.'
    },
    noteRoof2: {
        title: 'Край',
        text: 'Ветер. Город внизу. Огни. Красивый. Странно думать о красоте, когда... Один шаг. Всего один. А потом тишина.'
    },

    // Children's Room (secret)
    noteChildRoom1: {
        title: 'Первый рисунок',
        text: 'Семья из трёх человек. Мама, папа, я. Все держатся за руки. Солнце улыбается. Когда я в последний раз рисовала солнце?'
    },
    noteChildRoom2: {
        title: 'Плюшевый мишка',
        text: 'Потёртый, один глаз отсутствует. Мама зашивала его три раза. "Мишка как новый!" - говорила она. Я верила.'
    },

    // Doctor's secret
    noteDoctor1: {
        title: 'Странная записка',
        text: '"Я не существую вне этих стен. Я - то, что тебе нужно, чтобы идти дальше. Не ищи моё лицо. Его нет." Почерк... мой?'
    },

    // Meta / NG+
    noteMeta1: {
        title: '???',
        text: '"Цикл {loopCount}. Она снова здесь. Сколько раз ещё? Трещины множатся. Скоро стены не выдержат."'
    }
};
