/**
 * Escape the three characters WebVTT reads as cue-text syntax: `&`, `<` and
 * `>`.
 *
 * Cue payloads and single-line annotations share this escape, because a caption
 * that escaped one but not the other would publish markup in one field and
 * literal text in the other.
 */
export const escapeWebVttText: (value: string) => string = (
  value: string,
): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
