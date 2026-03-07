class AudioManager {
    constructor() {
        this.ctx = null;
        this.soundGen = null;
        this.initialized = false;
        this.activeDrone = null;
        this.activePulse = null;
        this.masterGain = null;
        this.muted = false;
    }

    init() {
        if (this.initialized) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.soundGen = new SoundGen(this.ctx);
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.7;
        this.initialized = true;
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

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
                this.activeDrone.lfo.stop();
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
            try { this.activePulse.osc.stop(); } catch (e) {}
            this.activePulse = null;
        }
    }

    playFootstep() {
        if (!this.initialized) return;
        this.soundGen.playFootstep(0.08);
    }

    playConfirm() {
        if (!this.initialized) return;
        this.soundGen.playUIConfirm();
    }

    playGlitch() {
        if (!this.initialized) return;
        this.soundGen.playGlitchSound();
    }

    playHeartbeat(rate) {
        if (!this.initialized) return;
        this.soundGen.playHeartbeat(rate);
    }

    playDrip() {
        if (!this.initialized) return;
        this.soundGen.playDrip();
    }

    playLullaby() {
        if (!this.initialized) return;
        this.soundGen.playLullaby();
    }

    setRoomAmbience(roomName) {
        if (!this.initialized) return;
        this.stopDrone();
        this.stopPulse();

        switch (roomName) {
            case 'whiteRoom':
                this.startDrone(40, 0.02);
                break;
            case 'corridor':
                this.startDrone(55, 0.03);
                this.startPulse(60, 50);
                break;
            case 'apartment':
                this.startDrone(45, 0.04);
                break;
            case 'school':
                this.startDrone(60, 0.03);
                break;
            case 'garden':
                this.startDrone(50, 0.03);
                break;
            case 'hospital':
                this.startDrone(65, 0.04);
                this.startPulse(60, 70);
                break;
            case 'void':
                this.startDrone(35, 0.05);
                break;
        }
    }

    toggleMute() {
        if (!this.masterGain) return;
        this.muted = !this.muted;
        this.masterGain.gain.value = this.muted ? 0 : 0.7;
    }
}
