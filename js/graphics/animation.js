class Animation {
    constructor(frames, frameDuration) {
        this.frames = frames;
        this.frameDuration = frameDuration || 0.2;
        this.timer = 0;
        this.currentFrame = 0;
        this.playing = true;
        this.loop = true;
    }

    update(dt) {
        if (!this.playing) return;
        this.timer += dt;
        if (this.timer >= this.frameDuration) {
            this.timer -= this.frameDuration;
            this.currentFrame++;
            if (this.currentFrame >= this.frames.length) {
                this.currentFrame = this.loop ? 0 : this.frames.length - 1;
                if (!this.loop) this.playing = false;
            }
        }
    }

    get frame() {
        return this.frames[this.currentFrame];
    }

    reset() {
        this.currentFrame = 0;
        this.timer = 0;
        this.playing = true;
    }
}

class AnimationSet {
    constructor() {
        this.animations = {};
        this.current = null;
    }

    add(name, frames, frameDuration) {
        this.animations[name] = new Animation(frames, frameDuration);
    }

    play(name) {
        if (this.current === name) return;
        this.current = name;
        if (this.animations[name]) {
            this.animations[name].reset();
        }
    }

    update(dt) {
        if (this.current && this.animations[this.current]) {
            this.animations[this.current].update(dt);
        }
    }

    get frame() {
        if (this.current && this.animations[this.current]) {
            return this.animations[this.current].frame;
        }
        return null;
    }
}
