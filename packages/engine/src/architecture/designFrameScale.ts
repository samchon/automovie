import {
  IAutoMovieDesignScaleCandidate,
  IAutoMovieDesignSourceFrame,
} from "@automovie/interface";

/**
 * The metres-per-unit a frame has actually settled on, or null.
 *
 * Returns `metersPerUnit` of the scale candidate whose id equals `frame.scale`. Null means no world position exists for the frame's points: either the author left `scale` null because the scale is unknown, or `scale` names an id no candidate carries, which `validateDesignReference` refuses. The first candidate with the id wins.
 *
 * @param frame Source frame whose settled scale is read.
 * @returns Metres per source unit, or null when the scale is unsettled.
 *
 * @evidence contracts/common.md#principled-implementation A first-match lookup of the selected candidate id among the frame's own candidates, returning its stated factor unchanged; an unresolved selection answers null so no caller can place a point on an unsettled scale.
 * @evidence contracts/common.md#clear-and-simple-design One lookup shared by world-point mapping and observation promotion, so "the frame's scale" is read the same way everywhere.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no frame or candidate and substitutes no default factor for an unknown scale.
 * @evidence contracts/common.md#meaningful-documentation States the return unit, both null cases and which validator refuses the dangling one, and the first-match rule.
 * @evidence contracts/performance.md#efficient-algorithms O(C) time and O(1) space for C candidates, stopping at the first match; no candidate-count cap is assumed.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure lookup on one frame value that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a number already stored on the frame and keeps no reference to the frame or its candidates.
 */
export const designFrameScale: (
  frame: IAutoMovieDesignSourceFrame,
) => number | null = (frame: IAutoMovieDesignSourceFrame): number | null => {
  if (frame.scale === null) return null;
  const candidate: IAutoMovieDesignScaleCandidate | undefined =
    frame.scaleCandidates.find(
      (entry: IAutoMovieDesignScaleCandidate): boolean =>
        entry.id === frame.scale,
    );
  return candidate === undefined ? null : candidate.metersPerUnit;
};
