import { IPortraitLipCoordinate } from "./structures/IPortraitLipCoordinate";
import { IPortraitLipSection } from "./structures/IPortraitLipSection";

/**
 * Own a section profile and evaluate forward relief in its live lip coordinates. Both band edges and both corners receive exactly zero: the section cannot independently move the skin junction, aperture, or dental attachment.
 *
 * @evidence contracts/common.md#principled-implementation Copied section parameters evaluate upper tubercle or paired lower-pad relief under zero-boundary envelopes.
 * @evidence contracts/common.md#clear-and-simple-design Section detail leaves corners, skin junction and oral aperture exactly stationary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid normalized coordinates or nonfinite relief refuse; this smooth authored profile is not recovered tissue geometry.
 * @evidence contracts/common.md#meaningful-documentation Lateral/across are unit coordinates and result relief has the profile's portrait-distance unit.
 * @evidence contracts/performance.md#efficient-algorithms One copied fixed profile and constant polynomial/Gaussian work per sample dominate.
 * @evidence contracts/performance.md#reuse-equivalent-work The same compiled profile serves all mesh constraints rather than per-vertex parameter rebuilding.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure owns scalar shape fields and retains no mesh or previous sample.
 */
export const createPortraitLipSection: (
  input: IPortraitLipSection,
) => (coordinate: IPortraitLipCoordinate) => number = (
  input: IPortraitLipSection,
): ((coordinate: IPortraitLipCoordinate) => number) => {
  const shape: {
    upperBody: number;
    upperTubercle: number;
    upperTubercleWidth: number;
    lowerBody: number;
    lowerPads: number;
    lowerPadOffset: number;
    lowerPadWidth: number;
  } = { ...input };
  if (
    !Object.values(shape).every(Number.isFinite) ||
    [shape.upperTubercleWidth, shape.lowerPadWidth].some(
      (v: number): boolean => v <= 0 || v > 1,
    ) ||
    shape.lowerPadOffset < 0 ||
    shape.lowerPadOffset > 1
  )
    throw new Error(
      "Lip sections need finite projections and bounded relative widths.",
    );
  return ({ side, lateral: u, across: v }: IPortraitLipCoordinate): number => {
    if (
      !Number.isFinite(u) ||
      !Number.isFinite(v) ||
      Math.abs(u) > 1 ||
      v < 0 ||
      v > 1
    )
      throw new Error(
        "Lip section coordinates must stay inside their normalized band.",
      );
    if (Math.abs(u) === 1 || v === 0 || v === 1) return 0;
    // Smooth envelopes retain tangent continuity at the band edges. Central
    // upper and paired lower relief are independent from the broad body, so
    // increasing lip projection need not inflate every subunit equally.
    const envelope: number = (1 - u * u) ** 2 * Math.sin(Math.PI * v) ** 2;
    const projection: number =
      side === "upper"
        ? shape.upperBody +
          shape.upperTubercle * Math.exp(-((u / shape.upperTubercleWidth) ** 2))
        : shape.lowerBody +
          shape.lowerPads *
            (Math.exp(
              -(((u - shape.lowerPadOffset) / shape.lowerPadWidth) ** 2),
            ) +
              Math.exp(
                -(((u + shape.lowerPadOffset) / shape.lowerPadWidth) ** 2),
              ));
    const result: number = envelope * projection;
    if (!Number.isFinite(result))
      throw new Error("Lip section relief exceeds its representable range.");
    return result;
  };
};
