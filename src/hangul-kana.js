// 한글 → 카타카나 발음 표기.
// 글자 그대로가 아니라 "소리 나는 대로" 옮긴다: 연음·ㅎ 탈락·격음화·비음화·유음화·구개음화·경음 반영.
// style: "common" = 일본 팬·여행 회화책의 관용 표기 / "precise" = 받침을 작은 가나로, 이중모음을 살린 학습용 표기.

const CHO = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const JUNG = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];
const JONG = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
const STYLES = new Set(["common", "precise"]);

// 겹받침: [남는 받침, 다음 음절로 넘어가는 자음]
const DOUBLE_FINAL = {
  ㄳ: ["ㄱ", "ㅅ"], ㄵ: ["ㄴ", "ㅈ"], ㄶ: ["ㄴ", "ㅎ"], ㄺ: ["ㄹ", "ㄱ"], ㄻ: ["ㄹ", "ㅁ"],
  ㄼ: ["ㄹ", "ㅂ"], ㄽ: ["ㄹ", "ㅅ"], ㄾ: ["ㄹ", "ㅌ"], ㄿ: ["ㄹ", "ㅍ"], ㅀ: ["ㄹ", "ㅎ"], ㅄ: ["ㅂ", "ㅅ"],
};
// 자음 앞에서 겹받침이 대표로 내는 소리
const DOUBLE_BEFORE_CONSONANT = {
  ㄳ: "ㄱ", ㄵ: "ㄴ", ㄶ: "ㄴ", ㄺ: "ㄱ", ㄻ: "ㅁ", ㄼ: "ㄹ", ㄽ: "ㄹ", ㄾ: "ㄹ", ㄿ: "ㅂ", ㅀ: "ㄹ", ㅄ: "ㅂ",
};
// 받침 대표음(7종성)
const NEUTRAL = {
  ㄱ: "ㄱ", ㄲ: "ㄱ", ㅋ: "ㄱ", ㄴ: "ㄴ", ㄷ: "ㄷ", ㅅ: "ㄷ", ㅆ: "ㄷ", ㅈ: "ㄷ", ㅊ: "ㄷ", ㅌ: "ㄷ", ㅎ: "ㄷ",
  ㄹ: "ㄹ", ㅁ: "ㅁ", ㅂ: "ㅂ", ㅍ: "ㅂ", ㅇ: "ㅇ", "": "",
};
const ASPIRATE = { ㄱ: "ㅋ", ㄷ: "ㅌ", ㅂ: "ㅍ", ㅈ: "ㅊ" };
const TENSE = { ㄱ: "ㄲ", ㄷ: "ㄸ", ㅂ: "ㅃ", ㅅ: "ㅆ", ㅈ: "ㅉ" };
const SONORANT_FINALS = new Set(["ㄴ", "ㄹ", "ㅁ", "ㅇ"]);
const OBSTRUENTS = new Set(["ㄱ", "ㄲ", "ㅋ", "ㄷ", "ㄸ", "ㅌ", "ㅂ", "ㅃ", "ㅍ", "ㅈ", "ㅉ", "ㅊ", "ㅅ", "ㅆ"]);

// 모음 → [모음 종류, 반모음]. 종류는 가나 단(a i u e o), 반모음은 y/w
const VOWEL = {
  ㅏ: ["a", ""], ㅐ: ["e", ""], ㅑ: ["a", "y"], ㅒ: ["e", "y"], ㅓ: ["o", ""], ㅔ: ["e", ""], ㅕ: ["o", "y"],
  ㅖ: ["e", "y"], ㅗ: ["o", ""], ㅘ: ["a", "w"], ㅙ: ["e", "w"], ㅚ: ["e", "w"], ㅛ: ["o", "y"], ㅜ: ["u", ""],
  ㅝ: ["o", "w"], ㅞ: ["e", "w"], ㅟ: ["i", "w"], ㅠ: ["u", "y"], ㅡ: ["u", ""], ㅢ: ["i", "w"], ㅣ: ["i", ""],
};

