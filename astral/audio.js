/* Synthesized feedback. The game has no external audio dependencies. */
(function (root) {
  "use strict";

  const Audio = root.AudioContext || root.webkitAudioContext;
  let context;
  let master;
  let silent = false;

  function prepare() {
    if (!Audio || silent) return;
    if (!context) {
      context = new Audio();
      master = context.createGain();
      master.gain.value = 0.48;
      master.connect(context.destination);
    }
    if (context.state !== "running") context.resume().catch(() => {});
  }

  function tone(frequency, start, duration, volume, type = "sine", end = frequency) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(end, start + duration);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(volume, start + 0.018);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope).connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  function brush(start, duration, frequency, volume) {
    const size = Math.ceil(context.sampleRate * duration);
    const buffer = context.createBuffer(1, size, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / size) ** 2;
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = frequency;
    const level = context.createGain();
    level.gain.value = volume;
    source.connect(filter).connect(level).connect(master);
    source.start(start);
  }

  function play(name) {
    if (!context || silent || context.state !== "running") return;
    const time = context.currentTime;
    switch (name) {
      case "pick":
        tone(485, time, 0.11, 0.045, "sine", 620);
        break;
      case "summon":
        tone(118, time, 0.25, 0.17, "sine", 58);
        brush(time, 0.16, 590, 0.15);
        tone(493, time + 0.035, 0.29, 0.055, "triangle");
        tone(740, time + 0.10, 0.22, 0.045);
        break;
      case "magic":
        brush(time, 0.28, 1600, 0.09);
        [415, 622, 831].forEach((note, index) => tone(note, time + index * 0.047, 0.28, 0.068));
        break;
      case "slash":
        brush(time, 0.17, 2300, 0.26);
        tone(205, time + 0.03, 0.15, 0.085, "triangle", 80);
        break;
      case "hit":
        tone(115, time, 0.2, 0.20, "sine", 40);
        tone(230, time, 0.13, 0.05, "triangle", 82);
        brush(time, 0.12, 1200, 0.18);
        break;
      case "fall":
        brush(time, 0.37, 770, 0.18);
        tone(182, time, 0.3, 0.083, "triangle", 53);
        break;
      case "turn":
        tone(523, time, 0.27, 0.063);
        tone(698, time + 0.075, 0.34, 0.057);
        break;
      case "cpu":
        tone(261, time, 0.23, 0.052, "triangle");
        tone(207, time + 0.065, 0.31, 0.048);
        break;
      case "victory":
        [293.66, 440, 587.33, 739.99, 880].forEach((note, index) => {
          tone(note, time + index * 0.115, 0.75, index ? 0.10 : 0.15, "triangle");
        });
        tone(146.83, time + 0.38, 1.35, 0.14);
        break;
      case "defeat":
        [392, 329.63, 261.63, 196].forEach((note, index) => {
          tone(note, time + index * 0.16, 0.75, 0.087, "triangle");
        });
        break;
    }
  }

  function mute(value) {
    silent = value;
    if (master) master.gain.value = silent ? 0 : 0.48;
    if (!silent) prepare();
  }

  root.AstralAudio = { prepare, play, mute };
}(globalThis));
