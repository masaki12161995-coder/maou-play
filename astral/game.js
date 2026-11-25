/* 星環の決闘 — portrait game, touch input, and match presentation. */
(function () {
  "use strict";

  const rules = AstralRules;
  const sound = AstralAudio;
  const stage = document.getElementById("stage");
  const screen = document.getElementById("screen");
  const modal = document.getElementById("modal");
  const fx = document.getElementById("fx");
  const canvas = document.getElementById("trail");
  const context = canvas.getContext("2d");
  const announce = document.getElementById("announce");
  const shortMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const STORE_KEY = "astral-eclipse.v1";
  const HERO_NAMES = ["あなた", "月蝕の騎士"];
  const KIND_NAMES = { unit: "ユニット", gear: "装備", spell: "魔法" };
  const WIDTH = 402;
  const HEIGHT = 874;
  const GALLERY_SIZE = 9;
  const HOLD_TIME = 430;
  let progress = readProgress();
  let scene = "title";
  let game = null;
  let result = null;
  let page = 0;
  let galleryBack = "title";
  let busy = false;
  let actionLabel = "";
  let modalKind = null;
  let previousFocus = null;
  let drag = null;
  let keyPick = null;

  if (progress.muted) sound.mute(true);

  const symbols = {
    star: '<path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19"/><circle cx="12" cy="12" r="4"/>',
    sigil: '<path d="m12 2 9 10-9 10-9-10 9-10Z M12 6l5 6-5 6-5-6 5-6Z"/><path d="M12 2v20M3 12h18"/>',
    sword: '<path d="m5 19 3-3m-5 5 2-2m1-6 5 5M9 15 19 5l2-2-1 6-8 8"/>',
    clash: '<path d="m5 5 2 1 12 12M19 5l-2 1L5 18m-2-2 5 5m8-5 5 5M12 3v3M3 10h3m12 0h3"/>',
    heart: '<path d="M12 21 4.5 13.8C-.3 9.2 6.5 2.4 12 8c5.5-5.6 12.3 1.2 7.5 5.8L12 21Z"/>',
    shield: '<path d="M12 21c-4.3-2.2-7.5-5.7-7.5-10.2V5.5L12 3l7.5 2.5v5.3c0 4.5-3.2 8-7.5 10.2Z"/><path d="m9 12 2 2 4-5"/>',
    hour: '<path d="M6 3h12M6 21h12M8 3v4c0 2 1 3 4 5-3 2-4 3-4 5v4m8-18v4c0 2-1 3-4 5 3 2 4 3 4 5v4"/>',
    book: '<path d="M12 6C9 4 6.3 3.9 3 5v14c3.3-1.1 6-.9 9 1 3-1.9 5.7-2.1 9-1V5c-3.3-1.1-6-.9-9 1Zm0 0v14M6 9l3 0m6 0h3"/>',
    deck: '<rect x="7" y="4" width="12" height="16" rx="2"/><path d="M4 17V6m9 2 3 4-3 4-3-4 3-4Z"/>',
    sound: '<path d="M3 9h4l5-5v16l-5-5H3zM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    mute: '<path d="M3 9h4l5-5v16l-5-5H3zM16 9l5 6m0-6-5 6"/>',
    menu: '<path d="M5 6h14M5 12h14M5 18h14"/>',
    left: '<path d="m15 6-6 6 6 6"/>',
    right: '<path d="m9 6 6 6-6 6"/>',
    more: '<path d="M4 12h15m-5-5 5 5-5 5"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    touch: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11l2-.7 5 1.5a2 2 0 0 1 1.4 2.1l-.6 4.1c-.2 1.5-1.2 2.5-2.7 2.5h-4.6c-1 0-1.7-.5-2.3-1.2L5 14a1.4 1.4 0 0 1 2-2l1 1Z"/>',
    trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0V4Zm0 2H3v2a4 4 0 0 0 4 4m10-6h4v2a4 4 0 0 1-4 4m-5 2v4m-5 3h10m-8-3h6v3"/>',
    moon: '<path d="M19.9 15.2A8.6 8.6 0 0 1 8.8 4.1a8.6 8.6 0 1 0 11.1 11.1Z"/><path d="M16 3v6m-3-3h6"/>'
  };

  const RULE_COPY = [
    ["勝ち方", "お互いのライフは２０。相手のライフを０にすると勝ちです。先攻は抽選で、最初の手札は４枚です。"],
    ["マナと手札", "自分の番になるたび、マナの上限が１増え、満タンになります（最大８）。後攻は最初の番に２枚、以降はお互い１枚ずつ引きます。"],
    ["カードを出す", "光る手札を引っぱります。ユニットは自分の場の空き枠へ、装備は味方へ。魔法は光った相手や味方、自分の場へ。"],
    ["攻撃する", "光るユニットを相手のカードか顔へ。ユニット同士は同時にダメージを受けます。「守護」がいると、攻撃は守護が先です。"],
    ["次の番へ", "場に出たユニットは次の自分の番から攻撃（速攻はすぐ）。カードは長押しで詳細。「ターン終了」で相手の番です。"],
    ["山札と報酬", "手札は７枚まで。山札が空なら引くたび１、２、３…ダメージ。勝つと図鑑にカードが１枚増えます。"]
  ];

  function icon(name) {
    return `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${symbols[name]}</svg>`;
  }

  function readProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      const prizes = {};
      for (const id of rules.prizes) {
        const quantity = saved.prizes?.[id];
        if (Number.isSafeInteger(quantity) && quantity > 0) prizes[id] = quantity;
      }
      return {
        prizes,
        muted: saved.muted === true,
        wins: Number.isSafeInteger(saved.wins) && saved.wins > 0 ? saved.wins : 0
      };
    } catch {
      return { prizes: {}, muted: false, wins: 0 };
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(progress));
    } catch {
      // All features still work for the current session on storage-restricted origins.
    }
  }

  function fit() {
    const viewport = window.visualViewport;
    const width = viewport?.width ?? window.innerWidth;
    const height = viewport?.height ?? window.innerHeight;
    stage.style.setProperty("--scale", Math.min(width / WIDTH, height / HEIGHT));
  }
  window.addEventListener("resize", fit);
  window.visualViewport?.addEventListener("resize", fit);
  for (const gesture of ["gesturestart", "gesturechange", "gestureend", "contextmenu", "dragstart"]) {
    stage.addEventListener(gesture, event => event.preventDefault());
  }
  document.addEventListener("touchmove", event => event.preventDefault(), { passive: false });

  function iconButton(action, image, label, extra = "") {
    return `<button class="icon-btn ${extra}" type="button" data-action="${action}" aria-label="${label}">${icon(image)}</button>`;
  }

  function soundButton() {
    const label = progress.muted ? "音を出す" : "音を消す";
    return iconButton("sound", progress.muted ? "mute" : "sound", label, "sound");
  }

  function button(action, text, type = "quiet", image = "") {
    return `<button class="${type}" type="button" data-action="${action}">${image ? icon(image) : ""}${text}</button>`;
  }

  function titleFrame() {
    return '<div class="corner-frame" aria-hidden="true"></div>';
  }

  function swapScene(next, html) {
    scene = next;
    stage.dataset.scene = next;
    screen.innerHTML = html;
  }

  function showTitle() {
    game = null;
    result = null;
    busy = false;
    closeDialog(false);
    clearInspection();
    fx.replaceChildren();
    swapScene("title", `
      <section class="view cover" aria-label="タイトル">
        ${titleFrame()}${soundButton()}
        <div class="cover-title">
          <div class="etched-line" aria-hidden="true"><span class="sigil">${icon("moon")}</span></div>
          <h1>星環の決闘</h1>
          <p lang="en">ASTRAL ECLIPSE</p>
        </div>
        <div class="cover-actions">
          ${button("start", "対戦する", "metal", "clash")}
          ${button("catalog", "カード図鑑", "quiet", "deck")}
          ${button("rules", "遊び方", "quiet", "book")}
        </div>
        <div class="cover-foot" aria-hidden="true"><div class="etched-line">${icon("star")}</div></div>
      </section>`);
  }

  function cardFace(id, options = {}) {
    const card = rules.cards[id];
    const rarity = rules.rarities[card.rarity];
    const element = rules.elements[card.element];
    const { unit, extra = "", tag = "div", attributes = "", showText = true } = options;
    const stats = card.kind === "unit" ? `
      <span class="card-stats"><span>${icon("sword")}${unit?.attack ?? card.attack}</span>
      <span>${icon("heart")}${unit?.hp ?? card.health}</span></span>` : `<span class="card-kind">${KIND_NAMES[card.kind]}</span>`;
    const badges = unit ? `
      <span class="card-badges" aria-hidden="true">
        ${unit.guard ? `<span class="card-status">${icon("shield")}</span>` : ""}
        ${unit.gear.length ? `<span class="card-status equipped">${icon("sword")}</span>` : ""}
        ${!unit.ready ? `<span class="card-status asleep">${icon("hour")}</span>` : ""}
      </span>` : "";
    const imagePosition = card.kind === "unit" ? "center 39%" : "center 48%";
    return `<${tag} class="card-face ${card.rarity === 5 ? "rainbow" : ""} ${extra}"
      style="--rarity:${rarity.color};--rarity-dark:${rarity.dark};--element:${element.color}" ${attributes}>
      <img class="card-art" src="assets/${card.art}.webp" alt="" draggable="false" style="object-position:${imagePosition}">
      <span class="card-wash" aria-hidden="true"></span>
      <span class="card-top">
        ${unit ? "<span></span>" : `<span class="card-cost">${card.cost}</span>`}
        <span class="card-element">${element.name}</span>
      </span>${badges}
      <span class="card-info">
        <strong class="card-name">${card.name}</strong>
        ${showText && card.short ? `<span class="card-short">${card.short}</span>` : ""}
        ${stats}
      </span>
    </${tag}>`;
  }

  function describeCard(id, unit = null) {
    const card = rules.cards[id];
    const stats = card.kind === "unit" ? `、攻撃${unit?.attack ?? card.attack}、体力${unit?.hp ?? card.health}` : "";
    return `${card.name}、${KIND_NAMES[card.kind]}、${card.cost}マナ${stats}`;
  }

  function portrait(side) {
    return `<div class="portrait"><img src="assets/portrait-${side === 0 ? "you" : "cpu"}.webp" alt="" draggable="false"></div>`;
  }

  function manaReadout(player) {
    const pips = Array.from({ length: rules.MANA_LIMIT }, (_, index) => {
      const status = index < player.mana ? "filled" : index < player.maxMana ? "capacity" : "";
      return `<i class="${status}"></i>`;
    }).join("");
    return `<span class="mana" aria-label="マナ ${player.mana} / ${player.maxMana}">
      <span class="mana-pips" aria-hidden="true">${pips}</span><span>${player.mana}/${player.maxMana}</span>
    </span>`;
  }

  function heroHud(side) {
    const player = game.players[side];
    const current = game.active === side ? "current" : "";
    return `<div class="hero-hud ${side === 0 ? "south" : "north"} ${current}" tabindex="-1" id="hero-${side}"
      aria-label="${HERO_NAMES[side]} ライフ ${player.hp} / ${rules.LIFE}、マナ ${player.mana} / ${player.maxMana}">
      ${portrait(side)}
      <div class="hero-copy">
        <span class="hero-name"><b>${HERO_NAMES[side]}</b><span class="deck-count" aria-label="山札 ${player.pile.length}枚">${icon("deck")}${player.pile.length}</span></span>
        ${manaReadout(player)}
      </div>
      <div class="life">
        <span class="life-num">${icon("heart")}<b>${player.hp}</b><small>/${rules.LIFE}</small></span>
        <span class="life-track"><i style="width:${player.hp / rules.LIFE * 100}%"></i></span>
      </div>
    </div>`;
  }

  function foeHand() {
    const count = game.players[1].hand.length;
    const thumbs = Array.from({ length: count }, (_, index) =>
      `<i class="card-back" style="--angle:${(index - (count - 1) / 2) * 4}deg">${icon("sigil")}</i>`
    ).join("");
    return `<div class="foe-hand" id="foe-hand" aria-label="相手の手札 ${count}枚">${thumbs}</div>`;
  }

  function boardRow(side) {
    const player = game.players[side];
    const cells = player.board.map((unit, index) => {
      if (!unit) {
        return `<div class="slot-cell empty" id="slot-${side}-${index}" tabindex="-1" aria-label="空き枠 ${index + 1}">${icon("sigil")}</div>`;
      }
      const ready = game.winner === null && game.active === side && unit.ready;
      const classes = `board-card ${ready ? "ready" : ""} ${side === 1 ? "enemy" : "ally"}`;
      return `<div class="slot-cell" id="slot-${side}-${index}">${cardFace(unit.id, {
        unit, extra: classes, tag: "button", showText: false,
        attributes: `type="button" id="unit-${unit.uid}" data-unit="${unit.uid}" data-side="${side}"
          data-card="${unit.id}" aria-label="${describeCard(unit.id, unit)}${unit.guard ? "、守護" : ""}${ready ? "、攻撃できる" : ""}"`
      })}</div>`;
    }).join("");
    const position = side === 0 ? "south" : "north";
    const note = player.board.some(unit => unit?.guard) ? `<span class="guard-note">${icon("shield")}守護</span>` : "";
    return `<div class="row-label ${position}"><i class="diamond"></i>${side === 0 ? "自分の場" : "相手の場"}${note}</div>
      <div class="slot-row ${position}">${cells}</div>`;
  }

  function handHtml(drawn = []) {
    const hand = game.players[0].hand;
    const count = hand.length;
    const gap = count > 5 ? 4 : 7;
    const width = Math.min(83, Math.floor((354 - gap * (count - 1)) / Math.max(1, count)));
    const holders = hand.map((entry, index) => {
      const playable = rules.playTargets(game, 0, entry.uid).length > 0;
      const distance = index - (count - 1) / 2;
      const angle = count <= 5 ? distance * 2 : distance;
      const readyStyle = playable ? "playable" : "unavailable";
      const density = count >= 7 ? "compact slim" : count >= 5 ? "compact" : "";
      return `<div class="hand-holder ${drawn.includes(entry.uid) ? "new-card" : ""}"
        style="--angle:${angle}deg;--lift:${Math.abs(distance) * 1.7}px">
        ${cardFace(entry.id, {
          extra: `hand-card ${readyStyle} ${density}`, tag: "button",
          attributes: `type="button" id="hand-${entry.uid}" data-hand="${entry.uid}" data-card="${entry.id}"
            aria-label="${describeCard(entry.id)}${playable ? "、出せる" : ""}"`
        })}
      </div>`;
    }).join("");
    return `<div class="hand-area">
      <div class="hand-label"><span>${icon("deck")}手札 <b>${count}</b></span><small>長押しでカード詳細</small></div>
      <div class="hand-row" style="--hand-width:${width}px;--hand-gap:${gap}px">
        ${holders || '<div class="hand-placeholder">手札がありません</div>'}
      </div>
    </div>`;
  }

  function renderBattle(events = []) {
    const playerTurn = game.active === 0;
    const playable = game.winner === null && playerTurn;
    const drawn = events.filter(event => event.type === "draw" && event.side === 0).map(event => event.card.uid);
    const actionable = playable && (rules.units(game, 0).some(unit => unit.ready) ||
      game.players[0].hand.some(entry => rules.playTargets(game, 0, entry.uid).length));
    const hint = actionable ? "光るカードを引っぱる" : playable ? "行動できるカードがありません" : "相手の行動を表示中";
    swapScene("battle", `
      <section class="view battle-view" aria-label="対戦">
        ${titleFrame()}
        <div class="battle-head">
          ${iconButton("pause", "menu", "対戦メニュー")}
          <div class="round"><i class="diamond"></i>ラウンド <b>${game.round}</b><i class="diamond"></i></div>
          ${soundButton()}
        </div>
        ${heroHud(1)}${foeHand()}
        <div class="arena">
          ${boardRow(1)}
          <div class="turn-readout">
            <div class="turn-line ${playerTurn ? "" : "enemy"}">
              <span class="turn-tag">${icon(playerTurn ? "star" : "moon")}${playerTurn ? "あなたの番" : "相手の番"}</span>
            </div>
            <div class="action-label" id="action-label">${actionLabel}</div>
          </div>
          <div class="altar" id="altar-0" tabindex="-1" aria-label="自分の場で発動"></div>
          ${boardRow(0)}
        </div>
        ${heroHud(0)}${handHtml(drawn)}
        <div class="turn-controls">
          <div class="gesture-hint">${icon("touch")}<span>${hint}</span></div>
          ${button("end", "ターン終了", "metal", "more")}
        </div>
      </section>`);
    syncControls();
  }

  function syncControls() {
    if (scene !== "battle") return;
    screen.querySelector('[data-action="end"]').disabled = busy || game.winner !== null || game.active !== 0;
    screen.querySelector('[data-action="pause"]').disabled = busy || game.winner !== null;
  }

  function setLine(label) {
    actionLabel = label;
    const node = document.getElementById("action-label");
    if (node) node.textContent = label;
    if (label) announce.textContent = label;
  }

  function start() {
    closeDialog(false);
    clearInspection();
    fx.replaceChildren();
    result = null;
    game = rules.create();
    busy = false;
    actionLabel = game.first === 0 ? "先攻はあなた" : "先攻は月蝕の騎士";
    renderBattle();
    announce.textContent = actionLabel;
    sound.play(game.active === 0 ? "turn" : "cpu");
    if (game.active === 1) runCpu(game, 1000);
  }

  function nextTurn() {
    if (!game || busy || game.winner !== null) return;
    turnToOther(game.active);
  }

  function turnToOther(side) {
    const match = game;
    const events = rules.end(match, side);
    if (!events) return;
    const notice = drawNotice(events);
    const drawnCount = events.filter(event => event.type === "draw").length;
    const subject = match.active === 0 ? "" : "相手が";
    actionLabel = notice || (drawnCount ? `${subject}カードを${drawnCount}枚引いた` : "");
    if (match.winner !== null) busy = true;
    renderBattle(events);
    announce.textContent = notice || (match.active === 0 ? "あなたの番" : "相手の番");
    showEffects(events, new Map(), null);
    if (match.winner !== null) {
      displayResultAfter(match, 920);
      return;
    }
    sound.play(match.active === 0 ? "turn" : "cpu");
    if (match.active === 1) runCpu(match, 750);
  }

  function drawNotice(events) {
    const lines = events.filter(event => ["fatigue", "overflow"].includes(event.type));
    if (!lines.length) return "";
    const { side, type, amount } = lines.at(-1);
    const subject = side === 0 ? "自分" : "相手";
    return type === "fatigue" ? `${subject}の山札切れ　${amount}ダメージ` : `${subject}の手札が満杯　引いたカードを捨てた`;
  }

  function resultPanel() {
    const won = result.winner === 0;
    const prize = won ? rules.cards[result.prize] : null;
    swapScene("result", `
      <section class="view result ${won ? "" : "defeat"}" aria-label="対戦結果">
        ${titleFrame()}${soundButton()}
        <div class="result-seal" aria-hidden="true">${icon(won ? "trophy" : "moon")}</div>
        <div class="result-head">
          <h1>${won ? "勝利" : "敗北"}</h1>
          <p>ラウンド ${result.round} で決着　｜　ライフ ${result.hp[0]} 対 ${result.hp[1]}</p>
        </div>
        ${won ? `
          <div class="reward">
            <div class="etched-line">獲得カード</div>
            ${cardFace(prize.id, {
              tag: "button", extra: "detail-card", attributes: `type="button" data-action="prize-detail" aria-label="${describeCard(prize.id)}"`
            })}
            <div class="reward-caption">${rules.rarities[prize.rarity].name}レア　・　図鑑に追加</div>
          </div>` : `
          <div class="final-score">${[0, 1].map(side => `
            <div>${portrait(side)}<p>${HERO_NAMES[side]}</p><b>${result.hp[side]}</b></div>
          `).join('<span aria-hidden="true">×</span>')}</div>`}
        <div class="result-actions">
          ${button("start", "もう一度対戦", "metal", "clash")}
          ${button("catalog", "カード図鑑", "quiet", "deck")}
          ${button("title", "タイトルへ", "quiet", "left")}
        </div>
      </section>`);
  }

  async function displayResultAfter(match, time) {
    await wait(time);
    if (game !== match) return;
    result = { winner: match.winner, hp: match.players.map(player => player.hp), round: match.round, prize: null };
    if (result.winner === 0) {
      result.prize = rules.prizes.find(id => !progress.prizes[id]) || rules.prizes[progress.wins % rules.prizes.length];
      progress.wins++;
      progress.prizes[result.prize] = (progress.prizes[result.prize] || 0) + 1;
      saveProgress();
    }
    busy = false;
    game = null;
    resultPanel();
    sound.play(result.winner === 0 ? "victory" : "defeat");
    announce.textContent = result.winner === 0 ? "勝利。カードを１枚獲得。" : "敗北。";
    burst({ x: 201, y: 191 }, result.winner === 0 ? "#ffe2a4" : "#c87a95", 28, 165);
    document.querySelector(".result-seal").animate([
      { opacity: 0.3, transform: "scale(.72)" },
      { opacity: 1, transform: "scale(1)" }
    ], { duration: motion(490), easing: "cubic-bezier(.2,.85,.2,1)" });
  }

  function showCatalog(reset = true) {
    if (reset) {
      galleryBack = scene;
      page = 0;
    }
    const owned = { ...rules.starter, ...progress.prizes };
    const ids = Object.keys(owned).sort((left, right) => {
      const a = rules.cards[left];
      const b = rules.cards[right];
      return a.cost - b.cost || a.rarity - b.rarity || a.art.localeCompare(b.art);
    });
    const pageCount = Math.ceil(ids.length / GALLERY_SIZE);
    const count = Object.values(owned).reduce((sum, amount) => sum + amount, 0);
    const entries = ids.slice(page * GALLERY_SIZE, (page + 1) * GALLERY_SIZE).map(id => {
      const rarity = rules.rarities[rules.cards[id].rarity];
      return `
        <div class="album-entry">
          ${cardFace(id, {
            tag: "button", extra: "album-card", attributes: `type="button" data-action="album-detail" data-card="${id}"
              aria-label="${describeCard(id)}、${rarity.name}レア、${owned[id]}枚"`
          })}
          <span class="album-meta"><span style="color:${rarity.color}"><i class="diamond"></i>${rarity.name}</span><span>×${owned[id]}</span></span>
        </div>`;
    }).join("");
    swapScene("catalog", `
      <section class="view catalog" aria-label="カード図鑑">
        ${titleFrame()}
        <div class="sub-head">
          ${iconButton("gallery-back", "left", "戻る")}
          <h1>カード図鑑</h1>${soundButton()}
        </div>
        <div class="gallery-profile">
          <span>発見したカード<br><strong>${ids.length}</strong> <small>/ ${Object.keys(rules.cards).length}種</small></span>
          <span>所持枚数<br><strong>${count}</strong> <small>枚</small></span>
          <div class="progress-track" aria-hidden="true"><i style="width:${ids.length / Object.keys(rules.cards).length * 100}%"></i></div>
        </div>
        <div class="gallery-grid">${entries}</div>
        <nav class="album-pages" aria-label="図鑑のページ">
          ${iconButton("gallery-prev", "left", "前のページ")}
          <span>${page + 1} / ${pageCount}</span>
          ${iconButton("gallery-next", "right", "次のページ")}
        </nav>
      </section>`);
    screen.querySelector('[data-action="gallery-prev"]').disabled = page <= 0;
    screen.querySelector('[data-action="gallery-next"]').disabled = page + 1 >= pageCount;
  }

  function dialog(kind, text, accessible, extra = "") {
    previousFocus = document.activeElement;
    clearInspection();
    modalKind = kind;
    modal.innerHTML = `<section class="dialog ${extra}" role="dialog" aria-modal="true" aria-label="${accessible}">
      ${iconButton("close", "close", "閉じる")}${text}
    </section>`;
    modal.hidden = false;
    screen.inert = true;
    modal.querySelector('[data-action="close"]').focus({ preventScroll: true });
  }

  function closeDialog(restore = true) {
    if (modal.hidden) return;
    if (restore && modalKind === "pause-rules") {
      pauseDialog();
      return;
    }
    modal.hidden = true;
    modal.replaceChildren();
    modalKind = null;
    screen.inert = false;
    if (restore && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    previousFocus = null;
  }

  function cardDetail(id, unit) {
    const card = rules.cards[id];
    const rarity = rules.rarities[card.rarity];
    const element = rules.elements[card.element];
    const gear = unit?.gear.map(item => rules.cards[item].name).join("、") || "";
    const current = unit ? `<p class="card-live">攻撃 ${unit.attack}　体力 ${unit.hp}/${unit.maxHp}${unit.guard ? "　守護" : ""}${gear ? `<br>装備　${gear}` : ""}</p>` : "";
    dialog("card", `
      ${cardFace(id, { extra: "detail-card", unit })}
      <div class="detail-meta">
        <span>${KIND_NAMES[card.kind]}</span>
        <span style="color:${element.color}">${element.name}属性</span>
        <span style="color:${rarity.color}">${rarity.name}レア</span>
      </div>
      <p class="card-description">${card.text}</p>${current}`, card.name, "card-dialog");
  }

  function rulesDialog() {
    const copy = RULE_COPY.map(([title, text]) => `<div class="rule-block"><h3>${title}</h3><p>${text}</p></div>`).join("");
    dialog(modalKind === "pause" ? "pause-rules" : "rules", `<h2>遊び方</h2><div class="rules-copy">${copy}</div>`, "遊び方");
  }

  function pauseDialog() {
    if (busy || scene !== "battle") return;
    dialog("pause", `<h2>対戦を一時停止</h2>
      <div class="dialog-actions">
        ${button("close", "対戦に戻る", "metal", "clash")}
        ${button("rules", "遊び方", "quiet", "book")}
        ${button("title", "対戦をやめる", "quiet", "left")}
      </div>`, "対戦を一時停止", "pause-dialog");
  }

  function toggleSound() {
    progress.muted = !progress.muted;
    sound.mute(progress.muted);
    if (!progress.muted) sound.play("pick");
    saveProgress();
    const old = screen.querySelector(".sound");
    if (old) old.outerHTML = soundButton();
  }

  stage.addEventListener("click", event => {
    if (event.target === modal) {
      closeDialog();
      return;
    }
    const target = event.target.closest("[data-action]");
    if (!target || target.disabled) return;
    const action = target.dataset.action;
    sound.prepare();
    if (action !== "sound" && action !== "start" && action !== "end") sound.play("pick");
    switch (action) {
      case "start": start(); break;
      case "title": showTitle(); break;
      case "end": nextTurn(); break;
      case "pause": pauseDialog(); break;
      case "rules": rulesDialog(); break;
      case "close": closeDialog(); break;
      case "sound": toggleSound(); break;
      case "catalog": showCatalog(); break;
      case "gallery-back": galleryBack === "result" && result ? resultPanel() : showTitle(); break;
      case "gallery-prev": page--; showCatalog(false); break;
      case "gallery-next": page++; showCatalog(false); break;
      case "album-detail": cardDetail(target.dataset.card); break;
      case "prize-detail": cardDetail(result.prize); break;
    }
  });

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function motion(ms) {
    return shortMotion.matches ? Math.min(120, ms) : ms;
  }

  function originFor(move, side) {
    if (move.kind === "attack") return document.getElementById(`unit-${move.uid}`);
    if (side === 1) return document.getElementById("foe-hand");
    return document.getElementById(`hand-${move.uid}`);
  }

  function targetNode(target) {
    if (!target) return null;
    switch (target.kind) {
      case "unit": return document.getElementById(`unit-${target.id}`);
      case "slot": return document.getElementById(`slot-${target.side}-${target.index}`);
      case "hero": return document.getElementById(`hero-${target.side}`);
      case "altar": return document.getElementById(`altar-${target.side}`) || screen.querySelector(".slot-row.north");
    }
    return null;
  }

  function stagePoint(x, y, bounds = stage.getBoundingClientRect()) {
    return { x: (x - bounds.left) * WIDTH / bounds.width, y: (y - bounds.top) * HEIGHT / bounds.height };
  }

  function metrics(node) {
    if (!node) return null;
    const box = node.getBoundingClientRect();
    const bounds = stage.getBoundingClientRect();
    const topLeft = stagePoint(box.left, box.top, bounds);
    const bottomRight = stagePoint(box.right, box.bottom, bounds);
    return {
      x: (topLeft.x + bottomRight.x) / 2, y: (topLeft.y + bottomRight.y) / 2,
      left: topLeft.x, top: topLeft.y, w: bottomRight.x - topLeft.x, h: bottomRight.y - topLeft.y
    };
  }

  const keyOf = target => `${target.kind}-${target.side}-${target.id ?? target.index ?? ""}`;

  function snapshot() {
    const positions = new Map();
    for (const side of [0, 1]) {
      for (const unit of rules.units(game, side)) {
        const target = rules.atUnit(side, unit);
        positions.set(keyOf(target), { ...metrics(targetNode(target)), unit: { ...unit } });
      }
      positions.set(keyOf(rules.hero(side)), metrics(targetNode(rules.hero(side))));
    }
    return positions;
  }

  function addFx(className, html = "") {
    const node = document.createElement("div");
    node.className = className;
    node.innerHTML = html;
    fx.append(node);
    return node;
  }

  function placement(element, x, y) {
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
  }

  function eraseTrail() {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function paintTrail(from, to, hostile, locked) {
    eraseTrail();
    if (!from || !to || shortMotion.matches) return;
    const bend = Math.min(47, Math.abs(to.y - from.y) * .19);
    const offset = to.x >= from.x ? -bend : bend;
    const control1 = { x: from.x + offset, y: from.y + (to.y - from.y) * .38 };
    const control2 = { x: to.x + offset, y: to.y + (from.y - to.y) * .30 };
    const angle = Math.atan2(to.y - control2.y, to.x - control2.x);
    const color = hostile ? "#ffd29e" : "#9bf7e0";
    context.save();
    context.scale(2, 2);
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.bezierCurveTo(control1.x, control1.y, control2.x, control2.y, to.x, to.y);
    context.setLineDash(locked ? [] : [4, 5]);
    context.lineWidth = locked ? 2.6 : 1.5;
    context.strokeStyle = color;
    context.shadowColor = color;
    context.shadowBlur = locked ? 15 : 6;
    context.stroke();
    context.setLineDash([]);
    context.beginPath();
    context.moveTo(to.x, to.y);
    context.lineTo(to.x - 11 * Math.cos(angle - .52), to.y - 11 * Math.sin(angle - .52));
    context.moveTo(to.x, to.y);
    context.lineTo(to.x - 11 * Math.cos(angle + .52), to.y - 11 * Math.sin(angle + .52));
    context.stroke();
    context.restore();
  }

  function animateCard(id, unit, from, to, type) {
    if (!from || !to) return Promise.resolve();
    const width = type === "attack" ? 93 : 84;
    const height = type === "attack" ? 99 : 113;
    const copy = addFx("fly-card", cardFace(id, { unit, showText: !unit, extra: unit ? "board-card" : "" }));
    copy.style.width = `${width}px`;
    copy.style.height = `${height}px`;
    const transform = (p, scale, angle) => `translate(${p.x - width / 2}px, ${p.y - height / 2}px) scale(${scale}) rotate(${angle}deg)`;
    const endScale = type === "attack" ? .82 : Math.min(1.12, Math.max(.58, (to.w || width) / width));
    const keyframes = [
      { transform: transform(from, .93, type === "attack" ? -4 : 4), opacity: .92 },
      { transform: transform(to, endScale, type === "attack" ? 6 : 0), opacity: .94, offset: .82 },
      { transform: transform(to, endScale, 0), opacity: .15 }
    ];
    const flight = copy.animate(keyframes, { duration: motion(type === "attack" ? 285 : 235), easing: "cubic-bezier(.32,.03,.25,1)" });
    return flight.finished.catch(() => {}).then(() => copy.remove());
  }

  function burst(point, color, count = 13, distance = 65) {
    if (!point) return;
    const ring = addFx("impact-ring");
    placement(ring, point.x, point.y);
    ring.style.setProperty("--spark", color);
    setTimeout(() => ring.remove(), 560);
    for (let i = 0; i < count; i++) {
      const spark = addFx("spark");
      const angle = i / count * Math.PI * 2 + Math.random() * .25;
      const radius = distance * (.36 + Math.random() * .77);
      placement(spark, point.x, point.y);
      spark.style.setProperty("--spark", color);
      spark.style.setProperty("--dx", `${Math.cos(angle) * radius}px`);
      spark.style.setProperty("--dy", `${Math.sin(angle) * radius}px`);
      spark.style.setProperty("--time", `${360 + Math.random() * 340}ms`);
      setTimeout(() => spark.remove(), 720);
    }
  }

  function popNumber(point, event) {
    const isHeal = event.type === "heal";
    const float = addFx(`hit-number ${isHeal ? "healed" : ""}`);
    float.textContent = `${isHeal ? "+" : "−"}${event.amount}`;
    placement(float, point.x, point.y - (point.h || 70) * .39);
    setTimeout(() => float.remove(), 800);
  }

  function fallCard(point, id) {
    if (!point?.unit) return;
    const copy = addFx("fallen", cardFace(id, { unit: point.unit, showText: false, extra: "board-card" }));
    placement(copy, point.left, point.top);
    copy.style.width = `${point.w}px`;
    copy.style.height = `${point.h}px`;
    const fading = copy.animate([
      { transform: "scale(1) rotate(0deg)", filter: "brightness(1.4)", opacity: .9 },
      { transform: "translateY(16px) scale(.79) rotate(-9deg)", filter: "brightness(.56)", opacity: 0 }
    ], { duration: motion(420), easing: "ease-out" });
    fading.finished.catch(() => {}).then(() => copy.remove());
  }

  function showEffects(events, old, fallback) {
    const flashed = new Set();
    for (const event of events) {
      if (!event.target) continue;
      const node = targetNode(event.target);
      const point = metrics(node) || old.get(keyOf(event.target)) || fallback;
      if (!point) continue;
      if (event.type === "damage" || event.type === "heal") {
        popNumber(point, event);
        burst(point, event.type === "heal" ? "#a5ffe0" : "#ffac91", 10, 47);
      }
      if (event.type === "fall") {
        fallCard(old.get(keyOf(event.target)), event.card);
        burst(point, "#d3aff4", 14, 66);
      }
      if (event.type === "summon" || event.type === "buff") {
        burst(point, event.type === "summon" ? "#b6f7dd" : "#efdca0", 15, 60);
      }
      if (node && !flashed.has(node)) {
        flashed.add(node);
        node.animate([{ filter: "brightness(1.65)" }, { filter: "brightness(1)" }], { duration: motion(390), easing: "ease-out" });
      }
    }
    if (events.some(event => event.type === "fall")) {
      setTimeout(() => sound.play("fall"), 115);
    }
  }

  function moveLabel(move, side) {
    const card = rules.cards[move.card];
    if (move.kind === "attack") {
      const foe = rules.unitAt(game, move.target);
      const target = foe ? rules.cards[foe.id].name : HERO_NAMES[1 - side];
      return `${card.name} → ${target}に攻撃`;
    }
    const verb = card.kind === "unit" ? "を召喚" : card.kind === "gear" ? "を装備" : "を発動";
    return card.name + verb;
  }

  async function revealCpu(id) {
    const copy = addFx("cpu-peek", cardFace(id));
    copy.animate([
      { opacity: 0, transform: "translateY(-27px) scale(.68)" },
      { opacity: 1, transform: "translateY(0) scale(1)" }
    ], { duration: motion(208), easing: "cubic-bezier(.2,.85,.2,1)" });
    sound.play("pick");
    await wait(680);
    const from = metrics(copy);
    copy.remove();
    return from;
  }

  async function commit(move, side, fromDrop = null) {
    const match = game;
    if (!match || busy || match.active !== side || match.winner !== null) return false;
    const targets = move.kind === "play" ? rules.playTargets(match, side, move.uid) : rules.attackTargets(match, side, move.uid);
    if (!targets.some(target => rules.sameTarget(move.target, target))) return false;

    busy = true;
    syncControls();
    const label = moveLabel(move, side);
    setLine(label);
    const old = snapshot();
    const target = metrics(targetNode(move.target));
    const source = originFor(move, side);
    const unit = move.kind === "attack" ? rules.units(match, side).find(item => item.uid === move.uid) : null;
    let from = fromDrop || metrics(source);
    const card = rules.cards[move.card];

    if (move.kind === "play" && side === 1) {
      from = await revealCpu(move.card);
      if (game !== match) return false;
    }
    if (move.kind === "attack") {
      sound.play("slash");
      paintTrail(from, target, true, true);
    }
    if (source && (move.kind === "attack" || side === 0)) source.classList.add("drag-origin");
    await animateCard(move.card, unit, from, target, move.kind);
    eraseTrail();
    if (game !== match) return false;

    const events = rules.execute(match, side, move);
    if (!events) {
      busy = false;
      renderBattle();
      return false;
    }

    const notice = drawNotice(events);
    if (notice) actionLabel = notice;
    renderBattle(events);
    if (move.kind === "attack") sound.play("hit");
    else sound.play(card.kind === "unit" ? "summon" : "magic");
    showEffects(events, old, target);
    if (move.kind === "play" && !events.some(event => event.target)) burst(target, "#dec8ff");

    if (match.winner !== null) {
      await displayResultAfter(match, 960);
      return true;
    }
    await wait(side === 1 ? (move.kind === "attack" ? 485 : 400) : 115);
    if (game === match) {
      busy = false;
      syncControls();
    }
    return true;
  }

  async function runCpu(match, firstPause) {
    await wait(firstPause);
    while (game === match && match.winner === null && match.active === 1) {
      if (modalKind) {
        await wait(130);
        continue;
      }
      const move = rules.cpuMove(match);
      if (!move) {
        turnToOther(1);
        return;
      }
      await commit(move, 1);
    }
  }

  function intentOf(node) {
    const uid = Number(node.dataset.hand || node.dataset.unit);
    return { kind: node.dataset.hand ? "play" : "attack", uid, card: node.dataset.card };
  }

  function playerTargets(intent, node) {
    if (busy || node.dataset.side === "1" || game.active !== 0) return [];
    return intent.kind === "play"
      ? rules.playTargets(game, 0, intent.uid)
      : rules.attackTargets(game, 0, intent.uid);
  }

  function clearHighlights() {
    screen.querySelectorAll(".drag-target, .drag-origin").forEach(node =>
      node.classList.remove("drag-target", "drag-target-hostile", "selected-target", "drag-origin"));
  }

  function highlight(targets, selected) {
    screen.querySelectorAll(".drag-target").forEach(node =>
      node.classList.remove("drag-target", "drag-target-hostile", "selected-target"));
    for (const target of targets) {
      const node = targetNode(target);
      if (!node) continue;
      node.classList.add("drag-target");
      if (target.side === 1) node.classList.add("drag-target-hostile");
      if (rules.sameTarget(target, selected)) node.classList.add("selected-target");
    }
  }

  function clearInspection() {
    if (drag) {
      clearTimeout(drag.timer);
      drag.copy?.remove();
      drag.label?.remove();
      const pointer = drag.pointer;
      drag = null;
      if (stage.hasPointerCapture(pointer)) stage.releasePointerCapture(pointer);
    }
    keyPick = null;
    clearHighlights();
    eraseTrail();
  }

  function pickTarget(targets, point) {
    const slop = 5;
    return targets.find(target => {
      const box = metrics(targetNode(target));
      return box && point.x >= box.left - slop && point.x <= box.left + box.w + slop &&
        point.y >= box.top - slop && point.y <= box.top + box.h + slop;
    });
  }

  function targetLabel(target, attacking) {
    if (attacking) return target.kind === "hero" ? "相手を直接攻撃" : "このユニットを攻撃";
    switch (target.kind) {
      case "slot": return "ここに召喚";
      case "altar": return "ここで発動";
      case "hero": return target.side === 0 ? "自分に使う" : "相手に使う";
      default: return "このユニットに使う";
    }
  }

  function beginDrag() {
    const selection = drag;
    const attacking = selection.intent.kind === "attack";
    selection.source.classList.add("drag-origin");
    selection.origin = metrics(selection.source);
    selection.copy = addFx("drag-clone", cardFace(selection.intent.card, {
      unit: selection.unit,
      extra: attacking ? "board-card" : "",
      showText: !attacking
    }));
    if (attacking) {
      selection.copy.style.width = "80px";
      selection.copy.style.height = "87px";
    }
    selection.label = addFx("drag-label");
    selection.label.hidden = true;
    showDrag(selection.initial);
    sound.play("pick");
  }

  function showDrag(point) {
    const selection = drag;
    const attacking = selection.intent.kind === "attack";
    const destination = pickTarget(selection.targets, point);
    const target = destination ? metrics(targetNode(destination)) : null;
    const x = Math.max(31, Math.min(371, point.x));
    const y = Math.max(50, Math.min(795, point.y));
    const angle = Math.max(-8, Math.min(8, (point.x - selection.initial.x) / 15));
    // Offset the dragged piece from the finger so the marked target stays legible.
    const offsetX = target && !attacking ? (x < WIDTH / 2 ? 32 : -32) : 0;
    const offsetY = attacking ? -4 : -52;
    selection.copy.style.transform = `translate(${x - (attacking ? 40 : 47) + offsetX}px, ${y + offsetY}px) rotate(${angle}deg)`;
    const hostile = attacking || destination?.side === 1 || rules.cards[selection.intent.card].target === "enemy";
    highlight(selection.targets, destination);
    paintTrail(selection.origin, target || { x, y }, hostile, Boolean(target));
    selection.label.hidden = !target;
    if (target) {
      placement(selection.label, target.x, target.top - 4);
      selection.label.classList.toggle("hostile", hostile);
      selection.label.textContent = targetLabel(destination, attacking);
    }
  }

  stage.addEventListener("pointerdown", event => {
    if (scene !== "battle" || busy || modalKind || !event.isPrimary || event.button !== 0) return;
    const source = event.target.closest("[data-hand], [data-unit]");
    if (!source) return;
    event.preventDefault();
    clearInspection();
    sound.prepare();
    const intent = intentOf(source);
    const targets = playerTargets(intent, source);
    const initial = stagePoint(event.clientX, event.clientY);
    const unit = intent.kind === "attack" ? rules.unitAt(game, { kind: "unit", side: Number(source.dataset.side), id: intent.uid }) : null;
    drag = { pointer: event.pointerId, initial, source, intent, targets, unit, copy: null, timer: null, moved: false };
    stage.setPointerCapture(event.pointerId);
    drag.timer = setTimeout(() => {
      if (drag && !drag.moved) cardDetail(intent.card, unit);
    }, HOLD_TIME);
  });

  stage.addEventListener("pointermove", event => {
    if (drag?.pointer !== event.pointerId) return;
    const point = stagePoint(event.clientX, event.clientY);
    if (!drag.moved && Math.hypot(point.x - drag.initial.x, point.y - drag.initial.y) > 7) {
      drag.moved = true;
      clearTimeout(drag.timer);
      if (drag.targets.length) beginDrag();
    }
    if (drag.copy) showDrag(point);
  });

  stage.addEventListener("pointerup", event => {
    if (drag?.pointer !== event.pointerId) return;
    const selection = drag;
    const point = stagePoint(event.clientX, event.clientY);
    const target = selection.copy ? pickTarget(selection.targets, point) : null;
    const droppedCard = selection.copy ? metrics(selection.copy) : null;
    clearInspection();
    if (target) {
      commit({ ...selection.intent, target }, 0, selection.intent.kind === "attack" ? null : droppedCard);
    } else if (droppedCard) {
      animateCard(selection.intent.card, selection.unit, droppedCard, metrics(selection.source), selection.intent.kind);
    }
  });

  for (const type of ["pointercancel", "lostpointercapture"]) {
    stage.addEventListener(type, event => {
      if (drag?.pointer === event.pointerId) clearInspection();
    });
  }
  window.addEventListener("blur", () => {
    if (drag || keyPick) clearInspection();
  });

  function focusTarget() {
    const { targets, index, source } = keyPick;
    const target = targets[index];
    highlight(targets, target);
    targetNode(target)?.focus({ preventScroll: true });
    paintTrail(metrics(source), metrics(targetNode(target)), target.side === 1, true);
    announce.textContent = targetLabel(target, keyPick.intent.kind === "attack") + "。矢印キーで選択、Enterで実行。";
  }

  stage.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (modalKind) closeDialog();
      else if (keyPick) {
        const source = keyPick.source;
        clearInspection();
        source.focus({ preventScroll: true });
      }
      return;
    }
    if (modalKind || scene !== "battle" || busy) return;

    if (keyPick) {
      if (event.key.startsWith("Arrow") || event.key === "Tab") {
        event.preventDefault();
        const step = ["ArrowLeft", "ArrowUp"].includes(event.key) || event.shiftKey ? -1 : 1;
        keyPick.index = (keyPick.index + step + keyPick.targets.length) % keyPick.targets.length;
        focusTarget();
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const move = { ...keyPick.intent, target: keyPick.targets[keyPick.index] };
        clearInspection();
        commit(move, 0);
      }
      return;
    }
    const source = event.target.closest("[data-hand], [data-unit]");
    if (!source || !["Enter", " ", "i", "I"].includes(event.key)) return;
    event.preventDefault();
    const intent = intentOf(source);
    const targets = playerTargets(intent, source);
    if (!targets.length || event.key.toLowerCase() === "i") {
      const unit = intent.kind === "attack" ? rules.unitAt(game, { kind: "unit", side: Number(source.dataset.side), id: intent.uid }) : null;
      cardDetail(intent.card, unit);
      return;
    }
    keyPick = { source, intent, targets, index: 0 };
    sound.prepare();
    sound.play("pick");
    focusTarget();
  });

  fit();
  showTitle();
  // Warm the small illustrations before the first draw or AI reveal.
  window.addEventListener("load", () => {
    for (const name of ["board", "portrait-you", "portrait-cpu", ...Object.values(rules.cards).map(card => card.art)]) {
      const image = new Image();
      image.src = `assets/${name}.webp`;
    }
  });
}());
