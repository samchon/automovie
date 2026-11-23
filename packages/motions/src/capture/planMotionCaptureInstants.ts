import type { IAutoMovieMotionHumanPlanMotionCaptureInstants } from "@automovie/interface";

/**
 * The instants a motion case's capture draws, each named by the case's own
 * label: one per second written to the millisecond, the resolution a capture
 * names its cells at.
 *
 * Instants a case lists twice within one millisecond, such as a grip closing at
 * the same frame a release begins, are one still, kept at the first second
 * listed and named by every distinct label joined with `/`, so no beat's name
 * is lost. Order is the case's.
 *
 * @param times The case's instants, each with its label.
 * @returns The instants drawn, with their labels.
 */
export function planMotionCaptureInstants(
  times: IAutoMovieMotionHumanPlanMotionCaptureInstants.ITimes,
): IAutoMovieMotionHumanPlanMotionCaptureInstants.IResult {
  const instants: Map<string, { seconds: number; labels: string[] }> =
    new Map();
  for (const time of times) {
    const key: string = time.seconds.toFixed(3);
    const known: { seconds: number; labels: string[] } | undefined =
      instants.get(key);
    if (known === undefined)
      instants.set(key, { seconds: time.seconds, labels: [time.label] });
    else if (!known.labels.includes(time.label)) known.labels.push(time.label);
  }
  return [...instants.values()].map(
    (instant: {
      seconds: number;
      labels: string[];
    }): { seconds: number; label: string } => ({
      seconds: instant.seconds,
      label: instant.labels.join(" / "),
    }),
  );
}
