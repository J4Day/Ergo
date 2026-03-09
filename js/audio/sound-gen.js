class SoundGen {
    constructor(audioCtx) {
        this.ctx = audioCtx;
    }

    // === UTILITY ===

    noteFreq(note, octave) {
        const notes = { C:0, Cs:1, D:2, Ds:3, E:4, F:5, Fs:6, G:7, Gs:8, A:9, As:10, B:11 };
        return 440 * Math.pow(2, (notes[note] + (octave - 4) * 12 - 9) / 12);
    }

    playNote(freq, startTime, duration, type, volume, dest) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume || 0.04, startTime + 0.02);
        gain.gain.setValueAtTime(volume || 0.04, startTime + duration * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(dest || this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
        return osc;
    }

    // === AMBIENT DRONES ===

    createDrone(freq, volume) {
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.value = freq || 50;
        osc2.type = 'sine';
        osc2.frequency.value = (freq || 50) * 1.005; // slight detune for width

        filter.type = 'lowpass';
        filter.frequency.value = 200;
        filter.Q.value = 5;
        gain.gain.value = volume || 0.05;

        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);

        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.value = 0.08;
        lfoGain.gain.value = 8;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfoGain.connect(filter.frequency);
        lfo.start();

        return { osc, osc2, gain, filter, lfo, start() { osc.start(); osc2.start(); } };
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
            gain, osc,
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
            setRate(bpm) { this.stop(); this.start(bpm); }
        };
        return pulse;
    }

    // === SFX ===

    playFootstep(volume) {
        const bufferSize = this.ctx.sampleRate * 0.06;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
        }
        const source = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        source.buffer = buffer;
        filter.type = 'bandpass';
        filter.frequency.value = 600 + Math.random() * 400;
        filter.Q.value = 1.5;
        gain.gain.value = volume || 0.1;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        source.start();
    }

    playDrip() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400 + Math.random() * 300, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.12);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    playUIConfirm() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.05);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
    }

    playUISelect() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = 440;
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.07);
    }

    playItemPickup() {
        const now = this.ctx.currentTime;
        [523, 659, 784].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = f;
            const t = now + i * 0.08;
            gain.gain.setValueAtTime(0.04, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.12);
        });
    }

    playDoorOpen() {
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const t = i / this.ctx.sampleRate;
            data[i] = Math.sin(t * 150) * 0.3 * Math.exp(-t * 8) +
                       (Math.random() * 2 - 1) * 0.1 * Math.exp(-t * 12);
        }
        const source = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        source.buffer = buffer;
        gain.gain.value = 0.12;
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(now);
    }

    playGlitchSound() {
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.25;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            // Bitcrushed noise with tonal elements
            data[i] = (Math.random() * 2 - 1) * 0.25 * (1 - t) +
                       Math.sin(i * 0.15) * 0.15 * Math.sin(i * 0.003);
        }
        const source = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        source.buffer = buffer;
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(now);
    }

    playHeartbeat() {
        const now = this.ctx.currentTime;
        for (let beat = 0; beat < 2; beat++) {
            const osc = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 45;
            osc2.type = 'sine';
            osc2.frequency.value = 55;
            const t = now + beat * 0.18;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(beat === 0 ? 0.15 : 0.1, t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
            osc.connect(gain);
            osc2.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc2.start(t);
            osc.stop(t + 0.18);
            osc2.stop(t + 0.18);
        }
    }

    playShadowWhisper() {
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.8;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            data[i] = (Math.random() * 2 - 1) * 0.08 * Math.sin(t * Math.PI) *
                       (1 + Math.sin(i * 0.01) * 0.5);
        }
        const source = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        source.buffer = buffer;
        filter.type = 'bandpass';
        filter.frequency.value = 2000;
        filter.Q.value = 3;
        gain.gain.value = 0.08;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(now);
    }

    playMemoryAccept() {
        const now = this.ctx.currentTime;
        const notes = [262, 330, 392, 523]; // C major arpeggio up
        notes.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = f;
            const t = now + i * 0.15;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.06, t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.45);
        });
    }

    playShadowScream() {
        const now = this.ctx.currentTime;

        // Layer 1: Distorted descending scream
        for (let i = 0; i < 3; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = i === 0 ? 'sawtooth' : 'square';
            osc.frequency.setValueAtTime(800 + i * 200, now);
            osc.frequency.exponentialRampToValueAtTime(100 + i * 50, now + 0.6);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.12 - i * 0.03, now + 0.02);
            gain.gain.setValueAtTime(0.12 - i * 0.03, now + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.85);
        }

        // Layer 2: Noise burst (like static)
        const bufSize = this.ctx.sampleRate * 0.5;
        const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            const t = i / bufSize;
            data[i] = (Math.random() * 2 - 1) * (1 - t) * 0.3;
        }
        const source = this.ctx.createBufferSource();
        const noiseGain = this.ctx.createGain();
        source.buffer = buffer;
        noiseGain.gain.setValueAtTime(0.15, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        source.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        source.start(now);

        // Layer 3: Sub bass thud
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.value = 30;
        subGain.gain.setValueAtTime(0, now);
        subGain.gain.linearRampToValueAtTime(0.2, now + 0.01);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        sub.connect(subGain);
        subGain.connect(this.ctx.destination);
        sub.start(now);
        sub.stop(now + 0.45);
    }

    playCorruptionHum() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = 65;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 150;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.03, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 1.6);
    }

    playMemoryReject() {
        const now = this.ctx.currentTime;
        const notes = [392, 370, 349, 311]; // descending dissonant
        notes.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = f;
            const t = now + i * 0.18;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.05, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.4);
        });
    }

    // === OST: Full procedural music tracks ===

    // Track 1: "White Silence" — Title/White Room theme
    // Minimal, sparse piano-like tones with reverb feel
    playOST_WhiteSilence(dest) {
        const now = this.ctx.currentTime;
        // Sparse high notes, lots of silence between
        const sequence = [
            { note: 'E', oct: 5, time: 0, dur: 1.5 },
            { note: 'B', oct: 4, time: 2, dur: 1.2 },
            { note: 'Gs', oct: 4, time: 4.5, dur: 1.8 },
            { note: 'E', oct: 4, time: 7, dur: 2 },
            { note: 'Fs', oct: 5, time: 10, dur: 1 },
            { note: 'E', oct: 5, time: 12, dur: 2.5 },
            { note: 'B', oct: 3, time: 15, dur: 3 },
        ];
        sequence.forEach(n => {
            const freq = this.noteFreq(n.note, n.oct);
            this.playNote(freq, now + n.time, n.dur, 'sine', 0.035, dest);
            // Ghost echo
            this.playNote(freq * 2, now + n.time + 0.3, n.dur * 0.6, 'sine', 0.012, dest);
        });
        return 18;
    }

    // Track 2: "Corridors of Forgetting" — Corridor theme
    // Low pulsing with occasional high dissonant pings
    playOST_Corridors(dest) {
        const now = this.ctx.currentTime;
        // Bass pulse
        for (let i = 0; i < 8; i++) {
            this.playNote(55, now + i * 2, 0.8, 'sawtooth', 0.02, dest);
            this.playNote(82.4, now + i * 2 + 1, 0.6, 'sawtooth', 0.015, dest);
        }
        // High pings
        const pings = [
            { note: 'B', oct: 5, time: 1.5 },
            { note: 'C', oct: 6, time: 5 },
            { note: 'Gs', oct: 5, time: 9 },
            { note: 'Ds', oct: 6, time: 13 },
        ];
        pings.forEach(p => {
            this.playNote(this.noteFreq(p.note, p.oct), now + p.time, 0.3, 'sine', 0.025, dest);
        });
        return 16;
    }

    // Track 3: "Submerged" — Apartment theme
    // Watery arpeggios, muffled chords
    playOST_Submerged(dest) {
        const now = this.ctx.currentTime;
        const chords = [
            [131, 165, 196], // Cm
            [123, 156, 185], // Bm
            [110, 139, 165], // Am
            [117, 147, 175], // Bbm
        ];
        chords.forEach((chord, ci) => {
            const t = now + ci * 4;
            chord.forEach((freq, ni) => {
                this.playNote(freq, t + ni * 0.15, 3.5, 'triangle', 0.025, dest);
                // Octave shimmer
                this.playNote(freq * 2, t + ni * 0.15 + 0.5, 1.5, 'sine', 0.01, dest);
            });
        });
        return 16;
    }

    // Track 4: "Echoes in the Halls" — School theme
    // Distorted music box, off-key notes
    playOST_Echoes(dest) {
        const now = this.ctx.currentTime;
        const melody = [
            { n: 'E', o: 5, t: 0 }, { n: 'Ds', o: 5, t: 0.4 },
            { n: 'E', o: 5, t: 0.8 }, { n: 'B', o: 4, t: 1.2 },
            { n: 'D', o: 5, t: 1.6 }, { n: 'C', o: 5, t: 2.0 },
            { n: 'A', o: 4, t: 2.4 }, { n: 'C', o: 5, t: 3.2 },
            { n: 'E', o: 5, t: 3.6 }, { n: 'A', o: 5, t: 4.0 },
            { n: 'Gs', o: 5, t: 4.4 }, { n: 'E', o: 5, t: 5.2 },
            // Second phrase with drift
            { n: 'E', o: 5, t: 6.0 }, { n: 'Ds', o: 5, t: 6.4 },
            { n: 'E', o: 5, t: 6.8 }, { n: 'B', o: 4, t: 7.2 },
            { n: 'D', o: 5, t: 7.6 }, { n: 'C', o: 5, t: 8.0 },
            { n: 'A', o: 4, t: 8.4 },
        ];
        melody.forEach(m => {
            const freq = this.noteFreq(m.n, m.o) + (Math.random() - 0.5) * 6;
            this.playNote(freq, now + m.t, 0.35, 'square', 0.02, dest);
        });
        return 10;
    }

    // Track 5: "Lullaby for Ashes" — Garden theme
    // Slow, melancholic waltz with pitch drift
    playOST_Lullaby(dest) {
        const now = this.ctx.currentTime;
        const melody = [
            { n: 'A', o: 4, t: 0, d: 1.5 },
            { n: 'C', o: 5, t: 1.5, d: 0.75 },
            { n: 'B', o: 4, t: 2.25, d: 0.75 },
            { n: 'A', o: 4, t: 3, d: 1.5 },
            { n: 'G', o: 4, t: 4.5, d: 0.75 },
            { n: 'F', o: 4, t: 5.25, d: 0.75 },
            { n: 'E', o: 4, t: 6, d: 1.5 },
            { n: 'D', o: 4, t: 7.5, d: 0.75 },
            { n: 'E', o: 4, t: 8.25, d: 0.75 },
            { n: 'A', o: 4, t: 9, d: 3 },
            // Repeat higher with drift
            { n: 'A', o: 5, t: 12, d: 1.5 },
            { n: 'C', o: 6, t: 13.5, d: 0.75 },
            { n: 'B', o: 5, t: 14.25, d: 0.75 },
            { n: 'A', o: 5, t: 15, d: 3 },
        ];
        melody.forEach(m => {
            const freq = this.noteFreq(m.n, m.o) + (Math.random() - 0.5) * 3;
            this.playNote(freq, now + m.t, m.d, 'sine', 0.035, dest);
        });
        // Bass
        [0, 3, 6, 9, 12, 15].forEach(t => {
            this.playNote(110, now + t, 2.5, 'triangle', 0.02, dest);
        });
        return 18;
    }

    // Track 6: "Flatline" — Hospital theme
    // Beeping monitors, dissonant strings, breathing rhythm
    playOST_Flatline(dest) {
        const now = this.ctx.currentTime;
        // Monitor beep pattern
        for (let i = 0; i < 12; i++) {
            this.playNote(1000, now + i * 1.2, 0.08, 'sine', 0.03, dest);
        }
        // Dissonant pads
        const pads = [
            [131, 156, 196], // C Eb G (Cm)
            [123, 147, 185], // B D# F#
            [139, 165, 208], // C# E G#
        ];
        pads.forEach((chord, i) => {
            const t = now + i * 5;
            chord.forEach(f => {
                this.playNote(f, t, 4.5, 'sawtooth', 0.012, dest);
            });
        });
        return 15;
    }

    // Track 7: "The Shape of You" — Void/Shadow theme
    // Deep bass, reverse-like swells, whisper texture
    playOST_Void(dest) {
        const now = this.ctx.currentTime;
        // Sub bass swells
        for (let i = 0; i < 4; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 30 + i * 3;
            const t = now + i * 4;
            gain.gain.setValueAtTime(0.001, t);
            gain.gain.exponentialRampToValueAtTime(0.06, t + 2);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 3.8);
            osc.connect(gain);
            gain.connect(dest || this.ctx.destination);
            osc.start(t);
            osc.stop(t + 4);
        }
        // High dissonant cluster
        [2, 6, 10].forEach(t => {
            [1568, 1661, 1760].forEach(f => {
                this.playNote(f, now + t, 1.5, 'sine', 0.008, dest);
            });
        });
        return 16;
    }

    // Track 8: "Awakening" — Ending A theme
    // Major key resolution, warmth, rising melody
    playOST_Awakening(dest) {
        const now = this.ctx.currentTime;
        const melody = [
            { n: 'C', o: 4, t: 0, d: 1 },
            { n: 'E', o: 4, t: 1, d: 1 },
            { n: 'G', o: 4, t: 2, d: 1 },
            { n: 'C', o: 5, t: 3, d: 1.5 },
            { n: 'E', o: 5, t: 4.5, d: 1 },
            { n: 'G', o: 5, t: 5.5, d: 1.5 },
            { n: 'C', o: 6, t: 7, d: 3 },
        ];
        melody.forEach(m => {
            const freq = this.noteFreq(m.n, m.o);
            this.playNote(freq, now + m.t, m.d, 'sine', 0.04, dest);
            this.playNote(freq * 0.5, now + m.t, m.d * 1.2, 'triangle', 0.02, dest);
        });
        // Warm pad
        [262, 330, 392].forEach(f => {
            this.playNote(f, now, 10, 'triangle', 0.015, dest);
        });
        return 10;
    }

    playLullaby() {
        this.playOST_Lullaby(this.ctx.destination);
    }

    // === SOUND PUZZLE ===

    // Play a tone from a pentatonic scale (0-4), correct = warm, incorrect = harsh
    playSoundPuzzleTone(noteIndex, correct) {
        const now = this.ctx.currentTime;
        // Pentatonic scale: C D E G A
        const scale = [262, 294, 330, 392, 440];
        const freq = scale[noteIndex % scale.length];

        if (correct) {
            // Warm bell-like tone
            const osc = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            osc2.type = 'sine';
            osc2.frequency.value = freq * 2; // octave harmonic
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
            osc.connect(gain);
            osc2.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc2.start(now);
            osc.stop(now + 1.3);
            osc2.stop(now + 1.3);
        } else {
            // Dissonant buzz
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.value = freq * 0.97; // slightly off
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.45);
        }
    }

    // Directional guide: play a tone that hints which direction to go
    // direction: 'warm' (getting closer), 'cold' (getting farther), 'hot' (very close)
    playSoundPuzzleGuide(direction) {
        const now = this.ctx.currentTime;

        if (direction === 'hot') {
            // Rapid ascending chime
            [523, 659, 784].forEach((f, i) => {
                this.playNote(f, now + i * 0.1, 0.3, 'sine', 0.05);
            });
        } else if (direction === 'warm') {
            // Gentle rising tone
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(330, now);
            osc.frequency.linearRampToValueAtTime(440, now + 0.3);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.04, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.55);
        } else {
            // Low descending tone
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.linearRampToValueAtTime(150, now + 0.3);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.04, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.55);
        }
    }

    // Puzzle solved fanfare
    playSoundPuzzleComplete() {
        const now = this.ctx.currentTime;
        const notes = [262, 330, 392, 523, 659, 784];
        notes.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = f;
            const t = now + i * 0.12;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.06, t + 0.02);
            gain.gain.setValueAtTime(0.06, t + 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.65);
        });
    }

    // === AMBIENT SOUNDS ===

    // Whisper conversation — filtered noise modulated to sound speech-like
    playWhisper(variant) {
        const now = this.ctx.currentTime;
        const duration = 1.5 + Math.random() * 1.5;
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Simulate speech-like amplitude modulation
        const syllableRate = 3 + Math.random() * 4; // syllables per second
        for (let i = 0; i < bufferSize; i++) {
            const t = i / this.ctx.sampleRate;
            const syllable = Math.sin(t * syllableRate * Math.PI * 2) * 0.5 + 0.5;
            const breath = Math.sin(t * 0.7) * 0.3 + 0.7;
            const envelope = Math.sin(t / duration * Math.PI); // fade in/out
            data[i] = (Math.random() * 2 - 1) * 0.06 * syllable * breath * envelope;
        }

        const source = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        const filter2 = this.ctx.createBiquadFilter();
        source.buffer = buffer;

        // Bandpass to make it speech-like
        filter.type = 'bandpass';
        filter.frequency.value = 800 + (variant || 0) * 400;
        filter.Q.value = 4;
        filter2.type = 'bandpass';
        filter2.frequency.value = 2200 + (variant || 0) * 300;
        filter2.Q.value = 2;

        gain.gain.value = 0.04;
        source.connect(filter);
        source.connect(filter2);
        filter.connect(gain);
        filter2.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(now);
    }

    // Water ambience — continuous dripping and flow
    playWaterAmbient() {
        const now = this.ctx.currentTime;
        // Multiple random drips
        for (let i = 0; i < 5; i++) {
            const t = now + Math.random() * 3;
            const freq = 800 + Math.random() * 1200;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.3, t + 0.15);
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.03, t + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.25);
        }
        // Low rumble (water flow)
        const bufSize = this.ctx.sampleRate * 3;
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            d[i] = (Math.random() * 2 - 1) * 0.02 * Math.sin(i / bufSize * Math.PI);
        }
        const src = this.ctx.createBufferSource();
        const g = this.ctx.createGain();
        const f = this.ctx.createBiquadFilter();
        src.buffer = buf;
        f.type = 'lowpass';
        f.frequency.value = 200;
        g.gain.value = 0.05;
        src.connect(f);
        f.connect(g);
        g.connect(this.ctx.destination);
        src.start(now);
    }

    // Wind ambience
    playWindAmbient() {
        const now = this.ctx.currentTime;
        const duration = 4;
        const bufSize = Math.floor(this.ctx.sampleRate * duration);
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            const t = i / this.ctx.sampleRate;
            const gust = Math.sin(t * 0.5) * 0.5 + 0.5;
            d[i] = (Math.random() * 2 - 1) * 0.03 * gust * Math.sin(t / duration * Math.PI);
        }
        const src = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        src.buffer = buf;
        filter.type = 'bandpass';
        filter.frequency.value = 400;
        filter.Q.value = 0.5;
        gain.gain.value = 0.06;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        src.start(now);
    }

    // Clock ticking
    playClockTick() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = 1800;
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
    }

    // Radio static with voice fragments
    playRadioStatic(withVoice) {
        const now = this.ctx.currentTime;
        const duration = 2 + Math.random();
        const bufSize = Math.floor(this.ctx.sampleRate * duration);
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            const t = i / this.ctx.sampleRate;
            let noise = (Math.random() * 2 - 1) * 0.08;
            // Occasional "voice" — filtered tone bursts
            if (withVoice && Math.sin(t * 7) > 0.7) {
                noise += Math.sin(t * 300 + Math.sin(t * 5) * 100) * 0.04;
            }
            d[i] = noise * Math.sin(t / duration * Math.PI);
        }
        const src = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        src.buffer = buf;
        gain.gain.value = 0.07;
        src.connect(gain);
        gain.connect(this.ctx.destination);
        src.start(now);
    }

    // Door creak (heavier, more atmospheric)
    playDoorCreak() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.linearRampToValueAtTime(120, now + 0.3);
        osc.frequency.linearRampToValueAtTime(60, now + 0.6);
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(82, now);
        osc2.frequency.linearRampToValueAtTime(122, now + 0.3);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 300;
        filter.Q.value = 8;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.05);
        gain.gain.setValueAtTime(0.06, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.75);
        osc2.stop(now + 0.75);
    }

    // Breathing sound (for cutscenes)
    playBreathing() {
        const now = this.ctx.currentTime;
        const duration = 2.5;
        const bufSize = Math.floor(this.ctx.sampleRate * duration);
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            const t = i / this.ctx.sampleRate;
            // Inhale-exhale cycle
            const breathCycle = Math.sin(t * Math.PI / 1.2);
            const isInhale = breathCycle > 0;
            const intensity = Math.abs(breathCycle);
            const freq = isInhale ? 0.015 : 0.02;
            d[i] = (Math.random() * 2 - 1) * freq * intensity;
        }
        const src = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        src.buffer = buf;
        filter.type = 'bandpass';
        filter.frequency.value = 600;
        filter.Q.value = 1;
        gain.gain.value = 0.12;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        src.start(now);
    }

    // Crying sound (muffled, for hospital/mother scenes)
    playCrying() {
        const now = this.ctx.currentTime;
        for (let i = 0; i < 4; i++) {
            const t = now + i * 0.6;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(350 + Math.random() * 50, t);
            osc.frequency.linearRampToValueAtTime(280, t + 0.3);
            osc.frequency.linearRampToValueAtTime(320, t + 0.5);
            filter.type = 'lowpass';
            filter.frequency.value = 800;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.04, t + 0.05);
            gain.gain.linearRampToValueAtTime(0.02, t + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.6);
        }
    }

    // Monitor flatline
    playFlatline() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 1000;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.1);
        gain.gain.setValueAtTime(0.06, now + 2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 3.1);
    }

    // Cutscene transition whoosh
    playCutsceneTransition() {
        const now = this.ctx.currentTime;
        const bufSize = Math.floor(this.ctx.sampleRate * 0.8);
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            const t = i / bufSize;
            d[i] = (Math.random() * 2 - 1) * (1 - t) * t * 4 * 0.15;
        }
        const src = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        src.buffer = buf;
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.exponentialRampToValueAtTime(2000, now + 0.4);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.8);
        filter.Q.value = 1;
        gain.gain.value = 0.1;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        src.start(now);
    }

    // Wrong sequence error
    playSoundPuzzleError() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc2.type = 'sawtooth';
        osc.frequency.value = 100;
        osc2.frequency.value = 103; // beating
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.65);
        osc2.stop(now + 0.65);
    }
}
