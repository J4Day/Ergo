class Engine {
    constructor() {
        this.lastTime = 0;
        this.accumulator = 0;
        this.fixedDt = 1 / CONFIG.FPS;
        this.running = false;
        this.updateFn = null;
        this.renderFn = null;
    }

    start(updateFn, renderFn) {
        this.updateFn = updateFn;
        this.renderFn = renderFn;
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    loop(timestamp) {
        if (!this.running) return;

        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;
        this.accumulator += dt;

        while (this.accumulator >= this.fixedDt) {
            this.updateFn(this.fixedDt);
            this.accumulator -= this.fixedDt;
        }

        this.renderFn(this.accumulator / this.fixedDt);
        requestAnimationFrame((t) => this.loop(t));
    }

    stop() {
        this.running = false;
    }
}
