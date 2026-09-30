// 일본어 가나(이름) → 한글. 두 가지 표기를 함께 낸다.
// standard = 국립국어원 외래어 표기법(일본어): 어두 청음은 예사소리(か→가), 어중은 거센소리(か→카), つ→쓰, ん→ㄴ, っ→ㅅ, 장음 미표기
// sound    = 소리에 가까운 표기: 어두도 거센소리(かとう→카토), つ→츠. 일본인이 "가토" 를 が 로 읽는 문제를 피한다

const HANGUL_START = 0xac00;
const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const JUNG = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];
const JONG = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

const VOWEL = { a: "ㅏ", i: "ㅣ", u: "ㅜ", e: "ㅔ", o: "ㅗ" };
const Y_VOWEL = { a: "ㅑ", u: "ㅠ", o: "ㅛ" };

// 가나 한 글자 → [자음 종류, 모음]. 자음 종류는 아래 initialFor 가 위치·표기에 따라 한글 초성으로 바꾼다
const KANA = {};
const ROW = (cons, chars) => [..."aiueo"].forEach((v, i) => { if (chars[i] !== "_") KANA[chars[i]] = [cons, v]; });
ROW("", "あいうえお");
ROW("k", "かきくけこ");
ROW("g", "がぎぐげご");
ROW("s", "さしすせそ");
ROW("z", "ざじずぜぞ");
ROW("t", "た__てと");
KANA["ち"] = ["ch", "i"];
KANA["つ"] = ["ts", "u"];
ROW("d", "だぢづでど");
ROW("n", "なにぬねの");
ROW("h", "はひふへほ");
ROW("b", "ばびぶべぼ");
ROW("p", "ぱぴぷぺぽ");
ROW("m", "まみむめも");
ROW("y", "や_ゆ_よ");
ROW("r", "らりるれろ");
KANA["わ"] = ["w", "a"];
KANA["を"] = ["", "o"];
const SMALL_Y = { "ゃ": "a", "ゅ": "u", "ょ": "o" };
const SMALL_V = { "ぁ": "a", "ぃ": "i", "ぅ": "u", "ぇ": "e", "ぉ": "o" };

function toHiragana(text) {
  return [...text.normalize("NFC")].map((ch) => {
    const c = ch.codePointAt(0);
    return c >= 0x30a1 && c <= 0x30f6 ? String.fromCodePoint(c - 0x60) : ch;
  }).join("");
}

/** 초성: 어두 청음은 표준이면 예사소리, 소리 표기면 거센소리. 어중은 둘 다 거센소리 */
function initialFor(cons, initial, mode) {
  const tense = !initial || mode === "sound";
  switch (cons) {
    case "": case "y": case "w": return "ㅇ";
    case "k": return tense ? "ㅋ" : "ㄱ";
    case "g": return "ㄱ";
    case "s": return "ㅅ";
    case "z": return "ㅈ";
    case "t": return tense ? "ㅌ" : "ㄷ";
    case "ch": return tense ? "ㅊ" : "ㅈ";
    case "ts": return mode === "sound" ? "ㅊ" : "ㅆ";
    case "d": return "ㄷ";
    case "n": return "ㄴ";
    case "h": case "f": return "ㅎ";
    case "b": return "ㅂ";
    case "p": return "ㅍ";
    case "m": return "ㅁ";
    case "r": return "ㄹ";
    default: return "ㅇ";
  }
}

function medialFor(cons, vowel, glide) {
  if (glide === "y") return Y_VOWEL[vowel] ?? VOWEL[vowel];
  if (cons === "w") return "ㅘ";
  if (cons === "y") return Y_VOWEL[vowel];
  // す·ず·つ·づ 는 으 모음(스·즈·쓰)
  if (vowel === "u" && ["s", "z", "ts", "d"].includes(cons)) return "ㅡ";
  return VOWEL[vowel];
}

function compose(ini, med, fin = "") {
  return String.fromCodePoint(HANGUL_START + CHO.indexOf(ini) * 588 + JUNG.indexOf(med) * 28 + JONG.indexOf(fin));
}

/** 한 단어(띄어쓰기 없는 가나)를 음절 목록으로 */
function convertWord(word, mode, unknown) {
  const out = []; // { ini, med, fin } 또는 { raw }
  let prevVowel = "";
  const chars = [...word];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const last = out[out.length - 1];
    if (ch === "ー") continue; // 장음 부호는 적지 않는다
    if (ch === "ん") {
      if (last && !last.raw) last.fin = "ㄴ";
      continue;
    }
    if (ch === "っ") {
      if (last && !last.raw) last.fin = "ㅅ";
      continue;
    }
    // 장음: お段·う段 뒤의 う, お段 뒤의 お 는 적지 않는다(さとう→사토, おおの→오노)
    if ((ch === "う" && (prevVowel === "o" || prevVowel === "u")) || (ch === "お" && prevVowel === "o")) continue;
    const base = KANA[ch];
    if (!base) {
      unknown.push(ch);
      out.push({ raw: ch });
      prevVowel = "";
      continue;
    }
    let [cons, vowel] = base;
    let glide = "";
    const next = chars[i + 1];
    if (next in SMALL_Y && vowel === "i") {
      glide = "y";
      vowel = SMALL_Y[next];
      i++;
    } else if (next in SMALL_V) {
      // ファ・ティ・ウィ 같은 외래 가나: 자음은 두고 모음만 바꾼다(ふぁ→파 는 표기법상 ㅍ)
      if (cons === "h" && vowel === "u") cons = "p";
      if (cons === "" && vowel === "u") cons = "w_";
      vowel = SMALL_V[next];
      i++;
    }
    const initial = out.length === 0;
    let ini = initialFor(cons, initial, mode);
    let med = medialFor(cons, vowel, glide);
    if (cons === "w_") {
      ini = "ㅇ";
      med = { a: "ㅘ", i: "ㅟ", e: "ㅞ", o: "ㅝ", u: "ㅜ" }[vowel];
    }
    if ((cons === "ch" || cons === "z") && glide === "y") med = VOWEL[vowel]; // ちゃ→자·차, じゃ→자
    if (cons === "s" && glide === "y") med = Y_VOWEL[vowel]; // しゃ→샤
    out.push({ ini, med, fin: "" });
    prevVowel = vowel;
  }
  return out.map((s) => (s.raw ? s.raw : compose(s.ini, s.med, s.fin))).join("");
}

/**
 * @param {string} text 이름(히라가나·가타카나, 성과 이름 사이 띄어쓰기 가능)
 * @returns {{ standard: string, sound: string, unknown: string[] }}
 */
export function kanaToHangul(text) {
  const hira = toHiragana(String(text ?? "")).trim();
  const unknown = [];
  const convert = (mode, collect) => hira.split(/(\s+)/).map((part) => (/^\s+$/.test(part) ? " " : convertWord(part, mode, collect))).join("");
  const standard = convert("standard", unknown);
  const sound = convert("sound", []);
  return { standard, sound, unknown: [...new Set(unknown)] };
}
