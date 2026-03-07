class Input {
    constructor() {
        this.keys = {};
        this.justPressed = {};
        this._prev = {};

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            e.preventDefault();
        });
    }

    update() {
        for (const code in this.keys) {
            this.justPressed[code] = this.keys[code] && !this._prev[code];
        }
        Object.assign(this._prev, this.keys);
    }

    isDown(code) {
        return !!this.keys[code];
    }

    isPressed(code) {
        return !!this.justPressed[code];
    }

    get up() { return this.isDown('ArrowUp') || this.isDown('KeyW'); }
    get down() { return this.isDown('ArrowDown') || this.isDown('KeyS'); }
    get left() { return this.isDown('ArrowLeft') || this.isDown('KeyA'); }
    get right() { return this.isDown('ArrowRight') || this.isDown('KeyD'); }

    get confirm() { return this.isPressed('Enter') || this.isPressed('KeyZ'); }
    get cancel() { return this.isPressed('Escape') || this.isPressed('KeyX'); }
    get menu() { return this.isPressed('Escape'); }

    get dirUp() { return this.isPressed('ArrowUp') || this.isPressed('KeyW'); }
    get dirDown() { return this.isPressed('ArrowDown') || this.isPressed('KeyS'); }
    get dirLeft() { return this.isPressed('ArrowLeft') || this.isPressed('KeyA'); }
    get dirRight() { return this.isPressed('ArrowRight') || this.isPressed('KeyD'); }
}