// 자음 소리 → 가나 5단(a i u e o)
const ROWS = {
  "": ["ア", "イ", "ウ", "エ", "オ"],
  k: ["カ", "キ", "ク", "ケ", "コ"],
  g: ["ガ", "ギ", "グ", "ゲ", "ゴ"],
  s: ["サ", "シ", "ス", "セ", "ソ"],
  t: ["タ", "ティ", "トゥ", "テ", "ト"],
  d: ["ダ", "ディ", "ドゥ", "デ", "ド"],
  n: ["ナ", "ニ", "ヌ", "ネ", "ノ"],
  h: ["ハ", "ヒ", "フ", "ヘ", "ホ"],
  m: ["マ", "ミ", "ム", "メ", "モ"],
  p: ["パ", "ピ", "プ", "ペ", "ポ"],
  b: ["バ", "ビ", "ブ", "ベ", "ボ"],
  r: ["ラ", "リ", "ル", "レ", "ロ"],
  ch: ["チャ", "チ", "チュ", "チェ", "チョ"],
  j: ["ジャ", "ジ", "ジュ", "ジェ", "ジョ"],
};
const COL = { a: 0, i: 1, u: 2, e: 3, o: 4 };
const SMALL = { a: "ャ", u: "ュ", o: "ョ" };
const W_KANA = { a: "ワ", i: "ウィ", e: "ウェ", o: "ウォ", u: "ウ" };
const W_SMALL = { a: "ァ", i: "ィ", e: "ェ", o: "ォ", u: "ゥ" };

const VELAR = ["ㄱ", "ㄲ", "ㅋ"];
const LABIAL = ["ㅂ", "ㅃ", "ㅍ"];
const GEMINATE_BEFORE = { ㄱ: new Set([...VELAR, ...LABIAL]), ㅂ: new Set(LABIAL) };

const FINAL_KANA = {
  common: { ㄱ: "ク", ㄴ: "ン", ㄷ: "ッ", ㄹ: "ル", ㅁ: "ム", ㅂ: "プ", ㅇ: "ン" },
  precise: { ㄱ: "ㇰ", ㄴ: "ン", ㄷ: "ッ", ㄹ: "ㇽ", ㅁ: "ㇺ", ㅂ: "ㇷ゚", ㅇ: "ン" },
};

function isHangul(ch) {
  const code = ch.codePointAt(0);
  return code >= HANGUL_START && code <= HANGUL_END;
}

function decompose(ch) {
  const idx = ch.codePointAt(0) - HANGUL_START;
  return { ini: CHO[Math.floor(idx / 588)], med: JUNG[Math.floor((idx % 588) / 28)], fin: JONG[idx % 28] };
}

// 문자열을 토큰으로: 한글 음절은 {ini, med, fin, space}, 나머지는 {raw}
function tokenize(text) {
  const tokens = [];
  let pendingSpace = false;
  // NFC: 분해형 한글(macOS 복사 등)도 음절로 합친다. \r 은 CRLF 의 찌꺼기라 버린다
  for (const ch of text.normalize("NFC").replace(/\r/g, "")) {
    if (isHangul(ch)) {
      tokens.push({ ...decompose(ch), spaceBefore: pendingSpace });
      pendingSpace = false;
    } else {
      tokens.push({ raw: ch });
      pendingSpace = /\s/.test(ch) && ch !== "\n";
    }
  }
  return tokens;
}

// 관형사형 -ㄹ 뒤에 오는 어미·의존명사: 뒤 자음이 된소리가 된다(표준 발음법 제27항).
// 형태소 분석 없이 자주 쓰는 형태만 목록으로 잡는다. 물건·알게(알다+-게) 같은 오탐을 피하려고 좁게 둔다.
const AFTER_RIEUL_TENSE = new Set(["게", "거", "걸", "겁", "것", "까", "수", "줄", "데"]);
const RIEUL_NOT_ADNOMINAL = new Set(["알", "물", "말", "발", "일", "길", "얼", "절"]);
const HAL_JI = new Set(["할", "을"]); // -ㄹ지: 할지·먹을지 (알지·살지 는 제외)

function adnominalTense(tokens) {
  for (let i = 0; i < tokens.length; i++) {
    const cur = tokens[i];
    if (cur.raw || cur.fin !== "ㄹ") continue;
    // 바로 다음 음절, 또는 공백 하나 건너 다음 음절(할 수 · 먹을 거)
    const j = tokens[i + 1]?.raw === " " ? i + 2 : i + 1;
    const next = tokens[j];
    if (!next || next.raw || !TENSE[next.ini]) continue;
    const curSyl = compose(cur);
    const nextSyl = compose({ ...next, fin: next.fin });
    const nextHead = compose({ ini: next.ini, med: next.med, fin: "" });
    const hit = (AFTER_RIEUL_TENSE.has(nextHead) || AFTER_RIEUL_TENSE.has(nextSyl))
      && !(RIEUL_NOT_ADNOMINAL.has(curSyl) && j === i + 1);
    if (hit || (nextHead === "지" && HAL_JI.has(curSyl))) {
      next.ini = TENSE[next.ini];
      mark(cur, next, "tense");
    }
  }
}

