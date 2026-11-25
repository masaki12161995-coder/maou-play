// 戦闘の試作：画面と操作
(() => {
  const E = window.ENG;
  const $ = (s) => document.querySelector(s);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let P, B, idx = 0, snap = null, busy = false;
  const UI = { mode: 'idle', actor: null, pend: null };
  const enEls = new Map(), heEls = new Map();

  const img = (n) => `img/${n}.png`;
  const SPEAK = { atk: 'こうげき', spell: '火の呪文', guard: 'みをまもる', pump: 'ちからをためる', charge: '大技のかまえ' };

  function deep(p) { return { hp: p.heroes.map((h) => [h.hp, h.mp]), items: p.items.map((i) => i.n) }; }
  function restore(p, s) { p.heroes.forEach((h, i) => { h.hp = s.hp[i][0]; h.mp = s.hp[i][1]; }); p.items.forEach((it, i) => (it.n = s.items[i])); }

  // ---------- 幕 ----------
  function veil(title, text, buttons) {
    const v = $('#veil');
    v.innerHTML = `<h1>${title}</h1>${text ? `<p>${text}</p>` : ''}`;
    buttons.forEach(([label, fn]) => {
      const b = document.createElement('div'); b.className = 'btn'; b.textContent = label;
      b.onclick = () => { v.classList.remove('on'); fn(); };
      v.appendChild(b);
    });
    v.classList.add('on');
  }

  function start() {
    P = E.newParty(); idx = 0;
    veil('戦闘の試作', '3つの戦闘のあとに、ボスが待っています。<br>途中で宿には泊まれません。', [['はじめる', () => begin(0)]]);
  }

  function begin(i) {
    idx = i; snap = deep(P);
    B = E.newBattle(P, i);
    buildField(); buildParty();
    msg(i === 3 ? 'トロルが 立ちはだかった！' : '魔物の むれが あらわれた！');
    render();
    setTimeout(loop, 700);
  }

  // ---------- 描く ----------
  function buildField() {
    const f = $('#field'); f.innerHTML = ''; enEls.clear();
    const fw = f.clientWidth - 12, fh = f.clientHeight - 96;
    const ims = B.enemies.map((e) => E.MON[e.key]);
    const sizes = { monster_001: [26, 20], monster_002: [55, 29], monster_008: [56, 45], monster_012: [38, 45], monster_114: [28, 30], monster_116: [73, 70], monster_117: [38, 30], monster_124: [124, 90] };
    let s = 4;
    while (s > 1 && (ims.reduce((a, m) => a + sizes[m.img][0] * s + 8, 0) > fw || Math.max(...ims.map((m) => sizes[m.img][1] * s)) > fh)) s -= 0.5;
    B.enemies.forEach((e) => {
      const d = document.createElement('div'); d.className = 'enemy';
      const [w, h] = sizes[e.img];
      d.innerHTML = `<div class="tag"></div><div class="intent"></div><img class="px" src="${img(e.img)}" width="${w * s}" height="${h * s}"><div class="ebar"><i></i></div><div class="ename">${e.label}</div><div class="weak"></div>`;
      d.onclick = () => tapEnemy(e);
      f.appendChild(d); enEls.set(e, d);
    });
  }

  function buildParty() {
    const p = $('#party'); p.innerHTML = ''; heEls.clear();
    B.heroes.forEach((h) => {
      const d = document.createElement('div'); d.className = 'hero';
      d.innerHTML = `<div class="gd">まもり</div><div class="spr px" style="background-image:url(${img(h.img)})"></div><div class="nm">${h.name}</div>
        <div class="bar hp"><i></i></div><div class="bar mp"><i></i></div><div class="num"><span>HP</span><span class="vh"></span><span>MP</span><span class="vm"></span></div>`;
      d.onclick = () => tapHero(h);
      p.appendChild(d); heEls.set(h, d);
    });
  }

  function intentText(e) {
    const it = e.intent; if (!it) return ['', ''];
    if (it.kind === 'big') {
      const b = E.BIG[it.move];
      return [`⚠ ${b.name}${b.all ? '（全員）' : ' → ' + it.target.name}`, 'big'];
    }
    if (it.kind === 'charge') return [`大技のかまえ（次に${E.BIG[it.move].name}）`, 'charge'];
    if (it.kind === 'atk' || it.kind === 'spell') return [`${SPEAK[it.kind]} → ${it.target.name}`, 'atk'];
    return [SPEAK[it.kind], ''];
  }

  function weakText(e) {
    const k = P.known[e.key] || {};
    const w = Object.keys(k).filter((x) => k[x] === 'weak').map((x) => E.ELEM[x]);
    const r = Object.keys(k).filter((x) => k[x] === 'resist').map((x) => E.ELEM[x]);
    let s = `弱点 ${w.length ? '<b>' + w.join('・') + '</b>' : '？'}`;
    if (r.length) s += `　<s>強い ${r.join('・')}</s>`;
    return s;
  }

  function render() {
    // 行動順
    const now = E.nextActor(B);
    const fc = B.over ? [] : E.forecast(B, 7);
    $('#slots').innerHTML = fc.map((u, i) => {
      const cls = `slot ${u.side === 'hero' ? 'sh' : 'se'}${i === 0 ? ' now' : ''}`;
      if (u.side === 'hero') return `<div class="${cls}"><div class="face px" style="background-image:url(${img(u.img)})"></div></div>`;
      const big = u.intent && u.intent.kind === 'big' ? '<span class="big">⚠</span>' : '';
      return `<div class="${cls}"><img class="px" src="${img(u.img)}">${big}</div>`;
    }).join('');
    // 敵
    B.enemies.forEach((e) => {
      const d = enEls.get(e); if (!d) return;
      d.classList.toggle('dead', e.hp <= 0);
      const [t, c] = intentText(e);
      const it = d.querySelector('.intent'); it.textContent = t; it.className = 'intent ' + c; it.style.visibility = t ? 'visible' : 'hidden';
      d.querySelector('.ebar i').style.width = (100 * e.hp / e.maxhp) + '%';
      d.querySelector('.weak').innerHTML = weakText(e);
      d.classList.toggle('charge', !!e.charging);
      const pick = UI.mode === 'targetEnemy' && e.hp > 0;
      d.classList.toggle('pick', pick);
      const tag = d.querySelector('.tag');
      tag.textContent = '';
      if (pick && UI.pend && UI.pend.skill && UI.pend.skill.elem) {
        const k = (P.known[e.key] || {})[UI.pend.skill.elem];
        tag.textContent = k === 'weak' ? '弱点' : k === 'resist' ? 'いまひとつ' : '';
      }
      if (!tag.textContent) tag.style.display = 'none'; else tag.style.display = '';
    });
    // 味方
    B.heroes.forEach((h) => {
      const d = heEls.get(h);
      d.classList.toggle('dead', h.hp <= 0);
      d.classList.toggle('turn', UI.actor === h && !busy);
      d.classList.toggle('guard', !!h.guard);
      d.classList.toggle('pick', UI.mode === 'targetAlly' && (h.hp > 0));
      const r = h.hp / h.maxhp;
      const hb = d.querySelector('.bar.hp'); hb.className = 'bar hp' + (r < 0.25 ? ' crit' : r < 0.5 ? ' low' : '');
      hb.querySelector('i').style.width = r * 100 + '%';
      d.querySelector('.bar.mp i').style.width = (100 * h.mp / h.maxmp) + '%';
      d.querySelector('.vh').textContent = h.hp; d.querySelector('.vm').textContent = h.mp;
    });
    renderCmd();
  }

  function renderCmd() {
    const c = $('#cmd'); c.innerHTML = '';
    if (busy || !UI.actor) return;
    const a = UI.actor;
    if (UI.mode === 'cmd') {
      const g = document.createElement('div'); g.className = 'grid';
      [['たたかう', () => setMode('targetEnemy', { type: 'attack' })],
       ['とくぎ', () => setMode('skill')],
       ['ぼうぎょ', () => act({ type: 'guard' })],
       ['どうぐ', () => setMode('item'), !P.items.some((i) => i.n > 0)]].forEach(([l, fn, off]) => {
        const b = document.createElement('div'); b.className = 'btn' + (off ? ' off' : ''); b.textContent = l;
        b.onclick = () => { if (!off) fn(); };
        g.appendChild(b);
      });
      c.appendChild(g); return;
    }
    const L = document.createElement('div'); L.className = 'list';
    const rows = document.createElement('div'); rows.className = 'rows';
    if (UI.mode === 'skill' || (UI.pend && UI.pend.skill)) {
      a.skills.forEach((sk) => {
        const off = sk.mp > a.mp;
        const r = document.createElement('div');
        r.className = 'row' + (off ? ' off' : '') + (UI.pend && UI.pend.skill === sk ? ' sel' : '');
        const tgt = sk.target === 'enemies' ? '全体' : sk.target === 'allies' ? '全員' : '';
        r.innerHTML = `<span>${sk.name}</span><span class="el">${sk.elem ? E.ELEM[sk.elem] : tgt}</span><span class="mp">${sk.mp}</span>`;
        r.onclick = () => { if (!off) chooseSkill(sk); };
        rows.appendChild(r);
      });
    } else if (UI.mode === 'item' || (UI.pend && UI.pend.item)) {
      P.items.forEach((it) => {
        const off = it.n <= 0;
        const r = document.createElement('div');
        r.className = 'row' + (off ? ' off' : '') + (UI.pend && UI.pend.item === it ? ' sel' : '');
        r.innerHTML = `<span>${it.name}</span><span class="el"></span><span class="mp">×${it.n}</span>`;
        r.onclick = () => { if (!off) setMode('targetAlly', { type: 'item', item: it }); };
        rows.appendChild(r);
      });
    } else if (UI.mode === 'targetEnemy') {
      const h = document.createElement('div'); h.className = 'hint'; h.textContent = 'だれを？';
      rows.appendChild(h); rows.style.position = 'relative';
    }
    L.appendChild(rows);
    const bk = document.createElement('div'); bk.className = 'back'; bk.textContent = 'もどる';
    bk.onclick = () => setMode('cmd');
    L.appendChild(bk);
    c.appendChild(L);
  }

  function setMode(m, pend) { UI.mode = m; UI.pend = pend || null; render(); }

  function chooseSkill(sk) {
    if (sk.target === 'enemy') setMode('targetEnemy', { type: 'skill', skill: sk });
    else if (sk.target === 'ally') setMode('targetAlly', { type: 'skill', skill: sk });
    else act({ type: 'skill', skill: sk });
  }

  function tapEnemy(e) {
    if (busy || !UI.actor || e.hp <= 0) return;
    if (UI.mode === 'cmd') return act({ type: 'attack', target: e }); // 見えている敵をタップすれば、そのまま攻撃
    if (UI.mode === 'targetEnemy') return act({ ...UI.pend, target: e });
  }
  function tapHero(h) {
    if (busy || !UI.actor || h.hp <= 0) return;
    if (UI.mode === 'targetAlly') act({ ...UI.pend, target: h });
  }

  // ---------- 進める ----------
  function msg(s) { $('#msg').textContent = s; }

  function pop(el, text, cls, topPx) {
    const p = document.createElement('div'); p.className = 'pop ' + (cls || ''); p.textContent = text;
    if (topPx != null) p.style.top = topPx + 'px';
    el.appendChild(p); setTimeout(() => p.remove(), 950);
  }

  async function play(ev) {
    busy = true; render();
    for (const x of ev) {
      if (x.t === 'msg') {
        msg(x.s);
        if (x.actor && x.actor.side === 'hero' && x.anim === 'step') { const d = heEls.get(x.actor); d.classList.add('step'); setTimeout(() => d.classList.remove('step'), 280); }
        if (x.actor && x.actor.side === 'enemy' && x.anim) { const d = enEls.get(x.actor); d.classList.remove('lunge'); void d.offsetWidth; d.classList.add('lunge'); }
        render(); await wait(x.anim === 'big' ? 650 : 380);
      } else if (x.t === 'cutin') {
        const c = $('#cut'); c.querySelector('.pose').style.backgroundImage = `url(${img(x.actor.img)})`;
        c.querySelector('.sn').textContent = x.s;
        c.classList.remove('on'); void c.offsetWidth; c.classList.add('on');
        await wait(620);
      } else if (x.t === 'dmg') {
        const d = enEls.get(x.who); const im = d.querySelector('img');
        d.classList.remove('hit'); void d.offsetWidth; d.classList.add('hit');
        const top = d.querySelector('img').offsetTop + 10;
        pop(d, x.n, x.weak ? 'weak' : x.resist ? 'res' : '', top);
        if (x.weak) setTimeout(() => pop(d, '弱点！', 'word', top - 26), 120);
        if (x.resist) setTimeout(() => pop(d, 'いまひとつ', 'res', top - 24), 120);
        render(); await wait(420);
      } else if (x.t === 'push') {
        const d = enEls.get(x.who); pop(d, '順番が遅れた！', 'word', d.querySelector('img').offsetTop + 34);
        render(); await wait(450);
      } else if (x.t === 'break') {
        const d = enEls.get(x.who); pop(d, '大技が崩れた！', 'brk', d.querySelector('img').offsetTop + 34);
        msg(`${x.who.label}の 大技が 崩れた！`);
        render(); await wait(650);
      } else if (x.t === 'die') {
        msg(`${x.who.label}を たおした！`); render(); await wait(380);
      } else if (x.t === 'hdmg') {
        const d = heEls.get(x.who); d.classList.remove('hurt'); void d.offsetWidth; d.classList.add('hurt');
        pop(d, x.n, '', 30); render(); await wait(300);
      } else if (x.t === 'heal' || x.t === 'mpheal') {
        const d = heEls.get(x.who); pop(d, (x.t === 'mpheal' ? 'MP+' : '+') + x.n, 'heal', 30); render(); await wait(320);
      } else if (x.t === 'hdie') {
        msg(`${x.who.name}は たおれた…`); render(); await wait(450);
      }
    }
    busy = false;
  }

  async function act(cmd) {
    const h = UI.actor; UI.actor = null; UI.mode = 'idle'; UI.pend = null;
    await play(E.heroAct(B, h, cmd));
    loop();
  }

  async function loop() {
    if (B.over) return end();
    const a = E.nextActor(B);
    if (a.side === 'hero') {
      UI.actor = a; UI.mode = 'cmd'; UI.pend = null;
      msg(`${a.name}は どうする？`);
      render();
    } else {
      UI.actor = null; render();
      await wait(260);
      await play(E.enemyAct(B, a));
      loop();
    }
  }

  function end() {
    render();
    const left = B.heroes.map((h) => `${h.name} HP${h.hp} MP${h.mp}`).join('　');
    if (B.over === 'win') {
      if (idx < 3) veil('しょうり！', `（${idx + 1}／4）`, [[idx === 2 ? 'ボスへ' : 'つぎの戦闘へ', () => { B.heroes.forEach((h) => { if (h.hp <= 0) h.hp = 1; }); begin(idx + 1); }]]);
      else veil('クリア！', 'トロルを たおした！<br>' + left, [['もう一度はじめから', start]]);
    } else {
      veil('ぜんめつ…', `${idx === 3 ? 'ボス' : (idx + 1) + 'つめ'}の戦闘で ぜんめつした。`, [
        ['この戦闘をやりなおす', () => { restore(P, snap); begin(idx); }],
        ['はじめから', start],
      ]);
    }
  }

  window.__jump = (i) => { document.querySelector('#veil').classList.remove('on'); begin(i); };
  window.addEventListener('load', start);
  document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
})();
