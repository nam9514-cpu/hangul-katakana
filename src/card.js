// 변환 결과를 SNS 에 올리기 좋은 PNG 카드로 그린다(한글 위에 카타카나 루비).
// 하단에 사이트 주소를 넣어, 공유될 때마다 도구가 함께 알려지게 한다.
import { toSegments } from "./hangul-kana.js";

const W = 1080;
const PAD = 72;
const KO_SIZE = 64;
const KANA_SIZE = 24;
const PRON_SIZE = 20;
const LINE_H = KANA_SIZE + KO_SIZE + PRON_SIZE + 34;
const GAP = 22;
const MAX_LINES = 14;
const COLORS = { paper: "#fbf5ea", ink: "#221a3b", soft: "#5c5474", pink: "#ff3d7f", pinkSoft: "#ffd3e2" };

/** 한 줄의 음절을 폭에 맞춰 여러 줄로 나눈다(띄어쓰기 단위로 끊는다). */
function layoutLine(ctx, segments, maxWidth) {
  const rows = [[]];
  let x = 0;
  // 단어 단위로 묶는다
  const words = [];
  let word = [];
  for (const seg of segments) {
    if (seg.src === " ") {
      if (word.length) words.push(word);
      word = [];
    } else {
      word.push(seg);
    }
  }
  if (word.length) words.push(word);
  ctx.font = `${KO_SIZE}px Jua`;
  for (const w of words) {
    const width = w.reduce((sum, seg) => sum + cellWidth(ctx, seg), 0);
    if (x > 0 && x + GAP + width > maxWidth) {
      rows.push([]);
      x = 0;
    }
    rows[rows.length - 1].push(w);
    x += (x > 0 ? GAP : 0) + width;
  }
  return rows;
}

function cellWidth(ctx, seg) {
  ctx.font = `${KO_SIZE}px Jua`;
  const ko = ctx.measureText(seg.src).width;
  ctx.font = `700 ${KANA_SIZE}px "Zen Maru Gothic"`;
  const kana = ctx.measureText(seg.kana).width;
  return Math.max(ko, kana) + 6;
}

function drawRow(ctx, row, y) {
  let x = PAD;
  for (const word of row) {
    for (const seg of word) {
      const w = cellWidth(ctx, seg);
      const cx = x + w / 2;
      if (seg.changed) {
        ctx.fillStyle = COLORS.pinkSoft;
        ctx.fillRect(x + 2, y + KANA_SIZE + KO_SIZE * 0.55, w - 4, KO_SIZE * 0.45);
      }
      ctx.textAlign = "center";
      ctx.fillStyle = seg.changed ? COLORS.pink : COLORS.soft;
      ctx.font = `700 ${KANA_SIZE}px "Zen Maru Gothic"`;
      ctx.fillText(seg.kana, cx, y + KANA_SIZE);
      ctx.fillStyle = COLORS.ink;
      ctx.font = `${KO_SIZE}px Jua`;
      ctx.fillText(seg.src, cx, y + KANA_SIZE + KO_SIZE + 4);
      if (seg.changed) {
        ctx.fillStyle = COLORS.pink;
        ctx.font = `${PRON_SIZE}px Jua`;
        ctx.fillText(seg.pron, cx, y + KANA_SIZE + KO_SIZE + PRON_SIZE + 14);
      }
      x += w;
    }
    x += GAP;
  }
}

/**
 * @param {string} text
 * @param {{ style?: "common" | "precise", siteLabel: string }} options
 * @returns {Promise<Blob>}
 */
export async function renderCard(text, { style = "common", siteLabel }) {
  await document.fonts.ready;
  const measure = document.createElement("canvas").getContext("2d");
  const rows = text.split("\n").filter((l) => l.trim())
    .flatMap((line) => layoutLine(measure, toSegments(line, { style }), W - PAD * 2))
    .slice(0, MAX_LINES);
  const H = PAD * 2 + rows.length * LINE_H + 70;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 6;
  ctx.strokeRect(24, 24, W - 48, H - 48);
  rows.forEach((row, i) => drawRow(ctx, row, PAD + i * LINE_H));
  ctx.textAlign = "right";
  ctx.fillStyle = COLORS.soft;
  ctx.font = `700 22px "Zen Maru Gothic"`;
  ctx.fillText(siteLabel, W - PAD, H - PAD + 10);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("画像を作れませんでした"))), "image/png");
  });
}
