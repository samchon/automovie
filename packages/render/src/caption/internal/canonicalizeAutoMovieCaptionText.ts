/*
 * Normalize one authored caption into the presentation shared by readability
 * measurement and WebVTT delivery.
 *
 * CRLF and lone CR become LF, tabs stay intact, and every other C0 control and
 * DEL becomes one space. Lines are never reflowed or trimmed, and empty lines
 * stay empty here so readability counts the exact authored presentation; the
 * cue serializer, not this function, makes an empty line survive WebVTT.
 */
export const canonicalizeAutoMovieCaptionText: (value: string) => string = (
  value: string,
): string =>
  value.replace(/\r\n?/gu, "\n").replace(PROHIBITED_CAPTION_CONTROLS, " ");

const PROHIBITED_CAPTION_CONTROLS: RegExp =
  /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/gu;