// 두 음절이 한 단어 안에서 붙어 있는가(음운 규칙은 단어 안에서만 적용)
function joined(tokens, i) {
  const a = tokens[i];
  const b = tokens[i + 1];
  return a && b && !a.raw && !b.raw;
}

// 받침과 다음 초성 사이의 음운 변동. 새 토큰 배열을 만든다(입력은 건드리지 않는다).
function applySandhi(input, style) {
  const tokens = input.map((t) => (t.raw ? { ...t } : { ...t, rules: [] }));
  adnominalTense(tokens);
  for (let i = 0; i < tokens.length; i++) {
    const cur = tokens[i];
    if (cur.raw) continue;
    if (!joined(tokens, i)) {
      cur.fin = finalAlone(cur.fin);
      continue;
    }
    const next = tokens[i + 1];
    linkFinal(cur, next, style);
  }
  return tokens;
}

function finalAlone(fin) {
  return NEUTRAL[DOUBLE_BEFORE_CONSONANT[fin] ?? fin];
}

// 적용된 규칙을 양쪽 음절에 기록한다(화면·페이지에서 "왜 이렇게 읽는지" 설명용)
function mark(cur, next, rule) {
  for (const t of [cur, next]) if (!t.rules.includes(rule)) t.rules.push(rule);
}

const PALATAL_VOWELS = new Set(["ㅣ", "ㅕ"]); // 이, 그리고 이+어 가 줄어든 여(붙여 → 부쳐)

function linkFinal(cur, next, style) {
  const fin = cur.fin;
  // 1) ㅎ 계열 받침
  if (fin === "ㅎ" || fin === "ㄶ" || fin === "ㅀ") {
    const rest = fin === "ㅎ" ? "" : DOUBLE_FINAL[fin][0];
    if (next.ini === "ㅇ") {
      cur.fin = "";
      next.ini = rest || "ㅇ";
      mark(cur, next, "h-drop");
      if (rest) mark(cur, next, "liaison");
      return;
    }
    if (ASPIRATE[next.ini]) {
      next.ini = ASPIRATE[next.ini];
      mark(cur, next, "aspiration");
    } else if (next.ini === "ㅅ") {
      next.ini = "ㅆ";
      mark(cur, next, "tense");
    } else if (next.ini === "ㄴ" && !rest) {
      mark(cur, next, "nasal"); // 놓는 → 논는
    }
    cur.fin = rest || (next.ini === "ㄴ" ? "ㄴ" : "");
    if (cur.fin) linkFinal(cur, next, style);
    return;
  }
  // 2) 연음: 받침 + ㅇ초성 → 받침이 넘어간다 (ㅇ받침은 넘어가지 않는다)
  if (next.ini === "ㅇ" && fin && fin !== "ㅇ") {
    const [stay, move] = DOUBLE_FINAL[fin] ?? ["", fin];
    // 구개음화: ㄷ·ㅌ + 이
    let moved = move;
    if (PALATAL_VOWELS.has(next.med) && (move === "ㄷ" || move === "ㅌ")) moved = move === "ㄷ" ? "ㅈ" : "ㅊ";
    // 겹받침의 둘째 소리는 된소리로 넘어간다(없어 → 업써)
    if (stay && TENSE[moved] && OBSTRUENTS.has(NEUTRAL[stay] || stay)) moved = TENSE[moved];
    mark(cur, next, "liaison");
    if (moved !== move && (moved === "ㅈ" || moved === "ㅊ")) mark(cur, next, "palatal");
    if (moved !== move && TENSE[move] === moved) mark(cur, next, "tense");
    cur.fin = stay;
    next.ini = moved;
    return;
  }
  // 2-1) 겹받침 + ㅎ: 앞 받침은 남고 뒤 자음만 ㅎ 과 합쳐진다(앉히다 → 안치다, 밟히다 → 발피다)
  if (next.ini === "ㅎ" && DOUBLE_FINAL[fin] && ASPIRATE[DOUBLE_FINAL[fin][1]]) {
    const [stay, move] = DOUBLE_FINAL[fin];
    cur.fin = stay;
    next.ini = ASPIRATE[move];
    mark(cur, next, "aspiration");
    return;
  }
  let f = NEUTRAL[DOUBLE_BEFORE_CONSONANT[fin] ?? fin];
  // 3) 격음화: 파열음 받침 + ㅎ
  if (next.ini === "ㅎ" && ASPIRATE[f]) {
    let aspirated = ASPIRATE[f];
    if (f === "ㄷ" && PALATAL_VOWELS.has(next.med)) aspirated = "ㅊ"; // 닫히다 → 다치다, 묻혀 → 무쳐
    cur.fin = "";
    next.ini = aspirated;
    mark(cur, next, "aspiration");
    if (aspirated === "ㅊ" && f === "ㄷ") mark(cur, next, "palatal");
    return;
  }
  // 4) ㅎ 약화: 울림소리 받침(ㄴㄹㅁ) 뒤의 ㅎ은 회화에서 거의 들리지 않는다(미안해 → 미아내).
  //    표준 발음법은 ㅎ 을 살리므로 관용(common) 표기에서만 적용한다
  if (style === "common" && next.ini === "ㅎ" && (f === "ㄴ" || f === "ㄹ" || f === "ㅁ")) {
    cur.fin = "";
    next.ini = f;
    mark(cur, next, "h-weak");
    return;
  }
  // 5) 유음화
  if ((f === "ㄴ" && next.ini === "ㄹ") || (f === "ㄹ" && next.ini === "ㄴ")) {
    f = "ㄹ";
    next.ini = "ㄹ";
    mark(cur, next, "lateral");
  }
  // 6) ㄹ의 비음화: ㅁ·ㅇ·ㄱ·ㅂ 뒤 ㄹ → ㄴ
  if (next.ini === "ㄹ" && f !== "ㄹ" && f !== "") {
    next.ini = "ㄴ";
    mark(cur, next, "nasal");
  }
  // 7) 비음화: 파열음 받침 + 비음
  if (next.ini === "ㄴ" || next.ini === "ㅁ") {
    const nasal = { ㄱ: "ㅇ", ㄷ: "ㄴ", ㅂ: "ㅁ" }[f];
    if (nasal) {
      f = nasal;
      mark(cur, next, "nasal");
    }
  }
  // 8) 경음화: 파열음 받침 뒤 예사소리 → 된소리. ㄵ·ㄻ 은 용언 어간에만 있어 뒤가 된소리(앉다 → 안따)
  // 다만 피동·사동 -기- 앞의 ㄻ 은 예외(옮기다 → 옴기다, 굶기다 → 굼기다, 표준 발음법 제24항 다만)
  const causative = fin === "ㄻ" && next.ini === "ㄱ" && (next.med === "ㅣ" || next.med === "ㅕ");
  const stemTense = (fin === "ㄵ" || fin === "ㄻ") && !causative;
  if ((f === "ㄱ" || f === "ㄷ" || f === "ㅂ" || stemTense) && TENSE[next.ini]) {
    next.ini = TENSE[next.ini];
    mark(cur, next, "tense");
  }
  cur.fin = f;
}

