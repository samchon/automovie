import type { IAutoMoviePlanVideoSceneCutsProps } from "@automovie/interface";

import { videoStreamMap } from "./videoStreamMap";

/*
 * Plan the FFmpeg arguments that detect a video file's scene cuts with the
 * `scdet` filter and write each cut to a report, which
 * `readVideoSceneCuts` reads.
 *
 * `scdet` scores how much each frame differs from the one before, from 0 to
 * 100, and marks a frame whose score reaches `threshold` as the first frame of
 * a new scene; FFmpeg's default threshold is 10. The `metadata` filters keep
 * only marked frames and print each one's time and score to `report`. The
 * decoded frames go to the null muxer, so nothing else is written. The report
 * path is escaped for both levels of FFmpeg's filter-graph syntax, so a drive
 * letter or a comma in it stays part of the path.
 *
 * It throws for a threshold outside 0 to 100.
 *
 * ```ts
 * await run(
 *   planVideoSceneCuts({
 *     file: "delivery.mp4",
 *     report: `${folder.directory}/scenecut.txt`,
 *     threshold: 10,
 *   }),
 * );
 * ```
 */
export function planVideoSceneCuts(
  props: IAutoMoviePlanVideoSceneCutsProps,
): string[] {
  if (!(props.threshold >= 0 && props.threshold <= 100))
    throw new Error(
      `A scene-cut threshold of ${props.threshold} is not a score from 0 to 100`,
    );

  // Level one escapes a filter option's value, level two the filter graph around it.
  const option: string = props.report.replace(/[\\':]/gu, "\\$&");
  const graph: string = option.replace(/[\\'[\],;]/gu, "\\$&");
  return [
    "-hide_banner",
    "-nostats",
    "-i",
    props.file,
    "-map",
    videoStreamMap(props.streamIndex),
    "-an",
    "-vf",
    `scdet=threshold=${props.threshold},metadata=mode=select:key=lavfi.scd.time,metadata=mode=print:file=${graph}`,
    "-f",
    "null",
    "-",
  ];
}
