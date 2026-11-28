/* FUDA_SND — original music and effects synthesized by Web Audio. */
(() => {
  'use strict';

  const STORAGE_KEY = 'fuda.sound.enabled';
  const LOOKAHEAD = 0.14;
  const PUMP_INTERVAL = 25;
  const MUSIC_LEVEL = 0.37;
  const JINGLE_LENGTH = 1.52;
  const RESUME_EVENTS = ['pointerdown', 'touchstart', 'pointerup', 'touchend', 'click', 'keydown'];
  const has = (object, name) => Object.prototype.hasOwnProperty.call(object, name);
  // 本物の札の録音（CC0。flip：Splashdust「flipCard.wav」、deal：el_boss「Playing Card Deal Variation 2」、put：filmfan87「card placed on table」、tap：stevielematt「SOFT TAPPING」、coin：Firecat_the_potato_YT「coin flip.wav」＋HoseNoseSounds「Coin dropped on table 2」、すべて freesound.org）
  const SAMPLE_BASE = (document.currentScript && document.currentScript.src || location.href).replace(/[^/]*$/, '') + 'snd/';
  const SAMPLE_FILES = { flip: ['flip.mp3', 0.6], deal: ['deal.mp3', 0.45], put: ['put.mp3', 0.6], tap: ['tap.mp3', 0.35], coin: ['coin.mp3', 0.55] };   // [ファイル, 大きさ]
  const samples = {};
  // 録音のファイルは、ページを開いた時点で先に取りに行く（最初のタップで音の準備を始めてからでは、最初の数回に間に合わない）
  const raw = {};
  for (const name of Object.keys(SAMPLE_FILES)) {
    raw[name] = fetch(SAMPLE_BASE + SAMPLE_FILES[name][0]).then(r => r.ok ? r.arrayBuffer() : Promise.reject()).catch(() => null);
  }
  function loadSamples() {
    for (const name of Object.keys(SAMPLE_FILES)) {
      raw[name].then(b => b && new Promise((ok, ng) => ctx.decodeAudioData(b, ok, ng))).then(buf => { if (buf) samples[name] = buf; }, () => {});
    }
  }
  // 録音を鳴らす。毎回ほんの少し高さを変えて、続けて鳴っても同じ音に聞こえないようにする。
  // まだ読み終わっていないときは、何も鳴らさない（前の作った音が混ざって、違う音に聞こえないように）。true を返すので、作った音には行かない
  function playSample(name, bus, time) {
    const buf = samples[name]; if (!buf) return has(SAMPLE_FILES, name);
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = buf; src.playbackRate.value = 0.94 + Math.random() * 0.12;
    g.gain.value = SAMPLE_FILES[name][1];
    src.connect(g); g.connect(bus); src.onended = () => { src.disconnect(); g.disconnect(); };
    src.start(time); return true;
  }

  let enabled = true;
  try {
    enabled = window.localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch (_) {
    // Storage may be disabled. The setting still works for this page.
  }

  let ctx;
  let master;
  let musicBus;
  let effectsBus;
  let foreground;
  let whiteNoise;
  let desiredMusic = null;
  let track = null;
  let jingleVoice = null;
  let timer = null;
  let nextFlip = 0;
  let resumeRequested = false;
  let unlocked = false;
  const pending = [];

  function noiseBuffer() {
    if (!whiteNoise) {
      whiteNoise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const samples = whiteNoise.getChannelData(0);
      let seed = 0x9747b28c;
      for (let i = 0; i < samples.length; i++) {
        seed ^= seed << 13;
        seed ^= seed >>> 17;
        seed ^= seed << 5;
        samples[i] = (seed >>> 0) / 2147483648 - 1;
      }
    }
    return whiteNoise;
  }

  // Original swing charts. Event positions and lengths are in quarter-note beats.
  const MUSIC = {
    lobby: { bpm: 88, bars: 16 },
    match: { bpm: 100, bars: 24 },
  };

  const PIANO_VOICINGS = {
    f6: [57, 62, 67],
    fm7a: [60, 64, 67],
    d7: [54, 60, 63, 69],
    gm9: [58, 62, 65, 69],
    gm7: [58, 62, 65],
    c13: [58, 62, 64, 69],
    c7: [58, 64, 67],
    am7: [55, 60, 64],
    bb: [57, 60, 62, 65],
    bdim: [56, 59, 62, 65],
    gb13: [58, 63, 64, 68],
    dm7: [57, 60, 65],
    eb7: [55, 58, 61, 65],
  };

  // [position, length, accent]. Index 5 leaves a full bar for the bass and lead.
  const COMPING = [
    [[0.03, 1.07, 1], [2.64, 0.68, 0.76]],
    [[0.64, 0.53, 0.83], [2.02, 1.05, 0.96]],
    [[1.02, 0.78, 0.90], [3.64, 0.29, 0.69]],
    [[0.04, 0.84, 0.98], [2.04, 0.92, 0.86]],
    [[0.04, 1.78, 0.88]],
    [],
    [[0.03, 0.83, 1], [1.64, 0.53, 0.71], [3.03, 0.61, 0.75]],
    [[0.65, 1.04, 0.92]],
    [[1.04, 1.20, 0.79]],
  ];

  // Each bar contains piano voicings, walking bass pitches, a comping pattern,
  // and optional lead notes [position, MIDI pitch, length].
  const MATCH_CHART = [
    ["f6",      [41, 45, 48, 49], 0, [[0.65, 69, 0.30], [1.03, 72, 0.45], [1.65, 74, 0.32], [2.03, 72, 0.87]]],
    ["d7",      [50, 45, 48, 42], 2, [[1.67, 69, 0.29], [2.03, 66, 0.68]]],
    ["gm9",     [43, 46, 50, 47], 1, [[0.65, 67, 0.31], [1.03, 70, 0.48], [2.03, 69, 0.79]]],
    ["c13",     [48, 52, 46, 44], 6, [[2.66, 67, 0.27], [3.02, 64, 0.58]]],
    ["am7 d7",  [45, 48, 50, 42], 3, [[0.66, 64, 0.42], [1.65, 67, 0.29], [2.03, 66, 0.94]]],
    ["gm7 c7",  [43, 46, 48, 40], 3],
    ["f6",      [41, 48, 45, 42], 4, [[0.67, 69, 0.30], [1.03, 72, 0.65], [2.66, 74, 0.28], [3.03, 72, 0.59]]],
    ["gm9 c13", [43, 46, 48, 45], 3, [[1.05, 70, 0.54], [2.65, 69, 0.27], [3.02, 67, 0.70]]],
    ["bb",      [46, 50, 53, 46], 4, [[0.66, 62, 0.42], [1.64, 65, 0.29], [2.03, 69, 1.20]]],
    ["bdim",    [47, 50, 53, 44], 7, [[0.64, 68, 0.57], [2.03, 65, 0.66]]],
    ["fm7a",    [45, 48, 52, 49], 2, [[0.03, 67, 0.43], [1.64, 65, 0.32], [2.03, 64, 0.73]]],
    ["d7",      [50, 48, 45, 42], 5],
    ["gm9",     [43, 46, 50, 49], 8, [[0.03, 62, 0.43], [0.65, 65, 0.32], [1.03, 67, 0.49], [2.66, 70, 0.68]]],
    ["gb13",    [42, 46, 47, 42], 6, [[1.64, 68, 0.31], [2.03, 63, 0.74]]],
    ["f6 d7",   [41, 45, 38, 42], 3, [[1.03, 65, 0.54], [2.63, 66, 0.88]]],
    ["gm7 c13", [43, 46, 48, 40], 3, [[1.63, 67, 0.32], [2.03, 69, 0.63], [3.64, 67, 0.32]]],
    ["f6",      [41, 45, 48, 49], 0, [[0.65, 69, 0.32], [1.03, 72, 0.50], [1.65, 74, 0.29], [2.03, 72, 0.72]]],
    ["d7",      [50, 48, 45, 42], 2, [[1.03, 69, 0.40], [1.65, 66, 0.34], [2.07, 63, 0.75]]],
    ["gm9",     [43, 46, 50, 47], 1, [[0.65, 62, 0.28], [1.01, 65, 0.39], [1.65, 67, 0.31], [2.03, 70, 0.83]]],
    ["c13",     [48, 52, 46, 44], 6, [[1.66, 69, 0.31], [2.04, 67, 0.77]]],
    ["am7 d7",  [45, 48, 50, 42], 3, [[0.67, 72, 0.37], [1.65, 69, 0.31], [2.02, 66, 0.71]]],
    ["gm7 c7",  [43, 46, 48, 40], 3, [[0.64, 67, 0.40], [1.64, 70, 0.29], [2.02, 67, 0.67], [3.64, 64, 0.32]]],
    ["f6",      [41, 48, 45, 42], 4, [[0.04, 65, 1.18], [2.64, 62, 0.79]]],
    ["gm9 c13", [43, 46, 48, 40], 3, [[1.64, 65, 0.32], [2.03, 64, 0.61], [3.65, 67, 0.28]]],
  ];

  const LOBBY_CHART = [
    ["f6",      [41, 48], 4, [[0.67, 69, 0.31], [1.03, 72, 0.38], [1.65, 74, 0.29], [2.03, 72, 0.90]]],
    ["dm7",     [38, 45], 7],
    ["gm9",     [43, 50], 8, [[0.65, 67, 0.30], [1.02, 70, 0.63], [2.64, 69, 0.53]]],
    ["c13",     [48, 46], 4, [[2.04, 67, 0.51], [3.65, 64, 0.31]]],
    ["am7 d7",  [45, 38], 3, [[0.66, 64, 0.53], [2.64, 66, 0.68]]],
    ["gm9",     [43, 50], 7],
    ["f6",      [41, 48], 8, [[0.66, 65, 0.35], [1.03, 69, 0.72], [2.65, 67, 0.50]]],
    ["gm7 c7",  [43, 48], 3, [[1.67, 62, 0.28], [2.02, 64, 0.73]]],
    ["bb",      [46, 41], 4, [[1.64, 65, 0.28], [2.02, 69, 0.80]]],
    ["eb7",     [39, 46], 8, [[0.67, 67, 0.53], [2.67, 65, 0.52]]],
    ["fm7a",    [45, 41], 4, [[1.65, 64, 0.34], [2.03, 67, 0.79]]],
    ["d7",      [38, 45], 7],
    ["gm9",     [43, 50], 8, [[0.65, 62, 0.28], [1.03, 65, 0.55], [2.64, 69, 0.52]]],
    ["c13",     [48, 46], 4, [[0.67, 67, 0.54], [2.03, 64, 0.70]]],
    ["f6",      [41, 48], 4, [[1.03, 65, 1.05], [2.65, 62, 0.63]]],
    ["gm7 c13", [43, 48], 3, [[3.64, 67, 0.26]]],
  ];

  let musicWaveContext;
  let pianoWave;
  let softPianoWave;
  let bassWave;

  function getMusicWaves() {
    if (musicWaveContext !== ctx) {
      musicWaveContext = ctx;
      const makeWave = (partials) => ctx.createPeriodicWave(
        new Float32Array(partials.length),
        new Float32Array(partials)
      );
      pianoWave = makeWave([0, 1, 0.38, 0.28, 0.18, 0.07, 0.054, 0.018]);
      softPianoWave = makeWave([0, 1, 0.24, 0.14, 0.065, 0.029]);
      bassWave = makeWave([0, 1, 0.49, 0.20, 0.11, 0.05, 0.02, 0.01]);
    }
  }

  function musicHz(note) {
    return 440 * 2 ** ((note - 69) / 12);
  }

  function playMusicTone(bus, wave, frequency, time, stopTime, stops, glideTo) {
    const source = ctx.createOscillator();
    const envelope = ctx.createGain();
    source.setPeriodicWave(wave);
    source.frequency.setValueAtTime(frequency, time);
    if (glideTo) {
      source.frequency.exponentialRampToValueAtTime(glideTo, time + 0.055);
    }
    envelope.gain.setValueAtTime(0.00005, time);
    for (const [offset, level] of stops) {
      envelope.gain.exponentialRampToValueAtTime(level, time + offset);
    }
    source.connect(envelope);
    envelope.connect(bus);
    source.onended = () => {
      source.disconnect();
      envelope.disconnect();
    };
    source.start(time);
    source.stop(time + stopTime);
  }

  function playPiano(bus, note, time, length, level, soft) {
    const frequency = musicHz(note);
    playMusicTone(bus, soft ? softPianoWave : pianoWave, frequency, time, length + 0.083,
      [[0.006, level], [0.058, level * 0.53],
        [length, level * 0.18], [length + 0.080, 0.00005]]);
  }

  function playWalkingBass(bus, note, time, length, level) {
    const frequency = musicHz(note);
    playMusicTone(bus, bassWave, frequency * 1.008, time, length + 0.047,
      [[0.012, level], [0.072, level * 0.64], [length, level * 0.16],
        [length + 0.045, 0.00005]], frequency);
  }

  function playBrush(bus, time, length, level, offset, frequency) {
    const source = ctx.createBufferSource();
    const color = ctx.createBiquadFilter();
    const envelope = ctx.createGain();
    source.buffer = noiseBuffer();
    color.type = "bandpass";
    color.frequency.value = frequency;
    color.Q.value = 0.69;
    envelope.gain.setValueAtTime(0.00005, time);
    envelope.gain.exponentialRampToValueAtTime(level, time + 0.022);
    envelope.gain.exponentialRampToValueAtTime(level * 0.54, time + length * 0.53);
    envelope.gain.exponentialRampToValueAtTime(0.00005, time + length);
    source.connect(color);
    color.connect(envelope);
    envelope.connect(bus);
    source.onended = () => {
      source.disconnect();
      color.disconnect();
      envelope.disconnect();
    };
    source.start(time, offset, length + 0.003);
  }

  function scheduleMusicBeat(bus, style, beatIndex, time) {
    getMusicWaves();
    const inMatch = style === "match";
    const chart = inMatch ? MATCH_CHART : LOBBY_CHART;
    const beatLength = 60 / MUSIC[style].bpm;
    const bar = Math.floor(beatIndex / 4);
    const beat = beatIndex % 4;
    const [chords, bass, pattern, lead = []] = chart[bar];
    const voicings = chords.split(" ");
    const swingSection = bar >= 8 && bar < 16;

    if (inMatch || beat % 2 === 0) {
      const note = bass[inMatch ? beat : beat / 2];
      const length = beatLength * (inMatch ? (beat === 3 ? 0.74 : 0.82) : 1.36);
      const level = inMatch ? [0.103, 0.084, 0.096, 0.082][beat] : 0.077;
      playWalkingBass(bus, note, time + 0.009, length, level);
    }

    for (const [position, length, accent] of COMPING[pattern]) {
      if (Math.floor(position) !== beat) continue;
      const voicing = PIANO_VOICINGS[voicings[position >= 2 && voicings.length > 1 ? 1 : 0]];
      for (const [index, note] of voicing.entries()) {
        const hit = time + (position - beat) * beatLength + index * 0.009;
        playPiano(bus, note, hit, length * beatLength,
          accent * (inMatch ? 0.048 : 0.040) / Math.sqrt(voicing.length / 3), !inMatch);
      }
    }

    for (const [position, note, length] of lead) {
      if (Math.floor(position) !== beat) continue;
      const hit = time + (position - beat) * beatLength;
      const level = inMatch ? (swingSection ? 0.077 : 0.098) : 0.078;
      playPiano(bus, note, hit, length * beatLength, level, !inMatch || swingSection);
    }

    if (inMatch) {
      const offset = (beatIndex * 0.173) % 0.46;
      if (beat % 2 === 1) {
        playBrush(bus, time + 0.012, swingSection ? 0.225 : 0.171, 0.116, offset, 1600);
        if ((bar + beat) % 3 !== 0) {
          playBrush(bus, time + beatLength * 0.65, 0.089, 0.049, offset, 2330);
        }
      } else {
        playBrush(bus, time + 0.007, 0.215, beat === 0 ? 0.054 : 0.063, offset, 1040);
      }
    }
  }

  // Time, melody, and the piano voicing under that note (MIDI note numbers).
  const JINGLES = {
    win: [
      [0.00, 66, [50, 57, 61]], [0.20, 69], [0.34, 71, [47, 57, 62]],
      [0.52, 74], [0.71, 76, [45, 55, 61]], [0.92, 78, [50, 57, 59, 64]],
    ],
    lose: [
      [0.00, 69, [50, 57, 65]], [0.23, 65], [0.41, 64, [46, 53, 60]],
      [0.66, 62], [0.95, 57, [50, 53, 59, 64]],
    ],
    draw: [
      [0.00, 65, [48, 55, 58]], [0.24, 67], [0.43, 69, [53, 60, 63]],
      [0.68, 67], [0.92, 65, [53, 57, 62, 67]],
    ],
  };

  function jinglePiano(output, midi, time, duration, volume, bright) {
    const frequency = 440 * 2 ** ((midi - 69) / 12);
    const envelope = ctx.createGain();
    const body = ctx.createOscillator();
    const color = ctx.createOscillator();
    const colorGain = ctx.createGain();
    body.type = 'sine';
    body.frequency.value = frequency;
    color.type = 'triangle';
    color.frequency.value = frequency * 2.003;
    colorGain.gain.setValueAtTime(bright, time);
    colorGain.gain.exponentialRampToValueAtTime(0.003, time + duration * 0.75);
    body.connect(envelope);
    color.connect(colorGain).connect(envelope);
    envelope.connect(output);
    const gain = envelope.gain;
    gain.setValueAtTime(0, time);
    gain.linearRampToValueAtTime(volume, time + 0.008);
    gain.exponentialRampToValueAtTime(volume * 0.30, time + duration * 0.35);
    gain.exponentialRampToValueAtTime(0.0001, time + duration);
    body.start(time);
    color.start(time);
    body.stop(time + duration);
    color.stop(time + duration);
    body.onended = () => {
      body.disconnect();
      color.disconnect();
      colorGain.disconnect();
      envelope.disconnect();
    };
  }

  function scheduleJingle(output, name, time) {
    const phrase = JINGLES[name];
    phrase.forEach(([offset, melody, voicing], index) => {
      const at = time + offset;
      const finalNote = index === phrase.length - 1;
      const volume = name === 'lose' ? 0.098 : 0.112;
      jinglePiano(output, melody, at, finalNote ? 0.56 : 0.28, volume, 0.24);
      if (voicing) {
        voicing.forEach((midi, voice) => {
          jinglePiano(output, midi, at + voice * 0.009,
            finalNote ? 0.48 : 0.32, voice === 0 ? 0.071 : 0.034, 0.10);
        });
      }
    });
  }

  function effectEnvelope(gain, time, duration, level, attack) {
    gain.setValueAtTime(0, time);
    gain.linearRampToValueAtTime(level, time + attack);
    gain.exponentialRampToValueAtTime(0.0001, time + duration - 0.004);
    gain.linearRampToValueAtTime(0, time + duration);
  }

  function effectTone(bus, time, duration, frequency, level, endFrequency = frequency, attack = 0.004) {
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    oscillator.frequency.setValueAtTime(frequency, time);
    if (frequency !== endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, time + duration);
    }
    effectEnvelope(envelope.gain, time, duration, level, attack);
    oscillator.connect(envelope);
    envelope.connect(bus);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
    oscillator.start(time);
    oscillator.stop(time + duration);
  }

  function effectNoise(bus, time, duration, startFrequency, endFrequency, width, level, attack = 0.004) {
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const envelope = ctx.createGain();
    source.buffer = noiseBuffer();
    filter.type = "bandpass";
    filter.Q.value = width;
    filter.frequency.setValueAtTime(startFrequency, time);
    filter.frequency.exponentialRampToValueAtTime(endFrequency, time + duration);
    effectEnvelope(envelope.gain, time, duration, level, attack);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(bus);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      envelope.disconnect();
    };
    const offset = Math.random() * Math.max(0, source.buffer.duration - duration);
    source.start(time, offset, duration);
  }

  function effectWood(bus, time, pitch, level) {
    effectTone(bus, time, 0.066, pitch, level, pitch * 0.8);
    effectTone(bus, time, 0.034, pitch * 1.93, level * 0.35);
    effectNoise(bus, time, 0.042, pitch * 4.3, pitch * 2.7, 0.65, level * 0.9);
  }

  function effectPaper(bus, time, duration, level) {
    effectNoise(bus, time, duration, 1120, 2440, 0.68, level, 0.008);
    effectNoise(bus, time + duration * 0.26, duration * 0.57, 2460, 1050, 0.82, level * 0.68, 0.005);
  }

  function effectNote(bus, time, pitch, level, duration) {
    effectTone(bus, time, duration, pitch, level, pitch, 0.008);
    effectTone(bus, time, duration * 0.47, pitch * 2.01, level * 0.23, pitch * 2.01, 0.005);
  }

  function effectNumberSlide(bus, time, start, end) {
    const source = ctx.createOscillator();
    const envelope = ctx.createGain();
    source.type = 'triangle';
    source.frequency.setValueAtTime(start, time);
    source.frequency.exponentialRampToValueAtTime(start * (end / start) ** 0.28, time + 0.023);
    source.frequency.exponentialRampToValueAtTime(end, time + 0.081);

    const gain = envelope.gain;
    gain.setValueAtTime(0, time);
    gain.linearRampToValueAtTime(0.125, time + 0.010);
    gain.exponentialRampToValueAtTime(0.085, time + 0.058);
    gain.exponentialRampToValueAtTime(0.043, time + 0.092);
    gain.exponentialRampToValueAtTime(0.0001, time + 0.155);
    source.connect(envelope);
    envelope.connect(bus);
    source.onended = () => {
      source.disconnect();
      envelope.disconnect();
    };
    source.start(time);
    source.stop(time + 0.155);
    effectNoise(bus, time, 0.034, 1120, 700, 0.8, 0.058, 0.008);
  }

  const EFFECTS = {
    put(bus, time) {
      if (playSample('put', bus, time)) return;
      effectWood(bus, time, 251, 0.132);
      effectNoise(bus, time + 0.006, 0.054, 1380, 590, 0.6, 0.16);
    },
    flip(bus, time) {
      if (playSample('flip', bus, time)) return;
      effectPaper(bus, time, 0.105, 0.31);
      effectNoise(bus, time + 0.034, 0.063, 670, 390, 0.7, 0.19);
    },
    up(bus, time) {
      effectNumberSlide(bus, time, 339, 638);
    },
    down(bus, time) {
      effectNumberSlide(bus, time, 568, 297);
    },
    miss(bus, time) {
      effectWood(bus, time, 156, 0.047);
    },
    chain(bus, time) {
      effectNote(bus, time, 392, 0.093, 0.11);
      effectNote(bus, time + 0.047, 493.88, 0.10, 0.12);
      effectNote(bus, time + 0.097, 659.25, 0.115, 0.183);
      effectNote(bus, time + 0.097, 329.63, 0.043, 0.144);
    },
    guard(bus, time) {
      effectTone(bus, time, 0.110, 306, 0.11, 298);
      effectTone(bus, time, 0.049, 708, 0.059);
      effectTone(bus, time + 0.003, 0.069, 1116, 0.025);
      effectNoise(bus, time, 0.047, 1250, 535, 0.85, 0.086);
    },
    curse(bus, time) {
      effectTone(bus, time, 0.245, 199, 0.116, 154, 0.014);
      effectTone(bus, time + 0.011, 0.225, 218, 0.062, 161, 0.017);
      effectTone(bus, time + 0.012, 0.147, 321, 0.031, 236, 0.015);
      effectNoise(bus, time, 0.145, 550, 225, 0.8, 0.079, 0.013);
    },
    seal(bus, time) {
      effectTone(bus, time, 0.15, 505, 0.119, 258, 0.015);
      effectTone(bus, time + 0.008, 0.099, 827, 0.035, 356, 0.012);
      effectNoise(bus, time + 0.042, 0.109, 850, 305, 0.65, 0.14, 0.014);
    },
    gamble(bus, time) {
      effectWood(bus, time, 218, 0.106);
      effectWood(bus, time + 0.071, 293, 0.110);
      effectWood(bus, time + 0.133, 248, 0.093);
      effectWood(bus, time + 0.181, 328, 0.078);
      effectWood(bus, time + 0.217, 265, 0.062);
      effectNoise(bus, time + 0.019, 0.196, 1080, 640, 0.65, 0.105, 0.017);
    },
    coin(bus, time) {
      if (playSample('coin', bus, time)) return;
      effectTone(bus, time, 0.212, 524, 0.117, 520, 0.005);
      effectTone(bus, time + 0.002, 0.141, 907, 0.047);
      effectTone(bus, time + 0.003, 0.064, 1560, 0.028);
      effectTone(bus, time + 0.104, 0.134, 781, 0.084);
      effectTone(bus, time + 0.105, 0.070, 1194, 0.029);
    },
    deal(bus, time) {
      if (playSample('deal', bus, time)) return;
      effectPaper(bus, time, 0.079, 0.22);
      effectPaper(bus, time + 0.063, 0.078, 0.23);
      effectPaper(bus, time + 0.122, 0.09, 0.26);
      effectWood(bus, time + 0.157, 242, 0.065);
    },
    ready(bus, time) {
      effectNote(bus, time, 329.63, 0.114, 0.121);
      effectNote(bus, time + 0.059, 440, 0.106, 0.173);
      effectNote(bus, time + 0.061, 554.37, 0.055, 0.162);
      effectNoise(bus, time, 0.047, 680, 430, 0.8, 0.064);
    },
    tap(bus, time) {
      if (playSample('tap', bus, time)) return;
      effectWood(bus, time, 389, 0.094);
      effectNoise(bus, time, 0.041, 1290, 880, 0.75, 0.105);
    },
  };

  function bus(destination, level) {
    const gain = ctx.createGain();
    gain.gain.value = level;
    gain.connect(destination);
    return gain;
  }

  function createAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    ctx = new AudioContext();
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.knee.value = 12;
    limiter.ratio.value = 8;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.12;
    limiter.connect(ctx.destination);
    master = bus(limiter, enabled ? 0.86 : 0);
    musicBus = bus(master, MUSIC_LEVEL);
    foreground = bus(master, 1);
    if (enabled) effectsBus = bus(foreground, 1);
    ctx.addEventListener('statechange', syncAudio);
    loadSamples();
  }

  function fadeOut(node, timeConstant) {
    const now = ctx.currentTime;
    node.gain.cancelScheduledValues(now);
    node.gain.setTargetAtTime(0, now, timeConstant);
    window.setTimeout(() => node.disconnect(), Math.ceil(timeConstant * 8000));
  }

  function stopPump() {
    if (timer === null) return;
    window.clearInterval(timer);
    timer = null;
  }

  function pump() {
    if (!track || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    const { style, step, beats, output } = track;
    // If the tab was throttled, keep the beat and skip expired notes.
    const skipped = Math.max(0, Math.ceil((now - track.next) / step));
    track.next += skipped * step;
    track.beat = (track.beat + skipped) % beats;

    while (track.next < now + LOOKAHEAD) {
      scheduleMusicBeat(output, style, track.beat, track.next);
      track.beat = (track.beat + 1) % beats;
      track.next += step;
    }
  }

  function updateMusic() {
    const style = enabled ? desiredMusic : null;
    if (track && track.style !== style) {
      fadeOut(track.output, 0.12);
      track = null;
    }
    if (style && ctx.state === 'running' && !track) {
      const start = ctx.currentTime + 0.035;
      const { bpm, bars } = MUSIC[style];
      const output = bus(musicBus, 0);
      output.gain.setTargetAtTime(1, start, 0.115);
      track = { style, step: 60 / bpm, beats: bars * 4, output, next: start, beat: 0 };
    }
    if (!track || ctx.state !== 'running') {
      stopPump();
    } else if (timer === null) {
      pump();
      timer = window.setInterval(pump, PUMP_INTERVAL);
    }
  }

  function syncAudio() {
    if (!ctx) return;
    if (ctx.state !== 'running') {
      stopPump();
      return;
    }
    unlocked = true;
    updateMusic();
    for (const event of pending.splice(0)) {
      if (enabled && Date.now() - event.when < 400) event.play(event.name);
    }
  }

  function resumeAudio() {
    if (!ctx || ctx.state === 'closed') return;
    if (ctx.state === 'running') {
      syncAudio();
      return;
    }
    resumeRequested = true;
    ctx.resume().then(syncAudio, () => {});
  }

  function onGesture(event) {
    if (!event.isTrusted) return;
    try {
      if (!ctx) createAudio();
      resumeAudio();
    } catch (_) {
      // A later gesture can try again if the audio device is unavailable.
    }
  }

  function playEffect(name) {
    let time = ctx.currentTime + 0.008;
    if (name === 'flip') {
      // Same-frame captures stay individually audible without peaking together.
      if (nextFlip > time + 0.19) return;
      time = Math.max(time, nextFlip);
      nextFlip = time + 0.024;
    }
    EFFECTS[name](effectsBus, time);
  }

  function duckMusic(level, time, restoreAt) {
    const gain = musicBus.gain;
    gain.cancelScheduledValues(time);
    gain.setTargetAtTime(MUSIC_LEVEL * level, time, 0.028);
    if (restoreAt !== undefined) {
      gain.setTargetAtTime(MUSIC_LEVEL, restoreAt, 0.15);
    }
  }

  function stopJingle() {
    if (!jingleVoice) return;
    window.clearTimeout(jingleVoice.timer);
    fadeOut(jingleVoice.output, 0.018);
    jingleVoice = null;
  }

  function playJingle(name) {
    stopJingle();
    const now = ctx.currentTime;
    const start = now + 0.012;
    const output = bus(foreground, 1);
    duckMusic(0.28, now, start + JINGLE_LENGTH);
    scheduleJingle(output, name, start);
    jingleVoice = {
      output,
      timer: window.setTimeout(() => {
        output.disconnect();
        jingleVoice = null;
      }, (JINGLE_LENGTH + 0.25) * 1000),
    };
  }

  function playWhenReady(play, name) {
    if (!enabled || !ctx) return;
    if (ctx.state === 'running') {
      if (pending.length) syncAudio();
      play(name);
    } else if (resumeRequested && pending.length < 20) {
      pending.push({ play, name, when: Date.now() });
    }
  }

  function toggle() {
    enabled = !enabled;
    try {
      window.localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
    } catch (_) {
      // The in-memory setting also works when localStorage is unavailable.
    }
    if (ctx) {
      const now = ctx.currentTime;
      master.gain.setTargetAtTime(enabled ? 0.86 : 0, now, 0.012);
      if (enabled) {
        effectsBus = bus(foreground, 1);
      } else {
        pending.length = 0;
        nextFlip = 0;
        fadeOut(effectsBus, 0.01);
        effectsBus = null;
        stopJingle();
        duckMusic(1, now);
      }
      updateMusic();
    }
    return enabled;
  }

  window.FUDA_SND = {
    bgm(style) {
      if (style !== null && !has(MUSIC, style)) return;
      desiredMusic = style;
      if (ctx) updateMusic();
    },
    jingle(name) {
      if (has(JINGLES, name)) playWhenReady(playJingle, name);
    },
    se(name) {
      if (has(EFFECTS, name)) playWhenReady(playEffect, name);
    },
    toggle,
    isOn() { return enabled; },
  };

  for (const type of RESUME_EVENTS) {
    window.addEventListener(type, onGesture, true);
  }
  document.addEventListener('visibilitychange', () => {
    if (unlocked && document.visibilityState === 'visible') resumeAudio();
  });
})();
