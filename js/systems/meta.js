// Meta System - Cross-playthrough memory
// The game remembers past playthroughs
// Affects: menu, dialogue, Shadow behavior, 4th ending

class MetaSystem {
    constructor() {
        this.storageKey = 'ergo_meta';
        this.data = {
            totalPlaythroughs: 0,
            endingsReached: {},     // {A: count, B: count, C: count, D: count}
            totalLoops: 0,
            totalDeaths: 0,         // shadow catches
            totalNotesFound: 0,
            allMemoriesAccepted: false,
            allMemoriesRejected: false,
            hasSeenSecretRoom: false,
            hasSeenRoof: false,
            totalPlayTime: 0,       // seconds
            firstPlayDate: null,
            sprintDistance: 0,       // total tiles sprinted
            breathHoldCount: 0,
            panicAttackCount: 0,
            shadowEvasions: 0,      // consecutive dodges tracked
            maxShadowEvasions: 0,
        };
        this.sessionTime = 0;
        this.load();
    }

    // === TRACKING ===

    onPlaythroughEnd(ending) {
        this.data.totalPlaythroughs++;
        if (!this.data.endingsReached[ending]) {
            this.data.endingsReached[ending] = 0;
        }
        this.data.endingsReached[ending]++;
        this.save();
    }

    onLoop() {
        this.data.totalLoops++;
        this.save();
    }

    onShadowCatch() {
        this.data.totalDeaths++;
        this.data.shadowEvasions = 0;
        this.save();
    }

    onShadowEvade() {
        this.data.shadowEvasions++;
        if (this.data.shadowEvasions > this.data.maxShadowEvasions) {
            this.data.maxShadowEvasions = this.data.shadowEvasions;
        }
    }

    onNoteFound() {
        this.data.totalNotesFound++;
        this.save();
    }

    onBreathHold() {
        this.data.breathHoldCount++;
    }

    onPanicAttack() {
        this.data.panicAttackCount++;
        this.save();
    }

    onSprintTile() {
        this.data.sprintDistance++;
    }

    onSecretRoom() {
        this.data.hasSeenSecretRoom = true;
        this.save();
    }

    onRoof() {
        this.data.hasSeenRoof = true;
        this.save();
    }

    // === QUERIES ===

    get isNewGamePlus() {
        return this.data.totalPlaythroughs > 0;
    }

    get hasSeenAllEndings() {
        return this.data.endingsReached['A'] > 0 &&
               this.data.endingsReached['B'] > 0 &&
               this.data.endingsReached['C'] > 0;
    }

    get secretEndingAvailable() {
        // 4th ending: must have seen all 3 endings + found secret room
        return this.hasSeenAllEndings && this.data.hasSeenSecretRoom;
    }

    get menuCorruptionLevel() {
        // How corrupted the menu looks based on playthroughs
        const loops = this.data.totalLoops || 0;
        const deaths = this.data.totalDeaths || 0;
        return Math.min(1, (loops * 0.1 + deaths * 0.02));
    }

    // Dialogue modifications based on meta knowledge
    get knownByGame() {
        return {
            returnedBefore: this.data.totalPlaythroughs > 0,
            diedBefore: this.data.totalDeaths > 0,
            loopedBefore: this.data.totalLoops > 0,
            sawAwakening: (this.data.endingsReached['A'] || 0) > 0,
            sawOblivion: (this.data.endingsReached['B'] || 0) > 0,
            sawLoop: (this.data.endingsReached['C'] || 0) > 0,
            playCount: this.data.totalPlaythroughs,
            deathCount: this.data.totalDeaths,
            loopCount: this.data.totalLoops,
        };
    }

    // === UPDATE ===

    update(dt) {
        this.sessionTime += dt;
        this.data.totalPlayTime += dt;
    }

    // === PERSISTENCE ===

    save() {
        try {
            if (!this.data.firstPlayDate) {
                this.data.firstPlayDate = Date.now();
            }
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (e) {}
    }

    load() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                Object.assign(this.data, parsed);
            }
        } catch (e) {}
    }

    reset() {
        // Full reset (only from settings, not normally)
        localStorage.removeItem(this.storageKey);
        this.data = {
            totalPlaythroughs: 0,
            endingsReached: {},
            totalLoops: 0,
            totalDeaths: 0,
            totalNotesFound: 0,
            allMemoriesAccepted: false,
            allMemoriesRejected: false,
            hasSeenSecretRoom: false,
            hasSeenRoof: false,
            totalPlayTime: 0,
            firstPlayDate: null,
            sprintDistance: 0,
            breathHoldCount: 0,
            panicAttackCount: 0,
            shadowEvasions: 0,
            maxShadowEvasions: 0,
        };
    }
}
