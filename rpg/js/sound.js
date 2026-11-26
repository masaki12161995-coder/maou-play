// 音：効果音とBGM。音のファイルは使わず、その場で波形を組んで鳴らす（WebAudio）
//  SND.se("名前")＝効果音、SND.bgm("town"|"battle"|null)＝曲の切り替え、SND.toggle()＝入／切
//  音は、最初に画面に触れたときから鳴る（ブラウザの決まり）
(function (root) {
"use strict";
let ac = null, master, seBus, bgmBus, wet, on = true, cur = null, want = null, timer = null;
try { on = localStorage.getItem("rpgSnd") !== "0"; } catch (e) {}

function ctx() {
  if (!ac) {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    ac = new C();
    master = ac.createGain(); master.gain.value = on ? 1 : 0; master.connect(ac.destination);
    seBus = ac.createGain(); seBus.gain.value = 0.5; seBus.connect(master);
    bgmBus = ac.createGain(); bgmBus.gain.value = 0.0; bgmBus.connect(master);
    // 残響（ノイズが消えていく形を作って、たたみこむ）。曲の音にだけ少しかける
    const len = Math.floor(ac.sampleRate * 1.8), buf = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    const cv = ac.createConvolver(); cv.buffer = buf; wet = ac.createGain(); wet.gain.value = 0.22; wet.connect(cv); cv.connect(bgmBus);
  }
  if (ac.state === "suspended") ac.resume();
  return ac;
}
const unlock = () => { if (!ctx()) return; if (want !== cur) startBgm(want); };
["pointerdown", "touchend", "click", "keydown"].forEach(ev => addEventListener(ev, unlock, true));

// ---------- 音の部品 ----------
function env(g, t, a, d, v, r) { // 立ち上がり a、長さ d、大きさ v、消え際 r
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a);
  g.gain.setValueAtTime(v, t + Math.max(a, d - r)); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.02);
}
function tone(bus, t, f, d, o) {
  o = o || {};
  const os = ac.createOscillator(), g = ac.createGain();
  os.type = o.type || "sine"; os.frequency.setValueAtTime(f, t);
  if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + d);
  if (o.det) os.detune.value = o.det;
  env(g, t, o.a || 0.005, d, o.v || 0.3, o.r || Math.min(0.08, d * 0.6));
  let out = g;
  if (o.lp) { const fl = ac.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = o.lp; g.connect(fl); out = fl; }
  os.connect(g); out.connect(bus); if (o.wet) out.connect(wet);
  os.start(t); os.stop(t + d + 0.05);
  return os;
}
let nbuf = null;
function noise(bus, t, d, o) {
  o = o || {};
  if (!nbuf) { nbuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const dd = nbuf.getChannelData(0); for (let i = 0; i < dd.length; i++) dd[i] = Math.random() * 2 - 1; }
  const s = ac.createBufferSource(), g = ac.createGain(), fl = ac.createBiquadFilter();
  s.buffer = nbuf; s.loop = true; fl.type = o.type || "lowpass"; fl.frequency.setValueAtTime(o.f || 2000, t);
  if (o.to) fl.frequency.exponentialRampToValueAtTime(o.to, t + d);
  if (o.q) fl.Q.value = o.q;
  env(g, t, o.a || 0.003, d, o.v || 0.3, o.r || d * 0.7);
  s.connect(fl); fl.connect(g); g.connect(bus); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.05);
}

