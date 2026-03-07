const EVENTS = {
    onGameStart: {
        actions: [
            { type: 'setFlag', flag: 'gameStarted', value: true },
            { type: 'dialogue', id: 'whiteRoomWake' }
        ]
    },
    onWhiteRoomReturn: {
        actions: [
            { type: 'incrementFlag', flag: 'whiteRoomDecay' },
            { type: 'dialogue', id: 'whiteRoomReturn' },
            { type: 'save' }
        ]
    },
    onEnterCorridor: {
        condition: { flag: 'visitedCorridor', is: false },
        actions: [
            { type: 'setFlag', flag: 'visitedCorridor', value: true },
            { type: 'dialogue', id: 'doctorFirst' },
            { type: 'setFlag', flag: 'metDoctor', value: true }
        ]
    },
    onEnterApartment: {
        condition: { flag: 'visitedApartment', is: false },
        actions: [
            { type: 'setFlag', flag: 'visitedApartment', value: true },
            { type: 'dialogue', id: 'apartmentEnter' }
        ]
    },
    onEnterSchool: {
        condition: { flag: 'visitedSchool', is: false },
        actions: [
            { type: 'setFlag', flag: 'visitedSchool', value: true },
            { type: 'dialogue', id: 'schoolEnter' }
        ]
    },
    onEnterGarden: {
        condition: { flag: 'visitedGarden', is: false },
        actions: [
            { type: 'setFlag', flag: 'visitedGarden', value: true },
            { type: 'dialogue', id: 'gardenEnter' }
        ]
    },
    onEnterHospital: {
        condition: { flag: 'visitedHospital', is: false },
        actions: [
            { type: 'setFlag', flag: 'visitedHospital', value: true },
            { type: 'dialogue', id: 'hospitalEnter' }
        ]
    },
    onEnterVoid: {
        condition: { flag: 'visitedVoid', is: false },
        actions: [
            { type: 'setFlag', flag: 'visitedVoid', value: true },
            { type: 'dialogue', id: 'voidEnter' }
        ]
    }
};
