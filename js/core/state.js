class GameState {
    constructor() {
        this.current = 'menu'; // menu, playing, dialogue, cutscene, transition, pause, ending
        this.previous = null;
        this.flags = Object.assign({}, STORY_FLAGS.defaults);
        this.transitionCallback = null;
    }

    change(newState) {
        this.previous = this.current;
        this.current = newState;
    }

    is(state) {
        return this.current === state;
    }

    setFlag(flag, value) {
        this.flags[flag] = value;
    }

    getFlag(flag) {
        return this.flags[flag];
    }

    incrementFlag(flag) {
        if (typeof this.flags[flag] === 'number') {
            this.flags[flag]++;
        }
    }

    resetFlags() {
        const loopCount = this.flags.loopCount;
        this.flags = Object.assign({}, STORY_FLAGS.defaults);
        this.flags.loopCount = loopCount + 1;
    }
}