// ---------- 効果音 ----------
const SE = {
  tap: t => tone(seBus, t, 920, 0.05, { type: "triangle", v: 0.22, to: 700 }),
  page: t => tone(seBus, t, 1250, 0.035, { v: 0.12 }),
  ok: t => { tone(seBus, t, 660, 0.07, { type: "triangle", v: 0.25 }); tone(seBus, t + 0.06, 990, 0.1, { type: "triangle", v: 0.25 }); },
  cancel: t => tone(seBus, t, 460, 0.1, { type: "triangle", v: 0.22, to: 300 }),
  // 当たったときの音（属性ごと）
  hit_斬: t => { noise(seBus, t, 0.13, { type: "highpass", f: 6500, to: 1600, v: 0.45 }); tone(seBus, t, 340, 0.08, { type: "sawtooth", v: 0.12, to: 130, lp: 1800 }); },
  hit_打: t => { tone(seBus, t, 150, 0.16, { v: 0.6, to: 48 }); noise(seBus, t, 0.07, { f: 900, v: 0.35 }); },
  hit_突: t => { noise(seBus, t, 0.05, { type: "bandpass", f: 3200, q: 1.2, v: 0.5 }); tone(seBus, t, 980, 0.06, { type: "square", v: 0.1, to: 420, lp: 2600 }); tone(seBus, t + 0.01, 190, 0.07, { v: 0.3, to: 90 }); },
  hit_熱: t => { noise(seBus, t, 0.32, { f: 420, to: 2400, v: 0.62, a: 0.02 }); tone(seBus, t, 110, 0.25, { type: "sawtooth", v: 0.12, to: 60, lp: 500 }); },
  hit_冷: t => { [2100, 2800, 3540].forEach((f, i) => tone(seBus, t + i * 0.035, f, 0.16, { v: 0.14 })); noise(seBus, t, 0.08, { type: "highpass", f: 5000, v: 0.2 }); },
  hit_雷: t => { noise(seBus, t, 0.2, { type: "highpass", f: 2400, v: 0.5 }); tone(seBus, t, 90, 0.26, { type: "square", v: 0.16, to: 50, lp: 700 }); },
  hit_陽: t => [1320, 1760, 2640].forEach((f, i) => tone(seBus, t + i * 0.04, f, 0.22, { type: "triangle", v: 0.16 })),
  hit_陰: t => { tone(seBus, t, 112, 0.36, { type: "sawtooth", v: 0.2, lp: 700 }); tone(seBus, t, 119, 0.36, { type: "sawtooth", v: 0.2, lp: 700 }); },
  swing: t => noise(seBus, t, 0.12, { type: "bandpass", f: 900, to: 2600, q: 0.8, v: 0.16, a: 0.03 }),
  cast: t => { tone(seBus, t, 520, 0.28, { v: 0.14, to: 1300, a: 0.05 }); tone(seBus, t, 780, 0.28, { v: 0.08, to: 1950, a: 0.05 }); },
  heal: t => [660, 880, 1100, 1320].forEach((f, i) => tone(seBus, t + i * 0.06, f, 0.2, { v: 0.16 })),
  eat: t => { tone(seBus, t, 300, 0.07, { type: "triangle", v: 0.25, to: 220 }); tone(seBus, t + 0.12, 320, 0.07, { type: "triangle", v: 0.25, to: 230 }); },
  down: t => tone(seBus, t, 320, 0.42, { type: "triangle", v: 0.3, to: 58 }),
  foedown: t => { noise(seBus, t, 0.22, { f: 2600, to: 300, v: 0.3 }); tone(seBus, t, 520, 0.22, { type: "triangle", v: 0.2, to: 110 }); },
  summon: t => tone(seBus, t, 260, 0.3, { type: "square", v: 0.12, to: 720, lp: 1800 }),
  status: t => tone(seBus, t, 700, 0.14, { type: "square", v: 0.1, to: 520, lp: 1600 }),
  up: t => { tone(seBus, t, 1568, 0.07, { v: 0.16 }); tone(seBus, t + 0.06, 2093, 0.14, { v: 0.16 }); },
  get: t => { tone(seBus, t, 988, 0.08, { type: "triangle", v: 0.24 }); tone(seBus, t + 0.08, 1319, 0.18, { type: "triangle", v: 0.24 }); },
  rest: t => [392, 494, 587, 784].forEach((f, i) => tone(seBus, t + i * 0.09, f, 0.7, { v: 0.13, a: 0.04 })),
  encounter: t => { noise(seBus, t, 0.4, { type: "bandpass", f: 400, to: 5000, q: 1.5, v: 0.3, a: 0.05 }); tone(seBus, t, 220, 0.4, { type: "sawtooth", v: 0.14, to: 880, lp: 2000 }); },
  win: t => [[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.12], [1047, 0.36, 0.5], [784, 0.36, 0.5], [659, 0.36, 0.5]].forEach(([f, dt, d]) => { tone(seBus, t + dt, f, d, { type: "triangle", v: 0.2 }); tone(seBus, t + dt, f, d, { type: "square", v: 0.05, lp: 2400 }); }),
  lose: t => [[392, 0, 0.3], [370, 0.3, 0.3], [330, 0.6, 0.3], [262, 0.9, 0.9]].forEach(([f, dt, d]) => tone(seBus, t + dt, f, d, { type: "triangle", v: 0.2, a: 0.03 })),
};
let lastSe = {};
function se(name) {
  if (!on || !ac || ac.state !== "running" || !SE[name]) return;
  const now = performance.now(); if (now - (lastSe[name] || 0) < 40) return; lastSe[name] = now; // 同じ音が重なりすぎないように
  SE[name](ac.currentTime + 0.005);
}

