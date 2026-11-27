import { minimumJerk } from "@automovie/engine";
import type { IAutoMovieMotionHumanDanceBeats } from "@automovie/interface";

/**
 * A groove's envelope over a dance: rising on a minimum-jerk share (Flash and
 * Hogan 1985) from the start to the first beat, full between the first and the
 * last beat, and falling the same way from the last beat to the end.
 *
 * @param t The second.
 * @param beats The dance's beats.
 * @param end The dance's last second.
 * @returns The envelope, 0 to 1.
 */
export function danceGrooveEnvelope(
  t: number,
  beats: Pick<IAutoMovieMotionHumanDanceBeats, "at" | "count">,
  end: number,
): number {
  const first: number = beats.at(1);
  const last: number = beats.at(beats.count);
  if (t <= first)
    return minimumJerk.share(Math.max(0, t) / Math.max(1e-9, first));
  if (t >= last)
    return 1 - minimumJerk.share((t - last) / Math.max(1e-9, end - last));
  return 1;
}
