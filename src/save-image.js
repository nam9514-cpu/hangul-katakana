// 카드 이미지를 저장한다. 휴대폰(터치)에서는 공유 시트 — 아이폰은 "画像を保存" 으로 사진 앱에 들어가고
// X·LINE 으로 바로 보낼 수 있다. PC·공유 미지원이면 다운로드.

function defaultEnv() {
  return { navigator, matchMedia: (q) => window.matchMedia(q), document, URL, File };
}

/**
 * @param {Blob} blob
 * @param {string} filename
 * @param {string} text 공유 시트에 같이 넣을 글
 * @returns {Promise<"shared" | "cancelled" | "downloaded">}
 */
export async function saveImage(blob, filename, text, env = defaultEnv()) {
  const file = new env.File([blob], filename, { type: blob.type || "image/png" });
  const touch = env.matchMedia("(pointer: coarse)").matches;
  if (touch && env.navigator.canShare?.({ files: [file] })) {
    try {
      await env.navigator.share({ files: [file], text });
      return "shared";
    } catch (e) {
      if (e?.name === "AbortError") return "cancelled"; // 사용자가 닫음 — 다운로드를 강요하지 않는다
      // 그 밖의 실패는 아래 다운로드로
    }
  }
  const link = env.document.createElement("a");
  link.href = env.URL.createObjectURL(blob);
  link.download = filename;
  link.style.display = "none";
  env.document.body.appendChild(link); // 문서에 붙여야 Firefox·iOS 에서 click 이 먹는다
  link.click();
  env.document.body.removeChild(link);
  setTimeout(() => env.URL.revokeObjectURL(link.href), 5000);
  return "downloaded";
}
