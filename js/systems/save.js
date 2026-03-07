class SaveSystem {
    constructor() {
        this.key = 'ergo_save';
    }

    save(game) {
        const data = {
            flags: game.state.flags,
            items: game.inventory.items.map(i => i.id),
            room: game.currentRoom ? game.currentRoom.name : 'whiteRoom',
            playerX: game.player.tileX,
            playerY: game.player.tileY,
            timestamp: Date.now()
        };
        try {
            localStorage.setItem(this.key, JSON.stringify(data));
        } catch (e) {}
    }

    load() {
        try {
            const raw = localStorage.getItem(this.key);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return null;
    }

    hasSave() {
        return localStorage.getItem(this.key) !== null;
    }

    deleteSave() {
        localStorage.removeItem(this.key);
    }

    applySave(game, data) {
        if (!data) return;
        game.state.flags = Object.assign({}, STORY_FLAGS.defaults, data.flags);
        game.inventory.clear();
        if (data.items) {
            for (const id of data.items) {
                if (ITEMS[id]) game.inventory.add(ITEMS[id]);
            }
        }
        game.changeRoom(data.room, data.playerX, data.playerY);
    }
}
