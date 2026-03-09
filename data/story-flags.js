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
        items: [],

        // Garden flowers (for puzzle)
        gardenFlower1: false,
        gardenFlower2: false,
        gardenFlower3: false,
        gardenFlower4: false,

        // Hospital fixes
        hospitalFix1: false,
        hospitalFix2: false,
        hospitalFix3: false,
        hospitalFix4: false,

        // Secret room visited
        visitedChildrenRoom: false,
        visitedRoof: false,

        // Doctor interactions
        doctorTalks: 0,

        // Little Mila sightings
        littleMilaSightings: 0,

        // Sound puzzle
        schoolSoundPuzzleDone: false,

        // Child drawing placed on grave
        drawingOnGrave: false
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

    getRejectedCount(flags) {
        let count = 0;
        if (flags.memoryApartment === false) count++;
        if (flags.memorySchool === false) count++;
        if (flags.memoryGarden === false) count++;
        if (flags.memoryHospital === false) count++;
        if (flags.memoryVoid === false) count++;
        return count;
    },

    getEnding(flags, meta) {
        const accepted = this.getAcceptedCount(flags);

        // Secret ending D: "Forgiveness"
        // Requires: all memories accepted + visited secret room + seen all 3 endings before
        if (accepted >= 5 && meta && meta.secretEndingAvailable) {
            return CONFIG.ENDINGS.FORGIVENESS;
        }

        if (accepted >= 4) return CONFIG.ENDINGS.AWAKENING;
        if (accepted <= 1) return CONFIG.ENDINGS.OBLIVION;
        return CONFIG.ENDINGS.LOOP;
    }
};
