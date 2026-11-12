/**
 * Plan the FFmpeg arguments that extract exactly the given frames of a video file, the file's own pixels, as numbered PNG stills.
 *
 * One `select` expression names every index: a run of consecutive indices as `between(n,first,last)` and a lone index as `eq(n,index)`, joined by `+`. `-fps_mode passthrough` keeps each selected frame once with its own timestamp instead of duplicating or dropping frames to a constant rate. The k-th selected frame, counting from zero in ascending index order, is written as `<directory>/s<k>.png` with `k` padded to five digits, in 8-bit RGB.
 *
 * It throws for an empty list and for an index that is not a whole number of zero or more.
 *
 * ```ts
 * planAutoMovieVideoFrames({ file: "delivery.mp4", frames: [57, 58, 59, 90], directory: "out" });
 * // [..., "-vf", "select='between(n,57,59)+eq(n,90)'", "-fps_mode", "passthrough", ...]
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the expression's form, what passthrough keeps, how outputs are numbered and in what order, the pixel format, and both refusals.
 * @evidence contracts/development/implementation.md#principled-implementation FFmpeg's `select` filter evaluates its expression per frame with `n` the frame's index from zero and passes a frame when the expression is non-zero; `eq` and `between` are its documented functions and `+` adds their results, so the expression is non-zero exactly on the listed indices. The image2 muxer numbers outputs consecutively from `-start_number`.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Sort and deduplicate, group runs, write one argument list; running it is the host's injected runner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The quoted expression keeps its commas inside one filter, and no shell is involved, so no shell quoting is added.
 * @evidence contracts/development/implementation.md#efficient-algorithms One sort of the indices, then linear; runs keep the expression short for windows of consecutive frames.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its arguments.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh list and keeps nothing.
 */
export function planAutoMovieVideoFrames(props: {
  /** Path of the video file. */
  file: string;

  /** Indices of the frames to extract, from zero. */
  frames: readonly number[];

  /** Folder the stills are written into. */
  directory: string;
}): string[] {
  if (props.frames.length === 0)
    throw new Error("A video extraction needs at least one frame");
  for (const frame of props.frames)
    if (!(Number.isSafeInteger(frame) && frame >= 0))
      throw new Error(
        `Video frame ${frame} is not a whole number of zero or more`,
      );

  // Runs of consecutive indices, in ascending order.
  const sorted: number[] = [...new Set(props.frames)].sort(
    (a: number, b: number): number => a - b,
  );
  const terms: string[] = [];
  for (let start: number = 0; start < sorted.length; ) {
    let end: number = start;
    while (end + 1 < sorted.length && sorted[end + 1] === sorted[end]! + 1)
      end++;
    terms.push(
      start === end
        ? `eq(n,${sorted[start]})`
        : `between(n,${sorted[start]},${sorted[end]})`,
    );
    start = end + 1;
  }
  return [
    "-hide_banner",
    "-nostats",
    "-y",
    "-i",
    props.file,
    "-an",
    "-vf",
    `select='${terms.join("+")}'`,
    "-fps_mode",
    "passthrough",
    "-pix_fmt",
    "rgb24",
    "-start_number",
    "0",
    `${props.directory}/s%05d.png`,
  ];
}
