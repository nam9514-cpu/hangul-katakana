import { kanaToHangul } from "../src/kana-hangul.js";
import { toKana } from "../src/hangul-kana.js";
import { SITE_URL } from "../src/config.js";

const $ = (sel) => document.querySelector(sel);
const input = $("#name");

function current() {
  return input.value.trim() || input.placeholder;
}

function render() {
  const r = kanaToHangul(current());
  $("#sound").textContent = r.sound;
  $("#standard").textContent = r.standard;
  // 그 한글을 한국인이 읽으면 어떤 소리인지 — 거꾸로 확인할 수 있게
  $("#sound-read").textContent = toKana(r.sound, { style: "common" });
  $("#standard-read").textContent = toKana(r.standard, { style: "common" });
  const warn = $("#unknown");
  warn.hidden = r.unknown.length === 0;
  warn.textContent = r.unknown.length ? `「${r.unknown.join("")}」は変換できません。漢字は、よみがな（ひらがな）で入れてください。` : "";
  const empty = !input.value.trim();
  $("#save-card").disabled = empty;
  $("#copy-name").disabled = empty;
}

function flash(button, message) {
  const original = button.dataset.label ?? button.textContent;
  button.dataset.label = original;
  button.textContent = message;
  setTimeout(() => { button.textContent = original; }, 1400);
}

const characterImage = new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error("画像を読み込めませんでした"));
  img.src = "../img/tteok-heart.png";
});

async function renderNameCard(korean, kana) {
  await Promise.all([
    document.fonts.load("200px Jua", korean),
    document.fonts.load('700 40px "Zen Maru Gothic"', kana + "のハングル"),
  ]).catch(() => {});
  const W = 1080;
  const H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fbf5ea";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#221a3b";
  ctx.lineWidth = 10;
  ctx.strokeRect(30, 30, W - 60, H - 60);
  ctx.textAlign = "center";
  ctx.fillStyle = "#5c5474";
  ctx.font = '700 44px "Zen Maru Gothic"';
  ctx.fillText(`${kana} のハングル`, W / 2, 150);
  // 이름이 길면 글자 크기를 줄인다
  let size = 220;
  ctx.font = `${size}px Jua`;
  while (ctx.measureText(korean).width > W - 160 && size > 60) {
    size -= 10;
    ctx.font = `${size}px Jua`;
  }
  ctx.fillStyle = "#ffd3e2";
  const w = ctx.measureText(korean).width;
  ctx.fillRect(W / 2 - w / 2 - 10, 250 + size * 0.55, w + 20, size * 0.4);
  ctx.fillStyle = "#221a3b";
  ctx.fillText(korean, W / 2, 250 + size * 0.9);
  const img = await characterImage;
  const ih = 380;
  const iw = (img.width / img.height) * ih;
  ctx.drawImage(img, W / 2 - iw / 2, H - ih - 150, iw, ih);
  ctx.fillStyle = "#5c5474";
  ctx.font = '700 28px "Zen Maru Gothic"';
  const url = new URL(SITE_URL);
  ctx.fillText(`名前をハングルに ｜ ${url.host}${url.pathname}name/`, W / 2, H - 80);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("画像を作れませんでした"))), "image/png");
  });
}

$("#save-card").addEventListener("click", async (e) => {
  const button = e.currentTarget;
  try {
    const r = kanaToHangul(current());
    const blob = await renderNameCard(r.sound, current());
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "hangul-name.png";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
    flash(button, "保存しました");
  } catch {
    flash(button, "保存できませんでした");
  }
});

$("#copy-name").addEventListener("click", async (e) => {
  try {
    await navigator.clipboard.writeText(kanaToHangul(current()).sound);
    flash(e.currentTarget, "コピーしました");
  } catch {
    flash(e.currentTarget, "コピーできませんでした");
  }
});

input.addEventListener("input", render);
render();
