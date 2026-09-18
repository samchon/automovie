import { IAutoMovieDesignSourceFrame } from "@automovie/interface";

/**
 * The metres-per-unit a frame has actually settled on, or null.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-reference-review `designFrameScale` produces the metres-per-unit a frame has actually settled on, or null. This ensures reviewers can trace each adopted design reading back to its source and uncertainty.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-manifest-review `designFrameScale` resolves the selected scale candidate to metres per source unit, or returns `null` while scale is unsettled.
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
