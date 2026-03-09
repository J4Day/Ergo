// Achievement System
// Tracks accomplishments across playthroughs
// Stored in localStorage separately from save

class AchievementSystem {
    constructor() {
        this.storageKey = 'ergo_achievements';
        this.unlocked = {};
        this.showQueue = [];    // achievements to display
        this.showTimer = 0;
        this.showDuration = 3;
        this.currentShow = null;
        this.load();
    }

    // === DEFINITIONS ===

    static get DEFS() {
        return {
            faceYourShadow: {
                title: 'Face Your Shadow',
                desc: 'Встретить Тень в Пустоте',
                icon: 'shadow'
            },
            loopBreaker: {
                title: 'Loop Breaker',
                desc: 'Выйти из петли',
                icon: 'loop'
            },
            rememberEverything: {
                title: 'Remember Everything',
                desc: 'Принять все 5 воспоминаний',
                icon: 'memory'
            },
            forgetEverything: {
                title: 'Forget Everything',
                desc: 'Отвергнуть все 5 воспоминаний',
                icon: 'void'
            },
            awakening: {
                title: 'Пробуждение',
                desc: 'Получить концовку A',
                icon: 'light'
            },
            oblivion: {
                title: 'Забвение',
                desc: 'Получить концовку B',
                icon: 'dark'
            },
            loop: {
                title: 'Петля',
                desc: 'Получить концовку C',
                icon: 'loop'
            },
            secretEnding: {
                title: '???',
                desc: 'Найти секретную концовку',
                icon: 'star'
            },
            collector: {
                title: 'Коллекционер',
                desc: 'Найти все записки',
                icon: 'note'
            },
            survivor: {
                title: 'Выживший',
                desc: 'Пройти игру, ни разу не пойманным Тенью',
                icon: 'shield'
            },
            breathless: {
                title: 'Бездыханная',
                desc: 'Пережить паническую атаку',
                icon: 'breath'
            },
            explorer: {
                title: 'Исследователь',
                desc: 'Найти секретную комнату',
                icon: 'door'
            },
            marathoner: {
                title: 'Марафонец',
                desc: 'Пробежать 100 тайлов',
                icon: 'run'
            },
            shadowDancer: {
                title: 'Танец с Тенью',
                desc: 'Уклониться от Тени 10 раз подряд',
                icon: 'shadow'
            },
            listener: {
                title: 'Слушатель',
                desc: 'Прочитать все диалоги Доктора Лиса',
                icon: 'doctor'
            },
            cycle3: {
                title: 'Вечное возвращение',
                desc: 'Пройти 3 цикла петли',
                icon: 'loop'
            },
            hiddenTruth: {
                title: 'Скрытая правда',
                desc: 'Узнать секрет Доктора Лиса',
                icon: 'star'
            },
            rooftop: {
                title: 'Край',
                desc: 'Посетить Крышу',
                icon: 'roof'
            }
        };
    }

    // === METHODS ===

    unlock(id) {
        if (this.unlocked[id]) return false;
        const def = AchievementSystem.DEFS[id];
        if (!def) return false;

        this.unlocked[id] = {
            time: Date.now(),
            title: def.title
        };
        this.save();
        this.showQueue.push(def);
        return true;
    }

    isUnlocked(id) {
        return !!this.unlocked[id];
    }

    get unlockedCount() {
        return Object.keys(this.unlocked).length;
    }

    get totalCount() {
        return Object.keys(AchievementSystem.DEFS).length;
    }

    // === UPDATE & DRAW ===

    update(dt) {
        if (this.currentShow) {
            this.showTimer -= dt;
            if (this.showTimer <= 0) {
                this.currentShow = null;
            }
        }
        if (!this.currentShow && this.showQueue.length > 0) {
            this.currentShow = this.showQueue.shift();
            this.showTimer = this.showDuration;
        }
    }

    draw(ctx) {
        if (!this.currentShow) return;

        const w = CONFIG.INTERNAL_WIDTH;
        const fadeIn = Math.min(1, (this.showDuration - this.showTimer) / 0.5);
        const fadeOut = Math.min(1, this.showTimer / 0.5);
        const alpha = Math.min(fadeIn, fadeOut);

        ctx.globalAlpha = alpha;

        // Achievement popup at top
        const boxW = 140;
        const boxH = 24;
        const boxX = (w - boxW) / 2;
        const boxY = 4;

        ctx.fillStyle = 'rgba(20, 20, 30, 0.9)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#ffcc00';
        ctx.fillText('Achievement', boxX + boxW / 2, boxY + 3);
        ctx.fillStyle = '#fff';
        ctx.fillText(this.currentShow.title, boxX + boxW / 2, boxY + 13);

        ctx.globalAlpha = 1;
    }

    // === PERSISTENCE ===

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.unlocked));
        } catch (e) {}
    }

    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) this.unlocked = JSON.parse(data);
        } catch (e) {
            this.unlocked = {};
        }
    }

    reset() {
        this.unlocked = {};
        this.save();
    }
}
