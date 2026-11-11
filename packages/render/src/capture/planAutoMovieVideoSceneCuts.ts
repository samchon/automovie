/**
 * Plan the FFmpeg arguments that detect a video file's scene cuts with the `scdet` filter and write each cut to a report, which `readAutoMovieVideoSceneCuts` reads.
 *
 * `scdet` scores how much each frame differs from the one before, from 0 to 100, and marks a frame whose score reaches `threshold` as the first frame of a new scene; FFmpeg's default threshold is 10. The `metadata` filters keep only marked frames and print each one's time and score to `report`. The decoded frames go to the null muxer, so nothing else is written. The report path is escaped for both levels of FFmpeg's filter-graph syntax, so a drive letter or a comma in it stays part of the path.
 *
 * It throws for a threshold outside 0 to 100.
 *
 * ```ts
 * await run(planAutoMovieVideoSceneCuts({ file: "delivery.mp4", report: `${folder.directory}/scenecut.txt`, threshold: 10 }));
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is detected, the score's range and the default threshold, what the report holds, what else is written, how the path is escaped, and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation FFmpeg's `scdet` filter documents the score range and `lavfi.scd.time` on a changed frame; `metadata=mode=select` keeps frames carrying that key and `metadata=mode=print:file=` prints all of their metadata; FFmpeg's filter-graph escaping section gives the two escaping levels applied to the path.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Escape the path, then one argument list; running it is the host's injected runner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The threshold is the caller's, with FFmpeg's default left to the grammar, and no shell is involved, so no shell quoting is added.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the path's length; FFmpeg decodes the file once without audio.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of three values.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh list and keeps nothing.
 */
export function planAutoMovieVideoSceneCuts(props: {
  /** Path of the video file. */
  file: string;

  /** Path the report is written to. */
  report: string;

  /** Score from 0 to 100 at which a frame starts a new scene. */
  threshold: number;
}): string[] {
  if (!(Number.isFinite(props.threshold) && props.threshold >= 0 && props.threshold <= 100))
    throw new Error(`A scene-cut threshold of ${props.threshold} is not a score from 0 to 100`);

  // Level one escapes a filter option's value, level two the filter graph around it.
  const option: string = props.report.replace(/[\\':]/gu, "\\$&");
  const graph: string = option.replace(/[\\'[\],;]/gu, "\\$&");
  return [
    "-hide_banner",
    "-nostats",
    "-i",
    props.file,
    "-an",
    "-vf",
    `scdet=threshold=${props.threshold},metadata=mode=select:key=lavfi.scd.time,metadata=mode=print:file=${graph}`,
    "-f",
    "null",
    "-",
  ];
}
