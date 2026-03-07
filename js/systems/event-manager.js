class EventManager {
    constructor() {
        this.queue = [];
        this.processing = false;
    }

    trigger(eventId, game) {
        const event = EVENTS[eventId];
        if (!event) return;

        // Check condition
        if (event.condition) {
            const flagVal = game.state.getFlag(event.condition.flag);
            if (flagVal !== event.condition.is) return;
        }

        // Queue actions
        this.queue.push(...event.actions);
        if (!this.processing) {
            this.processNext(game);
        }
    }

    processNext(game) {
        if (this.queue.length === 0) {
            this.processing = false;
            return;
        }

        this.processing = true;
        const action = this.queue.shift();

        switch (action.type) {
            case 'setFlag':
                game.state.setFlag(action.flag, action.value);
                this.processNext(game);
                break;

            case 'incrementFlag':
                game.state.incrementFlag(action.flag);
                this.processNext(game);
                break;

            case 'dialogue':
                const dialogue = DIALOGUES[action.id];
                if (dialogue) {
                    game.dialogue.show(dialogue, game, () => {
                        this.processNext(game);
                    });
                } else {
                    this.processNext(game);
                }
                break;

            case 'transition':
                game.transition.start(action.transType || 'fade', action.duration || 0.5, () => {
                    if (action.callback) action.callback(game);
                    this.processNext(game);
                });
                break;

            case 'save':
                game.saveSystem.save(game);
                this.processNext(game);
                break;

            case 'teleport':
                game.player.teleport(action.x, action.y);
                this.processNext(game);
                break;

            case 'changeRoom':
                game.changeRoom(action.room, action.x, action.y);
                this.processNext(game);
                break;

            default:
                this.processNext(game);
        }
    }

    clear() {
        this.queue = [];
        this.processing = false;
    }
}
