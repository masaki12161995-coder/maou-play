const scores = {
  title: {
    bpm: 65, meter: 4, lead: 'bell', pad: 'bow', pulse: 'harp', pattern: [0, 2.5],
    chords: [[45,52,55,59], [41,48,52,55], [48,55,59,62], [47,54,57,62], [45,52,55,60], [43,50,53,59], [41,48,52,60], [40,47,50,57]],
    theme: [
      [[0,1.5,69],[2.5,.5,67],[3,1,64]], [[1,2.5,60]], [[0,1,67],[1.5,.5,71],[2.5,1.4,74]], [[1,2.6,69]],
      [[0,2,72],[2.5,.5,76],[3,1,74]], [[0,1.6,71],[3,.7,67]], [[0,2.2,69],[3,.8,64]], [[1,1,62],[2,1.8,64]]
    ]
  },
  town: {
    bpm: 115, meter: 3, lead: 'reed', pad: 'breath', pulse: 'harp', pattern: [0, 1, 2, 2.5],
    chords: [[48,55,59,64], [45,52,55,60], [41,48,52,57], [43,50,57,59], [48,55,57,64], [47,54,57,62], [41,48,52,57], [43,50,57,62]],
    theme: [
      [[0,.9,64],[1,.48,67],[1.5,.4,69],[2,1,71]], [[0,1,72],[1.5,.48,67],[2,.8,64]], [[0,.8,65],[1,.8,69],[2,1,72]], [[0,1.3,74],[1.5,.35,69],[2,1,67]],
      [[0,1.2,76],[1.5,.4,74],[2,.9,72]], [[0,.75,71],[1,.9,69],[2,.9,66]], [[0,1,69],[1.5,.45,65],[2,.9,64]], [[0,1,62],[1,.8,67],[2,.9,64]]
    ]
  },
  field: {
    bpm: 88, meter: 4, lead: 'reed', pad: 'bow', pulse: 'harp', pattern: [0, .5, 1.5, 2, 3, 3.5],
    chords: [[50,57,60,64], [45,52,55,60], [48,55,62,64], [43,50,57,59], [50,57,60,65], [41,48,55,57], [43,50,53,59], [45,52,55,60]],
    theme: [
      [[0,1.15,62],[1.5,.48,65],[2,.85,69],[3,.48,67],[3.5,.45,65]], [[0,1.6,64],[2,.85,60],[3,.9,64]], [[0,.95,67],[1,.95,69],[2,1.45,72],[3.5,.35,71]], [[0,2.55,69],[3,.9,67]],
      [[0,1,74],[1.5,.45,72],[2,1.4,69],[3.5,.4,65]], [[0,1.8,72],[2,.85,69],[3,.85,65]], [[0,.95,67],[1,.45,65],[1.5,.45,67],[2,1.65,71]], [[0,1.8,69],[2,.8,64],[3,.92,62]]
    ]
  },
  dungeon: {
    bpm: 64, meter: 4, lead: 'bell', pad: 'bow', pulse: 'breath', pattern: [0, 2.5],
    chords: [[38,45,51,57], [38,45,48,54], [41,48,51,57], [40,47,51,58], [38,45,51,58], [42,48,54,57], [39,46,49,57], [38,44,51,55]],
    theme: [
      [[0,1.2,74],[2.5,.25,75]], [[1,1.6,69]], [[0,1.2,72],[2,.45,69]], [[1.5,1.6,70]],
      [[0,1.1,81],[3,.4,75]], [[1,.72,78],[2.5,1.1,69]], [[.5,1.5,73]], [[2,.65,63]]
    ]
  },
  battle: {
    bpm: 146, meter: 4, lead: 'reed', pad: 'brass', pulse: 'bow', pattern: [0, .5, 1, 1.75, 2, 2.5, 3, 3.5], rhythm: 'battle',
    chords: [[45,52,57,60], [41,48,53,57], [48,55,60,64], [43,50,55,59], [45,52,57,60], [46,53,58,62], [41,48,53,57], [40,47,52,56]],
    theme: [
      [[0,1,69],[1,.45,72],[1.5,.45,76],[2,.95,74],[3,.45,72],[3.5,.45,69]], [[0,.9,65],[1,.45,69],[1.5,.45,72],[2,1.5,77],[3.5,.45,76]], [[0,.95,79],[1,.96,76],[2,.42,74],[2.5,.45,72],[3,.85,67]], [[0,1.2,71],[1.5,.4,69],[2,.75,67],[3,.75,64]],
      [[0,.9,81],[1,.4,76],[1.5,.43,79],[2,1.4,81],[3.5,.35,79]], [[0,.7,77],[1,.82,74],[2,.4,77],[2.5,.4,76],[3,.7,74]], [[0,.9,72],[1,.45,69],[1.5,.45,72],[2,1.4,77],[3.5,.45,74]], [[0,.8,71],[1,.85,68],[2,1.6,76]]
    ]
  },
  boss: {
    bpm: 128, meter: 3, lead: 'brass', pad: 'bow', pulse: 'bow', pattern: [0, .5, 1, 1.5, 2, 2.5], rhythm: 'boss',
    chords: [[38,45,53,57], [39,46,55,58], [38,45,51,57], [37,44,52,55], [34,41,50,53], [39,46,51,55], [42,49,54,57], [45,52,55,61]],
    theme: [
      [[0,1.1,62],[1.5,.4,69],[2,.85,65]], [[0,.75,67],[1,.75,70],[2,.9,75]], [[0,1.25,74],[1.5,.4,69],[2,.72,63]], [[0,.9,64],[1.5,1.2,61]],
      [[0,1.1,70],[1.5,.45,74],[2,.85,77]], [[0,1,79],[1,.8,75],[2,.8,70]], [[0,.8,69],[1,.85,73],[2,.85,78]], [[0,1.9,81],[2,.45,76],[2.5,.43,73]]
    ]
  },
  tragedy: {
    bpm: 56, meter: 4, lead: 'harp', pad: 'bow', pulse: 'breath', pattern: [0, 2],
    chords: [[45,52,55,59], [41,48,52,57], [40,47,55,59], [38,45,48,53], [45,52,55,60], [41,48,52,57], [43,50,53,58], [40,47,50,55]],
    theme: [
      [[.5,1.8,69],[2.75,1,67]], [[0,2.2,64],[3,.85,60]], [[1,1.8,71],[3,.85,67]], [[0,2.6,65]],
      [[0,1.8,72],[2.5,1,71]], [[0,2,69],[3,.8,64]], [[.5,1.8,67],[2.5,1.2,65]], [[1,2.7,64]]
    ]
  },
  ending: {
    bpm: 80, meter: 4, lead: 'harp', pad: 'bow', pulse: 'harp', pattern: [0, .5, 1.5, 2.5, 3.5],
    chords: [[45,52,55,60], [41,48,52,57], [48,55,59,64], [47,54,57,62], [45,52,55,60], [43,50,53,59], [41,48,52,57], [40,47,53,59]],
    theme: [
      [[0,1.5,69],[2.5,.5,67],[3,1,64]], [[0,1.8,60],[2.5,1.4,65]], [[0,.95,67],[1.5,.45,71],[2.5,1.4,76]], [[0,1.5,74],[2,1.7,69]],
      [[0,1.9,72],[2.5,.45,76],[3,.95,81]], [[0,1.65,79],[2,.8,76],[3,.85,71]], [[0,1.45,69],[2,.9,64],[3,.85,65]], [[0,1.5,71],[2,1.7,65]]
    ]
  }
};

