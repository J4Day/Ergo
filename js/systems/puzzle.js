class PuzzleSystem {
    constructor() {
        this.activePuzzle = null;
    }

    // Apartment: collect 3 photo fragments
    checkPhotoComplete(game) {
        return game.inventory.has('photoFragment1') &&
               game.inventory.has('photoFragment2') &&
               game.inventory.has('photoFragment3');
    }

    // Garden: plant 4 flowers in correct spots
    checkGardenComplete(game) {
        const flags = game.state.flags;
        return flags.gardenFlower1 && flags.gardenFlower2 &&
               flags.gardenFlower3 && flags.gardenFlower4;
    }

    // School: reach the exit following sound cues (tracked by position)
    checkSchoolComplete(game) {
        return game.state.getFlag('puzzleSchoolDone');
    }

    // Hospital: interact with 4 objects to "fix" them
    checkHospitalComplete(game) {
        const flags = game.state.flags;
        return flags.hospitalFix1 && flags.hospitalFix2 &&
               flags.hospitalFix3 && flags.hospitalFix4;
    }
}
