/*
 * The read-only input arguments every delivery decode starts with: no banner,
 * no stdin, no progress, fail on the first decoding error, keep the input's own
 * timestamps, then the input itself.
 * Parameter path: The file or image-sequence pattern to decode.
 * Parameter inputOptions: Demuxer options placed before the input, such as an image
 * sequence's `-framerate`.
 * Returns: The leading FFmpeg arguments, with the path as its own argument.
 */
export function planAutoMovieDeliveryInput(
  path: string,
  inputOptions: readonly string[] = [],
): string[] {
  return [
    "-hide_banner",
    "-nostdin",
    "-nostats",
    "-xerror",
    "-copyts",
    ...inputOptions,
    "-i",
    path,
  ];
}