function consonantSound(ini, voiced) {
  switch (ini) {
    case "ㄱ": return voiced ? "g" : "k";
    case "ㄲ": case "ㅋ": return "k";
    case "ㄷ": return voiced ? "d" : "t";
    case "ㄸ": case "ㅌ": return "t";
    case "ㅂ": return voiced ? "b" : "p";
    case "ㅃ": case "ㅍ": return "p";
    case "ㅈ": return voiced ? "j" : "ch";
    case "ㅉ": case "ㅊ": return "ch";
    case "ㅅ": case "ㅆ": return "s";
    case "ㄴ": return "n";
    case "ㅁ": return "m";
    case "ㄹ": return "r";
    case "ㅎ": return "h";
    default: return "";
  }
}

function syllableKana(sound, med, style) {
  let [col, glide] = VOWEL[med];
  const hasConsonant = sound !== "";
  if (style === "common" && hasConsonant && glide === "w" && med !== "ㅘ" && med !== "ㅝ") {
    glide = ""; // 관용: 괘·괴·궤 → ケ, 귀 → キ, 긔 → キ
  }
  if (style === "common" && hasConsonant && med === "ㅖ") glide = ""; // 계 → ケ
  const row = ROWS[sound];
  if (glide === "") return row[COL[col]];
  if (glide === "y") {
    if (!hasConsonant) return col === "e" ? "イェ" : { a: "ヤ", u: "ユ", o: "ヨ" }[col];
    if (col === "e") return row[COL.i].slice(0, 1) + "ェ";
    if (sound === "ch" || sound === "j") return row[COL[col]]; // 쟈 → チャ
    // ティ·ディ 는 두 글자라 첫 글자만 자르면 テョ 같은 없는 조합이 된다 → ティョ
    return (row[COL.i].length > 1 ? row[COL.i] : row[COL.i].slice(0, 1)) + SMALL[col];
  }
  // w 반모음
  if (!hasConsonant) return W_KANA[col];
  if (sound === "h") return "フ" + W_SMALL[col];
  const uKana = row[COL.u];
  return uKana + W_SMALL[col];
}

