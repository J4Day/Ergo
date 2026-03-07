class SoundGen {
    constructor(audioCtx) {
        this.ctx = audioCtx;
    }

    createDrone(freq, volume) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.value = freq || 50;
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        filter.Q.value = 5;
        gain.gain.value = volume || 0.05;

        osc.connect(filter);
        filter.connect(gain);

        // Slow LFO for movement
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.value = 0.1;
        lfoGain.gain.value = 10;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        return { osc, gain, filter, lfo, start() { osc.start(); } };
    }

    createPulse(freq, rate) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq || 60;
        gain.gain.value = 0;

        osc.connect(gain);
        osc.start();

        let intervalId = null;
        const pulse = {
            gain,
            osc,
            start(bpm) {
                const interval = 60000 / (bpm || 60);
                intervalId = setInterval(() => {
                    const now = gain.context.currentTime;
                    gain.gain.setValueAtTime(0.08, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                }, interval);
            },
            stop() {
                if (intervalId) clearInterval(intervalId);
                gain.gain.value = 0;
            },
            setRate(bpm) {
                this.stop();
                this.start(bpm);
            }
        };
        return pulse;
    }

    playFootstep(volume) {
        const bufferSize = this.ctx.sampleRate * 0.05;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
        }

        const source = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        source.buffer = buffer;
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 2;
        gain.gain.value = volume || 0.15;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        source.start();
    }

    playDrip() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 1200;
        osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.1);
        gain.gain.value = 0.05;
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playLullaby() {
        // 8 notes of a simple melody
        const notes = [262, 294, 330, 349, 330, 294, 262, 247];
        const now = this.ctx.currentTime;

        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq + (Math.random() - 0.5) * 5; // pitch drift
            gain.gain.value = 0;
            gain.gain.setValueAtTime(0, now + i * 0.5);
            gain.gain.linearRampToValueAtTime(0.04, now + i * 0.5 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.5 + 0.45);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.5);
            osc.stop(now + i * 0.5 + 0.5);
        });
    }

    playUIConfirm() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = 440;
        gain.gain.value = 0.05;
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playGlitchSound() {
        const bufferSize = this.ctx.sampleRate * 0.2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.3;
        }
        const source = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        source.buffer = buffer;
        gain.gain.value = 0.1;
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start();
    }

    playHeartbeat(rate) {
        const now = this.ctx.currentTime;
        for (let beat = 0; beat < 2; beat++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 50;
            const t = now + beat * 0.15;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.12, t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.15);
        }
    }
}