// ---------- BGM ----------
// 音の高さは「C4」などの名前。メロディは [名前, 8分音符いくつぶん] の並び（"-" は休み）
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function hz(n) { const m = /^([A-G])(#|b)?(\d)$/.exec(n); const s = NOTE[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0) + (+m[3] + 1) * 12; return 440 * Math.pow(2, (s - 69) / 12); }
const CH = { // 和音（低い音から）
  G: ["G2", "G3", "B3", "D4"], "D/F#": ["F#2", "A3", "D4", "F#4"], D: ["D3", "A3", "D4", "F#4"], Em: ["E2", "G3", "B3", "E4"], C: ["C3", "G3", "C4", "E4"], Am: ["A2", "A3", "C4", "E4"],
  B: ["B2", "F#3", "B3", "D#4"],
};
const mel = s => s.trim().split(/\s+/).map(x => { const [n, d] = x.split(":"); return [n, +d]; });
const SONGS = {
  // 町：ゆったりした長調。つまびく音の伴奏に、笛のような旋律
  town: {
    bpm: 92, vol: 0.34,
    chords: ["G", "D/F#", "Em", "C", "G", "D", "C", "G", "Em", "C", "G", "D", "Em", "C", "Am", "G"], half: { 6: "D", 14: "D" }, // half＝小節の後半で替わる和音
    lead: mel(`B4:2 D5:2 G5:3 F#5:1  D5:3 E5:1 F#5:2 A4:2  G4:2 B4:2 E5:3 D5:1  C5:2 E5:2 G5:4
               B4:2 D5:2 G5:3 A5:1  F#5:3 E5:1 D5:4  E5:2 G5:2 F#5:2 A5:2  G5:6 -:2
               E5:3 G5:1 B5:4  G5:2 E5:2 C5:4  D5:3 G5:1 B5:2 A5:2  A5:4 F#5:2 D5:2
               E5:2 F#5:2 G5:3 B5:1  G5:2 E5:2 C5:2 E5:2  A4:2 C5:2 F#5:2 A5:2  G5:8`),
    style: "town",
  },
  // 戦い：速い短調。低い音が8分で刻み、旋律が前へ出る
  battle: {
    bpm: 150, vol: 0.3,
    chords: ["Em", "Em", "C", "D", "Em", "Em", "C", "B", "Am", "Am", "Em", "Em", "C", "D", "Em", "B"], half: {},
    lead: mel(`E5:2 G5:1 B5:1 A5:2 G5:1 F#5:1  E5:3 B4:1 E5:2 F#5:2  G5:2 E5:1 C5:1 E5:2 G5:2  F#5:2 A5:2 D5:2 F#5:2
               E5:2 G5:1 B5:1 D6:2 B5:1 A5:1  G5:3 F#5:1 E5:4  C5:1 E5:1 G5:2 C6:2 B5:2  B5:2 A5:1 F#5:1 D#5:4
               A5:2 C6:2 B5:2 A5:2  E5:2 A5:2 C6:4  B5:2 G5:2 E5:2 G5:2  B5:6 -:2
               C6:2 B5:1 A5:1 G5:2 E5:2  F#5:2 A5:2 D6:4  B5:2 G5:2 E5:2 B4:2  F#5:2 D#5:2 B4:4`),
    style: "battle",
  },
};
// 楽器
function flute(t, f, d, v) { // 笛のような音（少し遅れてゆらぎが付く）
  const os = tone(bgmBus, t, f, d, { type: "triangle", v, a: 0.03, r: 0.1, wet: 1 });
  tone(bgmBus, t, f * 2, d, { v: v * 0.22, a: 0.04, r: 0.1 });
  const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.006, t + Math.min(d, 0.35));
  l.connect(lg); lg.connect(os.frequency); l.start(t); l.stop(t + d + 0.05);
}
function pluck(t, f, v) { tone(bgmBus, t, f, 0.5, { type: "triangle", v, a: 0.004, r: 0.45, wet: 1 }); tone(bgmBus, t, f, 0.18, { type: "square", v: v * 0.25, a: 0.003, r: 0.16, lp: 1800 }); }
function pad(t, fs, d, v) { fs.forEach(f => { tone(bgmBus, t, f, d, { type: "sawtooth", v, a: 0.3, r: 0.4, lp: 900, det: -6, wet: 1 }); tone(bgmBus, t, f, d, { type: "sawtooth", v, a: 0.3, r: 0.4, lp: 900, det: 6 }); }); }
function bass(t, f, d, v) { tone(bgmBus, t, f, d, { type: "triangle", v, a: 0.008, r: d * 0.5 }); tone(bgmBus, t, f, d, { v: v * 0.7, a: 0.008, r: d * 0.5 }); }
function brass(t, f, d, v) { tone(bgmBus, t, f, d, { type: "sawtooth", v, a: 0.015, r: 0.06, lp: 2600, wet: 1 }); tone(bgmBus, t, f, d, { type: "square", v: v * 0.5, a: 0.015, r: 0.06, lp: 1900, det: 7 }); }
const kick = (t, v) => tone(bgmBus, t, 130, 0.13, { v, to: 42, a: 0.002 });
const snare = (t, v) => { noise(bgmBus, t, 0.11, { type: "bandpass", f: 1900, q: 0.7, v }); tone(bgmBus, t, 190, 0.06, { type: "triangle", v: v * 0.5, to: 120 }); };
const hat = (t, v) => noise(bgmBus, t, 0.03, { type: "highpass", f: 7500, v });

// 1小節ぶんを、時刻 t から鳴らす予約をする
function bar(S, i, t) {
  const e = 60 / S.bpm / 2, n = S.chords.length, k = i % n; // e＝8分音符の長さ
  const c1 = CH[S.chords[k]], c2 = CH[S.half[k] || S.chords[k]];
  if (S.style === "town") {
    pad(t, c1.slice(1).map(hz), e * 4, 0.022); pad(t + e * 4, c2.slice(1).map(hz), e * 4, 0.022);
    for (let j = 0; j < 8; j++) { const c = j < 4 ? c1 : c2, o = [1, 2, 3, 2][j % 4]; pluck(t + j * e, hz(c[o]) * (j % 4 === 2 ? 2 : 1), 0.1); }
    bass(t, hz(c1[0]), e * 3.5, 0.2); bass(t + e * 4, hz(c2[0]), e * 3.5, 0.17);
  } else {
    pad(t, c1.slice(1).map(hz), e * 8, 0.02);
    for (let j = 0; j < 8; j++) { bass(t + j * e, hz(c1[0]) * (j % 4 === 3 ? 2 : 1), e * 0.9, 0.2); hat(t + j * e, j % 2 ? 0.1 : 0.06); }
    kick(t, 0.5); kick(t + e * 4, 0.5); kick(t + e * 5, 0.32); snare(t + e * 2, 0.26); snare(t + e * 6, 0.26);
    if (k % 4 === 3) { snare(t + e * 7, 0.2); snare(t + e * 7.5, 0.2); }
    [1.5, 3.5, 5.5].forEach(b => c1.slice(1).forEach(n => tone(bgmBus, t + b * e, hz(n), e * 0.4, { type: "square", v: 0.03, lp: 1500 }))); // 裏で刻む和音
  }
}
function startBgm(name) {
  if (timer) { clearInterval(timer); timer = null; }
  cur = name;
  if (!ac) return;
  const now = ac.currentTime;
  bgmBus.gain.cancelScheduledValues(now); bgmBus.gain.setValueAtTime(bgmBus.gain.value, now); bgmBus.gain.linearRampToValueAtTime(0.0001, now + 0.25);
  const S = SONGS[name]; if (!S) return;
  const e = 60 / S.bpm / 2, barLen = e * 8, total = S.chords.length;
  // 旋律を小節ごとに分けておく
  const bars = Array.from({ length: total }, () => []); let pos = 0;
  for (const [n, d] of S.lead) { bars[Math.floor(pos / 8) % total].push([n, d, pos % 8]); pos += d; }
  let next = now + 0.35, i = 0;
  bgmBus.gain.setValueAtTime(0.0001, now + 0.3); bgmBus.gain.linearRampToValueAtTime(S.vol, now + 0.6);
  const tick = () => {
    if (cur !== name) return;
    while (next < ac.currentTime + 0.6) {
      bar(S, i, next);
      for (const [n, d, at] of bars[i % total]) if (n !== "-") (S.style === "town" ? flute : brass)(next + at * e, hz(n), d * e * 0.94, S.style === "town" ? 0.15 : 0.085);
      next += barLen; i++;
    }
  };
  tick(); timer = setInterval(tick, 120);
}
function bgm(name) { want = name || null; if (!ac || ac.state !== "running") return; if (want !== cur) startBgm(want); }
function toggle() {
  on = !on; try { localStorage.setItem("rpgSnd", on ? "1" : "0"); } catch (e) {}
  if (ctx()) master.gain.value = on ? 1 : 0;
  return on;
}
// 画面の裏に回ったら止め、戻ったら続ける
document.addEventListener("visibilitychange", () => { if (!ac) return; if (document.hidden) ac.suspend(); else ac.resume(); });
// 押せる所を押したときの音（どの画面でも同じ）
addEventListener("click", e => {
  const t = e.target.closest && e.target.closest(".btn,.chip,.srow,.skrow,.chrow,.bbtn,.fbtn,.ttlbtn,.prow,.face");
  if (t) se(t.classList.contains("dim") || t.classList.contains("off") ? "cancel" : "tap");
  else if (e.target.closest && e.target.closest(".uilayer")) se("page");
}, true);

root.SND = { se, bgm, toggle, get on() { return on; }, _dbg: () => ({ ac, master, cur }) };
})(window);
