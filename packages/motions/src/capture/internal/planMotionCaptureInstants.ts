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
  const instants: Map<string, IPlanMotionCaptureInstantsInstantsEntry> =
    new Map();
  for (const time of times) {
    const key: string = time.seconds.toFixed(3);
    const known: IPlanMotionCaptureInstantsKnown | undefined =
      instants.get(key);
    if (known === undefined)
      instants.set(key, { seconds: time.seconds, labels: [time.label] });
    else if (!known.labels.includes(time.label)) known.labels.push(time.label);
  }
  return [...instants.values()].map(
    (
      instant: IPlanMotionCaptureInstantsInstant,
    ): IPlanMotionCaptureInstantsResult => ({
      seconds: instant.seconds,
      label: instant.labels.join(" / "),
    }),
  );
}

/** The record of `IPlanMotionCaptureInstantsResult`'s site. */
type IPlanMotionCaptureInstantsResult = { seconds: number; label: string };

/** The record of `IPlanMotionCaptureInstantsInstant`'s site. */
type IPlanMotionCaptureInstantsInstant = {
  seconds: number;
  labels: string[];
};

/** The record of `IPlanMotionCaptureInstantsKnown`'s site. */
type IPlanMotionCaptureInstantsKnown = { seconds: number; labels: string[] };

/** The record of `IPlanMotionCaptureInstantsInstantsEntry`'s site. */
type IPlanMotionCaptureInstantsInstantsEntry = {
  seconds: number;
  labels: string[];
};
