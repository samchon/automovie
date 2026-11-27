import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type { IAutoMovieMotionHumanDanceBeats } from "@automovie/interface";

/*
 * A groove's envelope over a dance: rising on a minimum-jerk share (Flash and
 * Hogan 1985) from the start to the first beat, full between the first and the
 * last beat, and falling the same way from the last beat to the end.
 * Parameter t: The second.
 * Parameter beats: The dance's beats.
 * Parameter end: The dance's last second.
 * Returns: The envelope, 0 to 1.
 */
export function danceGrooveEnvelope(
  t: number,
  beats: Pick<IAutoMovieMotionHumanDanceBeats, "at" | "count">,
  end: number,
): number {
  const first: number = beats.at(1);
  const last: number = beats.at(beats.count);
  if (t <= first)
    return AutoMovieEngineMotionSampling.minimumJerkShare(Math.max(0, t) / Math.max(1e-9, first));
  if (t >= last)
    return 1 - AutoMovieEngineMotionSampling.minimumJerkShare((t - last) / Math.max(1e-9, end - last));
  return 1;
}
