import type { IAutoMovieProductionRenderTier } from "./IAutoMovieProductionRenderTier";

/** The tier an omitted declaration means: exact final output. */
const FINAL_TIER: Readonly<IAutoMovieProductionRenderTier> = {
  kind: "final",
  resolutionScale: 1,
  frameStep: 1,
};

/**
 * Return a copy of the declared render tier, or the final tier when none is
 * declared, refusing any other shape.
 *
 * Final must be scale 1 and step 1. A proxy must have a finite scale in
 * `(0, 1]` and an integer step from 1 through 16, and reduce at least one of
 * them, so a proxy cannot claim final's output and final cannot be spelled as
 * a proxy. Throws one error naming both admitted shapes.
 *
 * @evidence contracts/common.md#principled-implementation The check is the closed admission rule of the production design's `renderTiers` contract, evaluated field by field on finite and safe-integer predicates so NaN, infinity and fractional steps are refused rather than compared.
 * @evidence contracts/common.md#clear-and-simple-design One predicate admits the two shapes and one structured clone returns a value the caller owns, so the planner and the frame-format projection share one rule instead of each restating it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The limits are the design contract's 1-for-final and 1-through-16 step bounds; the default for an omitted tier is the documented final tier, not a guess, and an invalid tier throws instead of being clamped.
 * @evidence contracts/common.md#meaningful-documentation The doc states the omitted-tier default, both admitted shapes with their bounds, why a proxy must reduce something, that the result is a copy, and the refusal.
 * @evidence contracts/performance.md#efficient-algorithms The call does constant work: a fixed set of comparisons and one clone of a three-field record.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call validates one small record, and the planner and the projection each call it once per plan, so caching would cost more than the check.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The function retains nothing after returning the copy its caller owns and opens no handle or task.
 */
export const normalizeRenderTier: (tier: IAutoMovieProductionRenderTier | undefined) => IAutoMovieProductionRenderTier = (
  tier: IAutoMovieProductionRenderTier | undefined,
): IAutoMovieProductionRenderTier => {
  const value: Readonly<IAutoMovieProductionRenderTier> = tier ?? FINAL_TIER;
  if (
    (value.kind !== "proxy" && value.kind !== "final") ||
    Number.isFinite(value.resolutionScale) === false ||
    value.resolutionScale <= 0 ||
    value.resolutionScale > 1 ||
    Number.isSafeInteger(value.frameStep) === false ||
    value.frameStep <= 0 ||
    value.frameStep > 16 ||
    (value.kind === "final" &&
      (value.resolutionScale !== 1 || value.frameStep !== 1)) ||
    (value.kind === "proxy" &&
      value.resolutionScale === 1 &&
      value.frameStep === 1)
  )
    throw new Error(
      "Render tier must be exact final (scale 1, step 1) or a bounded cheaper proxy (scale in (0, 1], integer step 1..16, with at least one reduction).",
    );
  return structuredClone(value);
};
