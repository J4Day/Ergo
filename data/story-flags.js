const STORY_FLAGS = {
    defaults: {
        gameStarted: false,
        loopCount: 0,

        // Memory acceptance (true = accepted, false = rejected, null = not yet encountered)
        memoryApartment: null,
        memorySchool: null,
        memoryGarden: null,
        memoryHospital: null,
        memoryVoid: null,

        // Puzzle completion
        puzzleApartmentDone: false,
        puzzleSchoolDone: false,
        puzzleGardenDone: false,
        puzzleHospitalDone: false,

        // NPCs
        metDoctor: false,
        metLittleMila: false,
        metMother: false,

        // Room visits
        visitedCorridor: false,
        visitedApartment: false,
        visitedSchool: false,
        visitedGarden: false,
        visitedHospital: false,
        visitedVoid: false,

        // White room degradation (0-5)
        whiteRoomDecay: 0,

        // Shadow encounters
        shadowEncounters: 0,

        // Items collected
        items: []
    },

    getAcceptedCount(flags) {
        let count = 0;
        if (flags.memoryApartment === true) count++;
        if (flags.memorySchool === true) count++;
        if (flags.memoryGarden === true) count++;
        if (flags.memoryHospital === true) count++;
        if (flags.memoryVoid === true) count++;
        return count;
    },

    getEnding(flags) {
        const accepted = this.getAcceptedCount(flags);
        if (accepted >= 4) return CONFIG.ENDINGS.AWAKENING;
        if (accepted <= 1) return CONFIG.ENDINGS.OBLIVION;
        return CONFIG.ENDINGS.LOOP;
    }
};
