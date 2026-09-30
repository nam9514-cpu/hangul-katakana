// 가사 카드의 배치 규칙(순수 함수 — 캔버스 없이 테스트한다)

export const MAX_CARD_CHARS = 400;

/**
 * 한 단어가 한 줄 폭보다 길면 음절 단위로 나눈다(띄어쓰기 없는 긴 가사가 카드 밖으로 나가지 않게).
 * @template {{ w: number }} T
 * @param {T[]} cells
 * @param {number} maxWidth
 * @returns {T[][]}
 */
export function splitLongWord(cells, maxWidth) {
  const parts = [[]];
  let width = 0;
  for (const cell of cells) {
    if (width > 0 && width + cell.w > maxWidth) {
      parts.push([]);
      width = 0;
    }
    parts[parts.length - 1].push(cell);
    width += cell.w;
  }
  return parts;
}

/** 너무 긴 입력은 자른다 — 측정·그리기가 음절마다 돌아 수십만 자면 화면이 멈춘다. */
export function clampInput(text) {
  if (text.length <= MAX_CARD_CHARS) return { text, truncated: false };
  return { text: `${text.slice(0, MAX_CARD_CHARS)}…`, truncated: true };
}
