import type {
  IAutoMovieTimingAnchor,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

/**
 * Locate timing anchors outside the inclusive beat or ahead of their listed
 * predecessor.
 */
export function validateBlockingAnchors(
  out: IAutoMovieViolationCollector,
  path: string,
  anchors: readonly IAutoMovieTimingAnchor[],
  duration: number,
): void {
  let predecessor: number = -Infinity;
  anchors.forEach((anchor: IAutoMovieTimingAnchor, index: number): void => {
    if (anchor.t < 0 || anchor.t > duration)
      out.push(
        "range",
        `${path}[${index}].t`,
        `anchor "${anchor.cue}" must land within [0, ${duration}] (the beat), but was ${anchor.t}`,
        anchor.t,
      );
    if (anchor.t < predecessor)
      out.push(
        "range",
        `${path}[${index}].t`,
        `anchor "${anchor.cue}" (t=${anchor.t}) runs before its predecessor (t=${predecessor}): the list order is the causal order`,
        anchor.t,
      );
    predecessor = anchor.t;
  });
}
