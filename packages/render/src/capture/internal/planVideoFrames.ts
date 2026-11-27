import type { IAutoMoviePlanVideoFramesProps } from "@automovie/interface";

/*
 * Plan the FFmpeg arguments that extract exactly the given frames of a video
 * file, the file's own pixels, as numbered PNG stills.
 *
 * One `select` expression names every index: a run of consecutive indices as
 * `between(n,first,last)` and a lone index as `eq(n,index)`, joined by `+`.
 * `-fps_mode passthrough` keeps each selected frame once with its own timestamp
 * instead of duplicating or dropping frames to a constant rate. The k-th
 * selected frame, counting from zero in ascending index order, is written as
 * `<directory>/s<k>.png` with `k` padded to five digits, in 8-bit RGB.
 *
 * It throws for an empty list and for an index that is not a whole number of
 * zero or more.
 *
 * ```ts
 * planVideoFrames({
 *   file: "delivery.mp4",
 *   frames: [57, 58, 59, 90],
 *   directory: "out",
 * });
 * // [..., "-vf", "select='between(n,57,59)+eq(n,90)'", "-fps_mode", "passthrough", ...]
 * ```
 */
export function planVideoFrames(
  props: IAutoMoviePlanVideoFramesProps,
): string[] {
  if (props.frames.length === 0)
    throw new Error("A video extraction needs at least one frame");
  for (const frame of props.frames)
    if (!(frame >= 0))
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
