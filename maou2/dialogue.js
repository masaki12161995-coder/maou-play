(() => {
"use strict";
const NATIVE_DOTS = 1.5;
const TYPE_STEP = 42;
const HOLD_DELAY = 450;
const HOLD_STEP = 90;
const LEFT = 16;
const WIDTH = 370;
const CHOICE_FOOT = 805;

const PALETTE = {
  shadow: "#17121be0",
  edge: "#785740",
  highlight: "#d4a572",
  seam: "#694b42",
  body: "#29222c",
  inset: "#221d26",
  insetWarm: "#352833",
  pin: "#c49563",
  text: "#f3e2c8",
  title: "#f0c68b",
  tip: "#f1cf9b",
};

function rectangle(ctx, color, x, y, w, h) {
  const left = Math.round(x * NATIVE_DOTS);
  const top = Math.round(y * NATIVE_DOTS);
  ctx.fillStyle = color;
  ctx.fillRect(
    left,
    top,
    Math.round((x + w) * NATIVE_DOTS) - left,
    Math.round((y + h) * NATIVE_DOTS) - top,
  );
}

function trimLettering(value) {
  return String(value ?? "").replace(/\r\n?/g, "\n").trim();
}

function wrap(line, capacity) {
  const lines = [];
  const cannotStart = /^[、。．，！？!?)）〉》」』】…]/u;
  for (const paragraph of line.split("\n")) {
    let remaining = Array.from(paragraph);
    while (remaining.length > capacity) {
      let split = capacity;
      if (cannotStart.test(remaining[split])) split -= 1;
      lines.push(remaining.slice(0, split).join(""));
      remaining = remaining.slice(split);
    }
    lines.push(remaining.join(""));
  }
  return lines;
}

function pageList(value) {
  const input = Array.isArray(value) ? value : [value];
  const pages = [];
  for (const entry of input) {
    const part=entry&&typeof entry==="object"?entry:null;
    const value = trimLettering(part?part.text:entry);
    if (!value) continue;
    const lines = wrap(value, 21);
    for (let idx = 0; idx < lines.length; idx += 3) {
      const page=lines.slice(idx,idx+3);
      if(part&&(part.label||part.sheet||part.icon))page.voice={label:part.label,sheet:part.sheet,icon:part.icon};
      pages.push(page);
    }
  }
  return pages;
}

function revealSchedule(lines) {
  const schedule = [];
  let next = 60;
  const content = lines.join("\n");
  for (const char of content) {
    if (char !== "\n") schedule.push(next);
    if (/[。！？!?]/u.test(char)) next += TYPE_STEP * 5;
    else if (/[、，\n]/u.test(char)) next += TYPE_STEP * 3;
    else if (char === "…") next += TYPE_STEP * 2;
    else next += TYPE_STEP;
  }
  return schedule;
}

function warmFrame(ctx, x, y, width, height, small = false) {
  rectangle(ctx, PALETTE.shadow, x + 3, y + 5, width - 5, height);
  rectangle(ctx, PALETTE.shadow, x + 1, y + 7, width - 2, height - 7);
  rectangle(ctx, PALETTE.edge, x + 3, y, width - 6, height);
  rectangle(ctx, PALETTE.edge, x, y + 4, width, height - 8);
  rectangle(ctx, PALETTE.highlight, x + 5, y + 1, width - 10, 1);
  rectangle(ctx, PALETTE.seam, x + 4, y + height - 3, width - 8, 2);
  rectangle(ctx, PALETTE.body, x + 3, y + 3, width - 6, height - 6);
  rectangle(ctx, PALETTE.insetWarm, x + 5, y + 5, width - 10, height - 10);
  rectangle(ctx, small ? "#352735" : PALETTE.inset, x + 6, y + 7, width - 12, height - 14);
  for (const [dx, dy] of [[5, 5], [width - 7, 5], [5, height - 7], [width - 7, height - 7]]) {
    rectangle(ctx, PALETTE.seam, x + dx - 1, y + dy, 4, 3);
    rectangle(ctx, PALETTE.pin, x + dx, y + dy, 2, 2);
  }
}

function choicePlacement(count) {
  if (!count) return [];
  const columns = count > 3 ? 2 : 1;
  const rows = Math.ceil(count / columns);
  const gap = 8;
  const width = (WIDTH - gap * (columns - 1)) / columns;
  const height = 46;
  const top = CHOICE_FOOT - rows * height - (rows - 1) * gap;
  return Array.from({ length: count }, (_, i) => ({
    x: LEFT + (i % columns) * (width + gap),
    y: top + Math.floor(i / columns) * (height + gap),
    width,
    height,
  }));
}

function label(text, x, y, size, color = PALETTE.text, align = "left") {
  return { text, x, y, size, color, align };
}

class Dialogue {
  constructor(bank) {
    this.bank = bank;
    this.entry = null;
    this.hold = null;
    this.now = 0;
  }

  get isOpen() {
    return this.entry !== null;
  }

  get state() {
    const entry = this.entry;
    if (!entry) return null;
    return {
      label: entry.label,
      line: entry.pages[entry.pageIndex].join("\n"),
      pages: entry.pages.map(lines => lines.join("\n")),
      source: entry.source,
      sheet: entry.sheet,
      icon: entry.icon,
      pageIndex: entry.pageIndex,
      pageCount: entry.pages.length,
      phase: entry.phase,
      atChoices: entry.phase === "choices",
      revealComplete: entry.shown >= entry.times.length,
      visibleLine: this.visibleLines().join("\n"),
      selectedChoice: entry.selectedChoice,
      choiceRects: entry.phase === "choices" ? choicePlacement(entry.choices.length) : [],
      choices: entry.choices.map(choice => choice.label),
      holding: Boolean(this.hold),
      holdUsed: this.hold?.used ?? false,
    };
  }

  open(request, time = performance.now()) {
    if (!request) return false;
    const pages = pageList(request.pages?.length ? request.pages : request.line);
    const choices = Array.isArray(request.choices)
      ? request.choices.filter(choice => trimLettering(choice?.label)).map(choice => ({
          label: trimLettering(choice.label),
          response: choice.response,
        }))
      : [];
    if (!pages.length && !choices.length) return false;
    if (!pages.length) pages.push([""]);
    this.now = time;
    this.hold = null;
    this.entry = {
      label: trimLettering(request.label),
      source: request.source ?? "tap",
      sheet: request.sheet,
      icon: request.icon,
      pages,
      choices,
      phase: "dialogue",
      selectedChoice: null, onEnd:request.onEnd, onSelect:request.onSelect,
    };
    this.setPage(0, time);
    return true;
  }

  close() {
    this.entry = null;
    this.hold = null;
  }

  done() {
    const {onEnd,selectedChoice}=this.entry || {};
    this.close();
    onEnd?.(selectedChoice);
  }

  setPage(index, time) {
    const entry = this.entry;
    entry.pageIndex = index;
    entry.start = time;
    entry.shown = 0;
    entry.times = revealSchedule(entry.pages[index]);
  }

  visibleLines() {
    const entry = this.entry;
    let remaining = entry.shown;
    return entry.pages[entry.pageIndex].map(line => {
      const chars = Array.from(line);
      const shown = chars.slice(0, remaining).join("");
      remaining = Math.max(0, remaining - chars.length);
      return shown;
    });
  }

  beginHold(time = performance.now()) {
    if (!this.isOpen || this.hold) return;
    this.hold = { next: time + HOLD_DELAY, used: false };
  }

  endHold(time) {
    if (this.hold && time !== undefined) this.advance(time);
    const used = this.hold?.used ?? false;
    this.hold = null;
    return used;
  }

  nextPage(time) {
    const entry = this.entry;
    if (entry.pageIndex + 1 < entry.pages.length) {
      this.setPage(entry.pageIndex + 1, time);
    } else if (entry.phase === "dialogue" && entry.choices.length) {
      entry.phase = "choices";
    } else {
      this.done();
    }
  }

  advance(time = performance.now()) {
    this.now = time;
    const entry = this.entry;
    if (!entry) return;
    if (entry.phase !== "choices") {
      while (entry.shown < entry.times.length && entry.times[entry.shown] <= time - entry.start) {
        entry.shown += 1;
      }
    }
    const hold = this.hold;
    if (!hold || time < hold.next) return;
    // Consume this gesture as soon as it becomes a hold. Even a hold which
    // began on a choice must release before a fresh tap can select it.
    hold.used = true;
    hold.next = time + HOLD_STEP;
    if (entry.phase === "choices") return;
    if (entry.shown < entry.times.length) {
      entry.shown = entry.times.length;
      return;
    }
    this.nextPage(time);
    if (this.entry && this.entry.phase !== "choices") {
      this.entry.shown = this.entry.times.length;
    }
  }

  tap(x, y) {
    const entry = this.entry;
    if (!entry) return false;
    if (this.hold?.used) return true;
    if (entry.phase === "choices") {
      const index = choicePlacement(entry.choices.length).findIndex(rect =>
        x >= rect.x && x < rect.x + rect.width
        && y >= rect.y && y < rect.y + rect.height,
      );
      if (index < 0) return true;
      const pages = pageList(entry.choices[index].response);
      entry.selectedChoice = index;
      entry.onSelect?.(index);
      if (!pages.length) {
        this.done();
      } else {
        entry.pages = pages;
        entry.phase = "response";
        this.setPage(0, this.now);
      }
    } else if (entry.shown < entry.times.length) {
      entry.shown = entry.times.length;
    } else {
      this.nextPage(this.now);
    }
    return true;
  }

  drawBadge(ctx, entry, x, y) {
    const item = entry.icon == null ? null : this.bank.icons?.[entry.icon];
    const person = entry.sheet == null ? null : this.bank.npcs?.[entry.sheet];
    const image = item ?? person;
    if (!image?.complete || !image.naturalWidth) return false;

    rectangle(ctx, PALETTE.edge, x, y, 34, 35);
    rectangle(ctx, "#161621", x + 2, y + 2, 30, 31);
    rectangle(ctx, "#493842", x + 3, y + 3, 28, 29);
    rectangle(ctx, "#71554b", x + 3, y + 3, 28, 1);
    const left = Math.round((x + 4) * NATIVE_DOTS);
    const top = Math.round((y + 4) * NATIVE_DOTS);
    if (item) {
      ctx.drawImage(item, left + 3, top + 4, 32, 32);
    } else {
      // First row (down), middle column (standing), same bank sheet as field.
      ctx.drawImage(person, 52, 3, 40, 40, left, top, 40, 40);
    }
    return true;
  }

  draw(ctx, time) {
    this.advance(time);
    const entry = this.entry;
    if (!entry) return [];
    const choices = entry.phase === "choices" ? choicePlacement(entry.choices.length) : [];
    const top = choices.length ? choices[0].y - 124 : 614;
    const labels = [];
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    warmFrame(ctx, LEFT, top, WIDTH, 116);
    const voice=entry.pages[entry.pageIndex]?.voice || entry;
    const badge = this.drawBadge(ctx, voice, 30, top + 11);
    if (voice.label) labels.push(label(voice.label, badge ? 74 : 34, top + 26, 16, PALETTE.title));
    rectangle(ctx, "#84624b", 33, top + 46, 336, 1);
    rectangle(ctx, "#392c36", 33, top + 47, 336, 1);

    this.visibleLines().forEach((text, index) => {
      if (text) labels.push(label(text, 34, top + 62 + index * 21, 15));
    });
    if (entry.shown >= entry.times.length && !choices.length) {
      const offset = Math.floor(time / 400) % 2 ? 2 : 0;
      rectangle(ctx, "#705445", 357, top + 98, 8, 2);
      rectangle(ctx, PALETTE.tip, 356, top + 98 + offset, 10, 2);
      rectangle(ctx, PALETTE.tip, 358, top + 100 + offset, 6, 2);
      rectangle(ctx, PALETTE.tip, 360, top + 102 + offset, 2, 2);
    }

    for (let index = 0; index < choices.length; index += 1) {
      const { x, y, width, height } = choices[index];
      warmFrame(ctx, x, y, width, height, true);
      const marker = this.bank.icons?.map;
      if (marker?.complete && marker.naturalWidth) {
        ctx.drawImage(marker, Math.round((x + 13) * NATIVE_DOTS), Math.round((y + 16) * NATIVE_DOTS));
      }
      const lines = wrap(entry.choices[index].label, Math.floor((width - 54) / 15));
      const center = y + height / 2 - (lines.length - 1) * 7;
      lines.forEach((text, row) => labels.push(label(text, x + 37, center + row * 14, 15)));
    }
    ctx.restore();
    return labels;
  }
}

window.Dialogue=Dialogue;
})();
