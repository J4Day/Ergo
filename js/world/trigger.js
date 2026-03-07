class Trigger {
    constructor(x, y, width, height, config) {
        this.x = x;
        this.y = y;
        this.width = width || 1;
        this.height = height || 1;
        this.onEnter = config.onEnter || null;
        this.onInteract = config.onInteract || null;
        this.once = config.once || false;
        this.active = true;
        this.triggered = false;
        this.condition = config.condition || null; // { flag, is }
    }

    contains(tileX, tileY) {
        return tileX >= this.x && tileX < this.x + this.width &&
               tileY >= this.y && tileY < this.y + this.height;
    }

    checkCondition(flags) {
        if (!this.condition) return true;
        return flags[this.condition.flag] === this.condition.is;
    }

    fire(type, game) {
        if (!this.active) return false;
        if (this.once && this.triggered) return false;
        if (!this.checkCondition(game.state.flags)) return false;

        const handler = type === 'enter' ? this.onEnter : this.onInteract;
        if (handler) {
            handler(game);
            if (this.once) this.triggered = true;
            return true;
        }
        return false;
    }
}

class TriggerManager {
    constructor() {
        this.triggers = [];
    }

    add(trigger) {
        this.triggers.push(trigger);
        return trigger;
    }

    clear() {
        this.triggers = [];
    }

    checkEnter(tileX, tileY, game) {
        for (const t of this.triggers) {
            if (t.contains(tileX, tileY)) {
                t.fire('enter', game);
            }
        }
    }

    checkInteract(tileX, tileY, game) {
        for (const t of this.triggers) {
            if (t.contains(tileX, tileY)) {
                if (t.fire('interact', game)) return true;
            }
        }
        return false;
    }

    getAt(tileX, tileY) {
        return this.triggers.filter(t => t.contains(tileX, tileY));
    }
}
