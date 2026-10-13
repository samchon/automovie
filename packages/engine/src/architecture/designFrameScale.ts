import { IAutoMovieDesignSourceFrame } from "@automovie/interface";

/**
 * The metres-per-unit a frame has actually settled on, or null.
 *
 * Returns `metersPerUnit` of the scale candidate whose id equals
 * `frame.scale`. Null means no world position exists for the frame's points:
 * either the author left `scale` null because the scale is unknown, or
 * `scale` names an id no candidate carries, which `validateDesignReference`
 * refuses.
 *
 * @evidence contracts/common.md#principled-implementation Resolves the settled scale by id lookup into `scaleCandidates` rather than choosing the most confident candidate, because a frame's scale is a recorded decision and choosing one would invent a measurement.
 * @evidence contracts/common.md#clear-and-simple-design One lookup is shared by `designReferenceWorldPoint` and `promoteDesignObservations`, so the metric conversion and the promotion gate agree on when a frame has a scale.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Has no default scale and no fallback candidate; both callers turn the null answer into a thrown refusal or an `unknown-scale` withholding.
 * @evidence contracts/common.md#meaningful-documentation States the unit (metres per source unit) and the two cases that produce null, including the dangling id the validator refuses.
 * @evidence contracts/performance.md#cost-and-resources One linear `find` over the frame's hand-authored scale candidates with no allocation; `promoteDesignObservations` repeats it per primitive and per point instead of caching it, and nothing is retained.
 */
export const designFrameScale = (
  frame: IAutoMovieDesignSourceFrame,
): number | null => {
  if (frame.scale === null) return null;
  const candidate = frame.scaleCandidates.find(
    (entry) => entry.id === frame.scale,
  );
  return candidate === undefined ? null : candidate.metersPerUnit;
};