const timbres = {
  harp:   { partials: [1,.59,.17,.22,.065,.029,.033], attack: .007, sustain: .16, release: .22 },
  bell:   { partials: [1,.05,.47,.08,.24,.06,.12,0,.035], attack: .005, sustain: .12, release: .7 },
  reed:   { partials: [1,.18,.32,.08,.105,.027,.039], attack: .065, sustain: .64, release: .12 },
  bow:    { partials: [1,.44,.29,.17,.11,.07,.056,.04], attack: .11, sustain: .76, release: .3 },
  brass:  { partials: [1,.62,.43,.2,.12,.093,.072,.051,.016], attack: .055, sustain: .58, release: .14 },
  breath: { partials: [1,.25,.079,.032], attack: .16, sustain: .84, release: .43 },
  bass:   { partials: [1,.36,.11,.041], attack: .018, sustain: .57, release: .16 }
};

const hz = midi => 440 * 2 ** ((midi - 69) / 12);
const quiet = .0001;
const level = value => Math.max(0, Math.min(1, Number(value) || 0));

function randomSource(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2147483648 - 1;
  };
}

export function createAudio() {
  let context, music, effects, waves, noise, timer;
  let sceneName = 'title';
  let track, nextTime = 0, bar = 0;
  let bgmVolume = .68, sfxVolume = .76;

  function gain(value, parent) {
    const node = context.createGain();
    node.gain.value = value;
    node.connect(parent);
    return node;
  }

  function initialize(AudioContext) {
    context = new AudioContext();
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -14;
    limiter.knee.value = 20;
    limiter.ratio.value = 4;
    limiter.connect(context.destination);
    music = gain(bgmVolume, limiter);
    effects = gain(sfxVolume, limiter);

    const room = context.createConvolver();
    const roomMix = gain(.21, limiter);
    const roomLength = Math.floor(context.sampleRate * 1.3);
    const impulse = context.createBuffer(2, roomLength, context.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      const random = randomSource(1904 + channel * 7);
      const delay = Math.floor(context.sampleRate * (.011 + channel * .008));
      let floor = 0;
      for (let i = delay; i < roomLength; i++) {
        floor = floor * .72 + random() * .28;
        data[i] = floor * (1 - i / roomLength) ** 3.4;
      }
    }
    room.buffer = impulse;
    music.connect(room);
    room.connect(roomMix);

    noise = context.createBuffer(1, Math.floor(context.sampleRate * .8), context.sampleRate);
    const random = randomSource(9181);
    const samples = noise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = random();
    waves = Object.fromEntries(Object.entries(timbres).map(([key, voice]) => {
      return [key, context.createPeriodicWave(new Float32Array(voice.partials.length + 1), Float32Array.from([0, ...voice.partials]))];
    }));

    context.onstatechange = refreshSchedule;
    changeTrack();
  }

  function unlock() {
    if (!context) {
      const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AudioContext) return;
      initialize(AudioContext);
    }
    if (context.state !== 'running' && context.state !== 'closed') {
      context.resume().then(refreshSchedule).catch(() => {});
    } else {
      refreshSchedule();
    }
  }

  function changeTrack() {
    if (!context) return;
    const now = context.currentTime;
    if (track) {
      const previous = track;
      previous.gain.cancelScheduledValues(now);
      previous.gain.setTargetAtTime(quiet, now, .16);
      setTimeout(() => previous.disconnect(), 1200);
    }
    const score = scores[sceneName];
    track = score ? gain(quiet, music) : undefined;
    if (track) track.gain.setTargetAtTime(1, now + .018, .1);
    nextTime = now + .028;
    bar = 0;
    refreshSchedule();
  }

  function refreshSchedule() {
    if (track && bgmVolume > 0 && context.state === 'running') {
      schedule();
      if (!timer) timer = setInterval(schedule, 90);
    } else if (timer) {
      clearInterval(timer);
      timer = undefined;
    }
  }

  function scene(name) {
    if (name === sceneName || (name !== 'silence' && !Object.hasOwn(scores, name))) return;
    sceneName = name;
    changeTrack();
  }

  function volume(bgm, sfx) {
    bgmVolume = level(bgm);
    sfxVolume = level(sfx);
    if (context) {
      const now = context.currentTime;
      music.gain.setTargetAtTime(bgmVolume, now, .026);
      effects.gain.setTargetAtTime(sfxVolume, now, .022);
      refreshSchedule();
    }
  }

  function note(voice, midi, time, length, loudness, parent, detune = 0) {
    const osc = context.createOscillator();
    const profile = timbres[voice];
    osc.setPeriodicWave(waves[voice]);
    osc.frequency.value = hz(midi);
    osc.detune.value = detune;
    const envelope = gain(quiet, parent);
    const rise = Math.min(profile.attack, length * .26);
    envelope.gain.setValueAtTime(quiet, time);
    envelope.gain.exponentialRampToValueAtTime(loudness, time + rise);
    envelope.gain.exponentialRampToValueAtTime(Math.max(quiet, loudness * profile.sustain), time + length);
    envelope.gain.exponentialRampToValueAtTime(quiet, time + length + profile.release);
    osc.connect(envelope);
    osc.start(time);
    osc.stop(time + length + profile.release + .015);
    osc.onended = () => { osc.disconnect(); envelope.disconnect(); };
  }

  function sweep(from, to, time, length, loudness, parent, type = 'sine') {
    const oscillator = context.createOscillator();
    const envelope = gain(quiet, parent);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, time);
    oscillator.frequency.exponentialRampToValueAtTime(to, time + length);
    envelope.gain.setValueAtTime(quiet, time);
    envelope.gain.exponentialRampToValueAtTime(loudness, time + Math.min(.017, length * .2));
    envelope.gain.exponentialRampToValueAtTime(quiet, time + length);
    oscillator.connect(envelope);
    oscillator.start(time);
    oscillator.stop(time + length + .015);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
  }

  function rush(from, to, time, length, loudness, parent, type = 'bandpass', resonance = .8, swell = .013) {
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = gain(quiet, parent);
    source.buffer = noise;
    filter.type = type;
    filter.Q.value = resonance;
    filter.frequency.setValueAtTime(from, time);
    filter.frequency.exponentialRampToValueAtTime(to, time + length);
    envelope.gain.setValueAtTime(quiet, time);
    envelope.gain.exponentialRampToValueAtTime(loudness, time + Math.min(swell, length * .84));
    envelope.gain.exponentialRampToValueAtTime(quiet, time + length);
    source.connect(filter);
    filter.connect(envelope);
    source.start(time);
    source.stop(time + length + .015);
    source.onended = () => { source.disconnect(); filter.disconnect(); envelope.disconnect(); };
  }

  function drum(kind, time, loudness, parent) {
    if (kind === 'low') {
      sweep(94, 32, time, .28, loudness, parent);
      rush(200, 70, time, .13, loudness * .65, parent, 'lowpass');
    } else if (kind === 'wood') {
      sweep(330, 166, time, .094, loudness * .54, parent, 'triangle');
      rush(1130, 440, time, .085, loudness, parent, 'bandpass', 1.7);
    } else {
      rush(6110, 3870, time, .085, loudness, parent, 'highpass');
    }
  }

  function playBar(score, phraseBar, time) {
    const beat = 60 / score.bpm;
    const chord = score.chords[phraseBar % score.chords.length];
    const fast = Boolean(score.rhythm);
    const length = score.meter * beat;
    const countermelody = phraseBar >= score.theme.length;

    for (const pitch of chord.slice(1)) {
      note(score.pad, pitch, time + .015, length * .9, fast ? .025 : .031, track, pitch % 2 ? -3 : 3);
    }
    note('bass', chord[0] - (chord[0] >= 45 ? 12 : 0), time, length * (fast ? .41 : .81), fast ? .104 : .072, track);
    if (fast) note('bass', chord[0] - (chord[0] >= 45 ? 12 : 0), time + length * .51, length * .36, .084, track);

    for (const [i, position] of score.pattern.entries()) {
      const chordIndex = [0, 2, 1, 3, 0, 2, 3, 1][(countermelody ? i + 2 : i) % 8];
      let pitch = chord[chordIndex] + 12;
      if (fast && i % 4 === 0) pitch -= 12;
      const accent = i % 4 === 0 ? 1.15 : .84;
      note(score.pulse, pitch, time + position * beat, beat * (fast ? .35 : .68), .047 * accent, track);
    }

    for (const [start, duration, pitch] of score.theme[phraseBar % score.theme.length]) {
      const hitTime = time + start * beat;
      note(score.lead, pitch, hitTime, duration * beat, fast ? .108 : .097, track);
      if (countermelody && duration > 1.05) {
        note('bell', pitch + (pitch > 72 ? -12 : 12), hitTime + beat * .14, duration * beat * .55, .036, track, 3);
      }
    }

    if (fast) {
      drum('low', time, score.rhythm === 'boss' ? .2 : .15, track);
      drum('wood', time + beat, .11, track);
      drum('low', time + beat * 2, .115, track);
      drum('wood', time + beat * (score.meter - .5), .085, track);
      for (let i = .5; i < score.meter; i++) drum('brush', time + beat * i, .042, track);
    } else if (sceneName === 'dungeon' && phraseBar % 2 === 0) {
      drum('low', time + beat * 2, .085, track);
    }
    return length;
  }

  function schedule() {
    if (!track || context.state !== 'running') return;
    const now = context.currentTime;
    if (nextTime < now) nextTime = now + .025;
    const score = scores[sceneName];
    while (nextTime < now + .28) {
      nextTime += playBar(score, bar, nextTime);
      bar = (bar + 1) % (score.theme.length * 2);
    }
  }

  function effect(name) {
    if (!effects || sfxVolume === 0 || context.state === 'closed' || (context.state !== 'running' && context.currentTime > 0)) return;
    const time = context.currentTime + .008;
    const tone = (voice, pitch, offset, length, loudness) => note(voice, pitch, time + offset, length, loudness, effects);
    const glide = (from, to, offset, length, loudness, type) => sweep(from, to, time + offset, length, loudness, effects, type);
    const air = (from, to, offset, length, loudness, type, resonance, swell) => rush(from, to, time + offset, length, loudness, effects, type, resonance, swell);
    const phrase = (voice, pitches, spacing, duration, loudness) => {
      for (const [i, pitch] of pitches.entries()) tone(voice, pitch, i * spacing, duration, loudness * (.89 + (i % 3) * .055));
    };

    switch (name) {
      case 'click':
        tone('harp', 79, 0, .058, .125);
        glide(550, 390, 0, .042, .046, 'triangle');
        break;
      case 'step':
        air(530, 155, 0, .082, .074, 'lowpass');
        break;
      case 'attack':
        air(670, 4300, 0, .13, .34, 'bandpass', .73, .069);
        glide(320, 117, .065, .12, .19, 'triangle');
        air(3470, 1400, .07, .11, .22, 'highpass');
        break;
      case 'skill':
        phrase('bell', [69, 76, 81, 88], .042, .18, .155);
        air(520, 4550, 0, .26, .34, 'bandpass', 1.3, .15);
        break;
      case 'enemyAttack':
      case 'enemy':
        glide(225, 55, 0, .24, .255, 'triangle');
        air(870, 285, .04, .23, .32, 'bandpass', .75, .095);
        break;
      case 'hit':
        glide(165, 51, 0, .12, .238);
        air(2080, 340, 0, .14, .24, 'bandpass');
        break;
      case 'weakness':
      case 'weak':
        tone('bell', 87, 0, .19, .32);
        tone('harp', 94, .056, .17, .25);
        tone('bell', 99, .105, .19, .128);
        air(4500, 2800, 0, .13, .19, 'highpass');
        break;
      case 'break':
        air(7700, 2350, 0, .065, .68, 'highpass', .95, .009);
        glide(140, 32, 0, .56, .62);
        air(4050, 500, .026, .51, .52, 'bandpass', 1.1);
        air(7100, 2700, .091, .30, .31, 'highpass');
        phrase('bell', [97, 90, 83, 78, 71], .069, .25, .23);
        break;
      case 'boost':
        phrase('bell', [59, 64, 71, 76, 83], .059, .23, .19);
        glide(92, 520, 0, .37, .21, 'triangle');
        air(500, 3250, .016, .35, .20, 'bandpass', 1.24, .23);
        break;
      case 'heal':
        phrase('harp', [64, 69, 72, 76, 81], .055, .31, .19);
        tone('breath', 57, .05, .61, .122);
        break;
      case 'coin':
        phrase('bell', [83, 91], .07, .16, .163);
        break;
      case 'chest':
        air(610, 190, 0, .15, .19, 'lowpass');
        tone('harp', 57, .017, .21, .13);
        phrase('bell', [64, 69, 76, 79, 83], .079, .25, .16);
        break;
      case 'level':
      case 'levelUp':
        phrase('bell', [72, 76, 79, 84, 88], .092, .38, .19);
        tone('bow', 60, .236, .67, .106);
        tone('bow', 67, .298, .59, .093);
        break;
      case 'success':
        phrase('harp', [67, 72, 76], .067, .25, .165);
        break;
      case 'failure':
      case 'error':
        phrase('bow', [57, 54], .081, .18, .118);
        glide(130, 85, 0, .16, .109, 'triangle');
        break;
      case 'guard':
        tone('bell', 57, 0, .24, .195);
        air(970, 245, 0, .155, .218, 'bandpass', 1.5);
        break;
      case 'join':
        phrase('harp', [62, 67, 69, 74, 76], .10, .26, .18);
        tone('reed', 62, .326, .57, .124);
        break;
      case 'escape':
        phrase('harp', [74, 67, 62], .061, .095, .105);
        air(1700, 460, .012, .24, .171, 'bandpass', .6, .07);
        break;
      case 'transition':
        air(450, 1250, 0, .33, .12, 'bandpass', .85, .14);
        tone('bell', 67, .09, .27, .122);
        break;
      case 'fall':
        glide(152, 52, 0, .32, .18, 'triangle');
        air(730, 155, .02, .24, .22, 'lowpass');
        break;
      case 'defeat':
        phrase('bow', [61, 57, 53, 50], .174, .62, .155);
        tone('bass', 38, .47, .79, .151);
        break;
      case 'victory':
        phrase('brass', [62, 62, 67, 69, 74], .145, .26, .169);
        tone('harp', 81, .57, .71, .168);
        tone('brass', 66, .58, .61, .106);
        tone('bow', 50, .58, .61, .14);
        drum('low', time, .197, effects);
        drum('low', time + .57, .197, effects);
        break;
    }
  }

  return { unlock, scene, effect, volume };
}