function finalKana(fin, next, style) {
  if (!fin) return "";
  // 관용: 같은 자리 소리 앞의 ㄱ·ㅂ 받침은 촉음(ッ)으로 (학교 → ハッキョ, 떡볶이 → トッポッキ).
  // 다른 자리 앞에서는 ク·プ 를 살린다 — 안 그러면 읽다/있다가 둘 다 イッタ 가 된다
  if (style === "common" && next && GEMINATE_BEFORE[fin]?.has(next.ini)) return "ッ";
  return FINAL_KANA[style][fin];
}

function compose({ ini, med, fin }) {
  const code = HANGUL_START + CHO.indexOf(ini) * 588 + JUNG.indexOf(med) * 28 + JONG.indexOf(fin);
  return String.fromCodePoint(code);
}

/**
 * 음절 단위 변환 결과. 화면에서 "발음이 바뀐 글자" 를 강조하는 데 쓴다.
 * @param {string} text
 * @param {{ style?: "common" | "precise" }} [options]
 * @returns {{ src: string, pron: string, kana: string, changed: boolean, rules: string[], voiced: boolean }[]}
 *   src = 원래 글자, pron = 소리 나는 대로 쓴 한글, kana = 카타카나, changed = 발음이 글자와 다른가
 */
export function toSegments(text, options) {
  const { style = "common" } = options ?? {};
  if (!STYLES.has(style)) throw new Error(`알 수 없는 style: ${style}`);
  const original = tokenize(String(text));
  const tokens = applySandhi(original, style);
  const segments = [];
  let prevVoicedEnd = false; // 직전 소리가 모음·울림소리인가(띄어쓰기는 이어 본다)
  let prevOpen = false; // 직전 음절이 받침 없이 끝났는가(같은 단어 안)
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.raw) {
      segments.push({ src: t.raw, pron: t.raw, kana: t.raw, changed: false, rules: [], voiced: false });
      // 띄어쓰기는 구절 안이라 탁음화를 이어 본다(잘 자 → チャル ジャ). 줄바꿈·문장부호는 끊는다
      if (!(/\s/.test(t.raw) && t.raw !== "\n")) prevVoicedEnd = false;
      prevOpen = false;
      continue;
    }
    const sound = consonantSound(t.ini, prevVoicedEnd);
    let kana = prevOpen && !t.spaceBefore && ["ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ"].includes(t.ini) ? "ッ" : "";
    // 관용: 모음 뒤 예(얼마예요·거예요)는 회화에서 에 → エ
    const yeAfterVowel = style === "common" && t.ini === "ㅇ" && t.med === "ㅖ" && prevOpen && !t.spaceBefore;
    kana += yeAfterVowel ? "エ" : syllableKana(sound, t.med, style);
    const next = joined(tokens, i) ? tokens[i + 1] : null;
    kana += finalKana(t.fin, next, style);
    const src = compose(original[i]);
    const pron = compose(t);
    // 유성음화: 예사소리 ㄱㄷㅂㅈ 이 모음·울림소리 뒤에서 ガ・ダ・バ・ジャ 로 들린다(규칙표와 별도로 알린다)
    const voiced = ["g", "d", "b", "j"].includes(sound);
    segments.push({ src, pron, kana, changed: src !== pron, rules: [...t.rules], voiced });
    prevVoicedEnd = t.fin === "" || SONORANT_FINALS.has(t.fin);
    prevOpen = t.fin === "";
  }
  return segments;
}

/**
 * @param {string} text
 * @param {{ style?: "common" | "precise" }} [options]
 * @returns {string}
 */
/** 규칙 키 → 일본어 이름(화면 표시용) */
export const RULE_NAMES = {
  liaison: "連音化",
  nasal: "鼻音化",
  lateral: "流音化",
  aspiration: "激音化",
  palatal: "口蓋音化",
  tense: "濃音化",
  "h-drop": "ㅎの脱落",
  "h-weak": "ㅎの弱音化",
};

export function toKana(text, options) {
  return toSegments(text, options).map((seg) => seg.kana).join("");
}
