import { segment } from "./segment";

/** Author the admitted frame/scan/restart JPEG marker grammar with independent four by three extent. The inspector checks container grammar rather than pixel decoding. */
export const jpeg = (
  frameMarker = 0xc0,
  restartInterval?: number | null,
): Uint8Array =>
  new Uint8Array([
    0xff,
    0xd8,
    ...segment(frameMarker, [8, 0, 3, 0, 4, 1, 1, 0x11, 0]),
    ...(typeof restartInterval === "number"
      ? segment(0xdd, [restartInterval >>> 8, restartInterval & 0xff])
      : []),
    ...segment(0xda, [1, 1, 0, 0, 63, 0]),
    0x11,
    0xff,
    0x00,
    0x22,
    ...(restartInterval === undefined ? [] : [0xff, 0xd0]),
    0x33,
    0xff,
    0xd9,
  ]);
