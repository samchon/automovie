import type { IAutoMovieProductionRenderTier } from "@automovie/interface";

/*
 * The tier an omitted declaration means: exact final output.
 */
const FINAL_TIER: Readonly<IAutoMovieProductionRenderTier> = {
  kind: "final",
  resolutionScale: 1,
  frameStep: 1,
};

/*
 * Return a copy of the declared render tier, or the final tier when none is
 * declared, refusing any other shape.
 *
 * Final must be scale 1 and step 1. A proxy must have a finite scale in `(0,
 * 1]` and an integer step from 1 through 16, and reduce at least one of them,
 * so a proxy cannot claim final's output and final cannot be spelled as a
 * proxy. Throws one error naming both admitted shapes.
 */
export const normalizeRenderTier: (
  tier: IAutoMovieProductionRenderTier | undefined,
) => IAutoMovieProductionRenderTier = (
  tier: IAutoMovieProductionRenderTier | undefined,
): IAutoMovieProductionRenderTier => {
  const value: Readonly<IAutoMovieProductionRenderTier> = tier ?? FINAL_TIER;
  if (
    value.resolutionScale <= 0 ||
    value.resolutionScale > 1 ||
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
