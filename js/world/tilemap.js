class Tilemap {
    constructor(width, height, layers) {
        this.width = width;
        this.height = height;
        this.layers = {};
        this.collision = [];

        if (layers) {
            for (const name in layers) {
                this.layers[name] = layers[name];
            }
        }

        // Init collision from wall layer or explicit collision
        this.rebuildCollision();
    }

    rebuildCollision() {
        this.collision = new Array(this.width * this.height).fill(0);
        const ground = this.layers.ground || [];
        const walls = this.layers.walls || [];

        for (let i = 0; i < this.width * this.height; i++) {
            // Wall tiles (2,3) and any tile > 0 in walls layer are solid
            if (walls[i] && walls[i] > 0) {
                this.collision[i] = 1;
            }
            // No ground = impassable (out of bounds)
            if (!ground[i] || ground[i] <= 0) {
                this.collision[i] = 1;
            }
        }
    }

    setCollision(x, y, solid) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.collision[y * this.width + x] = solid ? 1 : 0;
        }
    }

    isSolid(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return true;
        return this.collision[y * this.width + x] === 1;
    }

    getTile(layer, x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 0;
        const data = this.layers[layer];
        if (!data) return 0;
        return data[y * this.width + x] || 0;
    }

    setTile(layer, x, y, value) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
        if (!this.layers[layer]) {
            this.layers[layer] = new Array(this.width * this.height).fill(0);
        }
        this.layers[layer][y * this.width + x] = value;
    }
}
