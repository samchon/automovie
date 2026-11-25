/**
 * The ffmpeg image-sequence input pattern, such as `frame_%05d.png`, that
 * matches every `frameName` written with the same `ext` and `pad`.
 *
 * Ffmpeg expands `%0<pad>d` to each frame number from 0 upward, so the pattern
 * names the sequence without a shell glob.
 */
export const framePattern: (ext?: string, pad?: number) => string = (
  ext: string = "png",
  pad: number = 5,
): string => `frame_%0${pad}d.${ext}`;
