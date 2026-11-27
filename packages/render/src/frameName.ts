/*
 * The file name of output frame `index` in an ffmpeg image sequence, such as
 * `frame_00042.png`.
 *
 * The index is zero-padded to `pad` digits and grows wider past `10^pad - 1`,
 * exactly as `framePattern`'s `%0<pad>d` prints it, so ffmpeg reads every name
 * this function writes. `index` must be a non-negative safe integer and `ext`
 * an extension without the dot; these premises are not checked here. The guide
 * passes add their pass tag to `ext`.
 */
export const frameName: (
  index: number,
  ext?: string,
  pad?: number,
) => string = (index: number, ext: string = "png", pad: number = 5): string =>
  `frame_${String(index).padStart(pad, "0")}.${ext}`;
