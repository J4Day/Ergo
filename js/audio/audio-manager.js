class AudioManager {
    constructor() {
        this.ctx = null;
        this.soundGen = null;
        this.initialized = false;
        this.activeDrone = null;
        this.activePulse = null;
        this.masterGain = null;
        this.musicGain = null;
        this.muted = false;
        this.currentOST = null;
        this.ostTimer = null;
        this.ostLoopDuration = 0;
    }

    init() {
        if (this.initialized) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.soundGen = new SoundGen(this.ctx);
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.7;

        this.musicGain = this.ctx.createGain();
        this.musicGain.connect(this.masterGain);
        this.musicGain.gain.value = 0.8;
        this.initialized = true;
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // === Drone layer ===

    startDrone(freq, volume) {
        if (!this.initialized) return;
        this.stopDrone();
        this.activeDrone = this.soundGen.createDrone(freq, volume);
        this.activeDrone.gain.connect(this.masterGain);
        this.activeDrone.start();
    }

    stopDrone() {
        if (this.activeDrone) {
            try {
                this.activeDrone.osc.stop();
                this.activeDrone.osc2.stop();
                this.activeDrone.lfo.stop();
                this.activeDrone.osc.disconnect();
                this.activeDrone.osc2.disconnect();
                this.activeDrone.lfo.disconnect();
                this.activeDrone.filter.disconnect();
                this.activeDrone.gain.disconnect();
            } catch (e) {}
            this.activeDrone = null;
        }
    }

    startPulse(freq, bpm) {
        if (!this.initialized) return;
        this.stopPulse();
        this.activePulse = this.soundGen.createPulse(freq, bpm);
        this.activePulse.gain.connect(this.masterGain);
        this.activePulse.start(bpm);
    }

    stopPulse() {
        if (this.activePulse) {
            this.activePulse.stop();
            try {
                this.activePulse.osc.stop();
                this.activePulse.osc.disconnect();
                this.activePulse.gain.disconnect();
            } catch (e) {}
            this.activePulse = null;
        }
    }

    // === OST music system ===

    playOST(trackName) {
        if (!this.initialized) return;
        this.stopOST();
        this.currentOST = trackName;

        const playTrack = () => {
            if (this.currentOST !== trackName) return;
            let duration = 16;
            switch (trackName) {
                case 'whiteSilence': duration = this.soundGen.playOST_WhiteSilence(this.musicGain); break;
                case 'corridors': duration = this.soundGen.playOST_Corridors(this.musicGain); break;
                case 'submerged': duration = this.soundGen.playOST_Submerged(this.musicGain); break;
                case 'echoes': duration = this.soundGen.playOST_Echoes(this.musicGain); break;
                case 'lullaby': duration = this.soundGen.playOST_Lullaby(this.musicGain); break;
                case 'flatline': duration = this.soundGen.playOST_Flatline(this.musicGain); break;
                case 'void': duration = this.soundGen.playOST_Void(this.musicGain); break;
                case 'awakening': duration = this.soundGen.playOST_Awakening(this.musicGain); break;
            }
            this.ostTimer = setTimeout(playTrack, duration * 1000);
        };
        playTrack();
    }

    stopOST() {
        this.currentOST = null;
        if (this.ostTimer) {
            clearTimeout(this.ostTimer);
            this.ostTimer = null;
        }
    }

    // === SFX shortcuts ===

    playFootstep() {
        if (!this.initialized) return;
        this.soundGen.playFootstep(0.06);
    }

    playConfirm() {
        if (!this.initialized) return;
        this.soundGen.playUIConfirm();
    }

    playSelect() {
        if (!this.initialized) return;
        this.soundGen.playUISelect();
    }

    playItemPickup() {
        if (!this.initialized) return;
        this.soundGen.playItemPickup();
    }

    playDoorOpen() {
        if (!this.initialized) return;
        this.soundGen.playDoorOpen();
    }

    playGlitch() {
        if (!this.initialized) return;
        this.soundGen.playGlitchSound();
    }

    playHeartbeat() {
        if (!this.initialized) return;
        this.soundGen.playHeartbeat();
    }

    playDrip() {
        if (!this.initialized) return;
        this.soundGen.playDrip();
    }

    playLullaby() {
        if (!this.initialized) return;
        this.soundGen.playLullaby();
    }

    playShadowWhisper() {
        if (!this.initialized) return;
        this.soundGen.playShadowWhisper();
    }

    playMemoryAccept() {
        if (!this.initialized) return;
        this.soundGen.playMemoryAccept();
    }

    playMemoryReject() {
        if (!this.initialized) return;
        this.soundGen.playMemoryReject();
    }

    playShadowScream() {
        if (!this.initialized) return;
        this.soundGen.playShadowScream();
    }

    playCorruptionHum() {
        if (!this.initialized) return;
        this.soundGen.playCorruptionHum();
    }

    // === SOUND PUZZLE ===

    playSoundPuzzleTone(noteIndex, correct) {
        if (!this.initialized) return;
        this.soundGen.playSoundPuzzleTone(noteIndex, correct);
    }

    playSoundPuzzleGuide(direction) {
        if (!this.initialized) return;
        this.soundGen.playSoundPuzzleGuide(direction);
    }

    playSoundPuzzleComplete() {
        if (!this.initialized) return;
        this.soundGen.playSoundPuzzleComplete();
    }

    playSoundPuzzleError() {
        if (!this.initialized) return;
        this.soundGen.playSoundPuzzleError();
    }

    // === NEW AMBIENT SOUNDS ===

    playWhisper(variant) {
        if (!this.initialized) return;
        this.soundGen.playWhisper(variant);
    }

    playWaterAmbient() {
        if (!this.initialized) return;
        this.soundGen.playWaterAmbient();
    }

    playWindAmbient() {
        if (!this.initialized) return;
        this.soundGen.playWindAmbient();
    }

    playClockTick() {
        if (!this.initialized) return;
        this.soundGen.playClockTick();
    }

    playRadioStatic(withVoice) {
        if (!this.initialized) return;
        this.soundGen.playRadioStatic(withVoice);
    }

    playDoorCreak() {
        if (!this.initialized) return;
        this.soundGen.playDoorCreak();
    }

    playBreathing() {
        if (!this.initialized) return;
        this.soundGen.playBreathing();
    }

    playCrying() {
        if (!this.initialized) return;
        this.soundGen.playCrying();
    }

    playFlatline() {
        if (!this.initialized) return;
        this.soundGen.playFlatline();
    }

    playCutsceneTransition() {
        if (!this.initialized) return;
        this.soundGen.playCutsceneTransition();
    }

    // === Room ambience (drone + OST combined) ===

    setRoomAmbience(roomName) {
        if (!this.initialized) return;
        this.stopDrone();
        this.stopPulse();

        switch (roomName) {
            case 'whiteRoom':
                this.startDrone(40, 0.015);
                this.playOST('whiteSilence');
                break;
            case 'corridor':
                this.startDrone(55, 0.02);
                this.startPulse(60, 45);
                this.playOST('corridors');
                break;
            case 'apartment':
                this.startDrone(45, 0.025);
                this.playOST('submerged');
                break;
            case 'school':
                this.startDrone(60, 0.02);
                this.playOST('echoes');
                break;
            case 'garden':
                this.startDrone(50, 0.02);
                this.playOST('lullaby');
                break;
            case 'hospital':
                this.startDrone(65, 0.025);
                this.startPulse(60, 65);
                this.playOST('flatline');
                break;
            case 'void':
                this.startDrone(35, 0.03);
                this.playOST('void');
                break;
        }
    }

    toggleMute() {
        if (!this.masterGain) return;
        this.muted = !this.muted;
        this.masterGain.gain.value = this.muted ? 0 : 0.7;
    }
}
