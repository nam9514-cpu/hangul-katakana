import { toSegments } from "./src/hangul-kana.js";

const MAX_LEN = 2000;
const EXAMPLES = ["사랑해요", "감사합니다", "보고 싶어", "잘 먹겠습니다", "괜찮아요", "생일 축하해"];
const STYLE_HINT = {
  common: "よく見るカタカナ表記です。",
  precise: "パッチム（終わりの子音）を小さいカナで書く、勉強向けの表記です。",
};
// ルール説明: 例は画面を開くたびにエンジンで変換する（説明と実際の出力がずれない）
const RULES = [
  { name: "連音化", yomi: "れんおんか", ex: "먹어요", desc: "パッチムが次の母音にくっつく" },
  { name: "鼻音化", yomi: "びおんか", ex: "감사합니다", desc: "ㅂ・ㄱ・ㄷ が ㄴ・ㅁ の前で ㅁ・ㅇ・ㄴ に" },
  { name: "流音化", yomi: "りゅうおんか", ex: "신라", desc: "ㄴ と ㄹ が並ぶと ㄹㄹ に" },
  { name: "激音化", yomi: "げきおんか", ex: "축하해", desc: "ㄱ・ㄷ・ㅂ・ㅈ と ㅎ が合わさって強い音に" },
  { name: "口蓋音化", yomi: "こうがいおんか", ex: "같이", desc: "ㄷ・ㅌ + 이 が 지・치 に" },
  { name: "濃音化", yomi: "のうおんか", ex: "학교", desc: "ㄱ・ㄷ・ㅂ のあとの ㄱ・ㄷ・ㅂ・ㅅ・ㅈ が、濃い音（ㄲ・ㄸ・ㅃ・ㅆ・ㅉ）に" },
  { name: "ㄹのあとの濃音化", yomi: "ㄹのあとののうおんか", ex: "할게", desc: "「〜するね」の -ㄹ게 や -ㄹ 거・-ㄹ 수 は、次の音が濃い音に" },
  { name: "ㅎの弱音化", yomi: "ㅎのじゃくおんか", ex: "미안해", desc: "ㄴ・ㄹ・ㅁ のあとの ㅎ は、会話ではほとんど聞こえない（「ふつう」表記のみ）" },
];

const $ = (sel) => document.querySelector(sel);
const src = $("#src");
const linesEl = $("#lines");
const plainEl = $("#plain");
let style = "common";

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text; // 入力は必ず textContent で描く
  return node;
}

function renderLine(line) {
  const row = el("div", "line");
  if (!line.trim()) {
    row.classList.add("blank");
    return { row, kana: "" };
  }
  const segments = toSegments(line, { style });
  for (const seg of segments) {
    if (seg.src === " ") {
      row.append(el("span", "gap"));
      continue;
    }
    const isHangul = seg.src !== seg.kana || /[가-힣]/.test(seg.src);
    if (!isHangul) {
      row.append(el("span", "raw", seg.src));
      continue;
    }
    const tile = el("ruby", seg.changed ? "tile changed" : "tile");
    tile.append(el("span", "ko", seg.src));
    tile.append(el("rt", "kana", seg.kana));
    if (seg.changed) tile.append(el("span", "pron", seg.pron));
    row.append(tile);
  }
  return { row, kana: segments.map((s) => s.kana).join("") };
}

function render() {
  const empty = !src.value.trim();
  // 空のときは例（placeholder）を薄く見せるだけ。コピーやURLには入れない
  const text = empty ? src.placeholder : src.value.slice(0, MAX_LEN);
  document.querySelector(".result-card").classList.toggle("is-example", empty);
  $("#copy").disabled = empty;
  $("#share").disabled = empty;
  const rendered = text.split("\n").map(renderLine);
  linesEl.replaceChildren(...rendered.map((r) => r.row));
  plainEl.textContent = rendered.map((r) => r.kana).join("\n");
}

function setStyle(next) {
  style = next;
  for (const b of document.querySelectorAll(".toggle button")) {
    b.setAttribute("aria-checked", String(b.dataset.style === next));
  }
  $("#style-hint").textContent = STYLE_HINT[next];
  render();
}

async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    flash(button, "コピーしました");
  } catch {
    flash(button, "コピーできませんでした");
  }
}

function flash(button, message) {
  const original = button.dataset.label ?? button.textContent;
  button.dataset.label = original;
  button.textContent = message;
  setTimeout(() => { button.textContent = original; }, 1400);
}

function shareUrl() {
  const url = new URL(location.href);
  url.search = "";
  if (src.value) url.searchParams.set("t", src.value.slice(0, MAX_LEN));
  if (style !== "common") url.searchParams.set("s", style);
  return url.toString();
}

function setupSpeech() {
  if (!("speechSynthesis" in window)) return;
  const btn = $("#speak");
  const hasKorean = () => speechSynthesis.getVoices().some((v) => v.lang.startsWith("ko"));
  const reveal = () => { btn.hidden = !hasKorean(); };
  reveal();
  speechSynthesis.addEventListener?.("voiceschanged", reveal);
  btn.addEventListener("click", () => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(src.value.trim() || src.placeholder);
    u.lang = "ko-KR";
    u.rate = 0.85;
    speechSynthesis.speak(u);
  });
}

function renderRules() {
  const grid = $("#rule-grid");
  for (const rule of RULES) {
    const card = el("article", "rule");
    const title = el("h3", "", rule.name);
    title.append(el("small", "", rule.yomi));
    const segs = toSegments(rule.ex);
    const ex = el("p", "rule-ex");
    ex.append(el("span", "ko", rule.ex), el("span", "arrow", "→"),
      el("span", "ko pron-ko", segs.map((s) => s.pron).join("")),
      el("span", "kana", segs.map((s) => s.kana).join("")));
    card.append(title, ex, el("p", "rule-desc", rule.desc));
    grid.append(card);
  }
}

function init() {
  const params = new URLSearchParams(location.search);
  src.value = (params.get("t") ?? "").slice(0, MAX_LEN);
  const chips = $("#examples");
  for (const word of EXAMPLES) {
    const chip = el("button", "chip", word);
    chip.type = "button";
    chip.lang = "ko";
    chip.addEventListener("click", () => { src.value = word; render(); src.focus(); });
    chips.append(chip);
  }
  for (const b of document.querySelectorAll(".toggle button")) {
    b.addEventListener("click", () => setStyle(b.dataset.style));
  }
  src.addEventListener("input", render);
  $("#copy").addEventListener("click", (e) => copyText(plainEl.textContent, e.currentTarget));
  $("#share").addEventListener("click", (e) => copyText(shareUrl(), e.currentTarget));
  setupSpeech();
  renderRules();
  setStyle(params.get("s") === "precise" ? "precise" : "common");
}

init();
