class Room {
    constructor(config) {
        this.name = config.name;
        this.width = config.width;
        this.height = config.height;
        this.palette = config.palette || CONFIG.PALETTES.whiteRoom;
        this.tilemap = null;
        this.triggers = new TriggerManager();
        this.entities = [];
        this.particles = new ParticleSystem();
        this.playerStart = config.playerStart || { x: 5, y: 5 };
        this.effects = config.effects || [];
        this.tilesetName = config.tilesetName || 'whiteRoom';
        this.onEnter = config.onEnter || null;
        this.onUpdate = config.onUpdate || null;
        this.ambientParticle = config.ambientParticle || null;
        this.ambientTimer = 0;
        this.built = false;
        this.tileset = null; // cached tileset canvas reference
    }

    build(gameRef) {
        // Override in subclasses
        this.built = true;
    }

    enter(gameRef) {
        if (!this.built) this.build(gameRef);
        if (this.onEnter) this.onEnter(gameRef);
        // Cache tileset reference so draw() doesn't need global
        this.tileset = gameRef.tilesetGen.cache[this.tilesetName];
        gameRef.audio.setRoomAmbience(this.tilesetName);

        // Set effects
        gameRef.effects.disableAll();
        for (const eff of this.effects) {
            gameRef.effects.enable(eff.name, eff.params);
        }
    }

    update(dt, gameRef) {
        for (const e of this.entities) {
            e.update(dt, gameRef);
        }

        if (this.ambientParticle) {
            this.ambientTimer += dt;
            if (this.ambientTimer > 0.3) {
                this.ambientTimer = 0;
                this.ambientParticle(this.particles, gameRef);
            }
        }

        this.particles.update(dt);

        if (this.onUpdate) this.onUpdate(dt, gameRef);
    }

    draw(renderer, camera) {
        if (!this.tileset || !this.tilemap) return;

        // Draw ground layer
        renderer.drawTilemap(this.tilemap, 'ground', camera, this.tileset);
        // Draw walls
        renderer.drawTilemap(this.tilemap, 'walls', camera, this.tileset);
        // Draw objects layer
        renderer.drawTilemap(this.tilemap, 'objects', camera, this.tileset);
    }

    drawEntities(renderer, camera) {
        for (const e of this.entities) {
            e.draw(renderer, camera);
        }
        this.particles.draw(renderer.ictx, camera);
    }
}
