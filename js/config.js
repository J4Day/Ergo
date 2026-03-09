const CONFIG = {
    TILE_SIZE: 16,
    INTERNAL_WIDTH: 256,
    INTERNAL_HEIGHT: 192,
    TILES_X: 16,
    TILES_Y: 12,
    SCALE: 3,
    PLAYER_MOVE_TIME: 170,
    FPS: 60,

    PALETTES: {
        whiteRoom: ['#f0f0f0', '#c0c0c0', '#808080', '#404040', '#202020', '#000000'],
        corridor:  ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560', '#f0f0f0'],
        apartment: ['#0a1628', '#1b2838', '#2a4a6b', '#3d7cc9', '#5ba3e6', '#f0f0f0'],
        school:    ['#0a0a0a', '#003300', '#006600', '#00cc00', '#00ff00', '#33ff33'],
        garden:    ['#1a0a0a', '#4a2020', '#8b4040', '#cc2020', '#808080', '#f0f0f0'],
        hospital:  ['#f0f0f0', '#ff0000', '#cc0000', '#400000', '#200000', '#000000'],
        void:      ['#000000', '#080808', '#101010', '#181818', '#f0f0f0', '#ff0000']
    },

    ENDINGS: {
        AWAKENING: 'A',
        OBLIVION: 'B',
        LOOP: 'C',
        FORGIVENESS: 'D'
    }
};
