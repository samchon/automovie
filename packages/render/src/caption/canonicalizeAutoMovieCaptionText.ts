const PROHIBITED_CAPTION_CONTROLS =
  /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/gu;

/**
 * Normalize one authored caption into the presentation shared by measurement
 * and delivery.
 *
 * CRLF and CR become LF, legal tabs remain intact, and controls prohibited in
 * WebVTT cue text become spaces. Empty authored lines remain empty here so
 * readability counts the exact authored presentation.
 */
export const canonicalizeAutoMovieCaptionText = (value: string): string =>
  value.replace(/\r\n?/gu, "\n").replace(PROHIBITED_CAPTION_CONTROLS, " ");
