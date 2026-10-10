import { IPortraitLipCoordinate } from "./structures/IPortraitLipCoordinate";
import { IPortraitLipSection } from "./structures/IPortraitLipSection";

/**
 * Own a section profile and evaluate forward relief in its live lip coordinates.
 * Both band edges and both corners receive exactly zero: the section cannot
 * independently move the skin junction, aperture, or dental attachment.
 */
export const createPortraitLipSection = (
  input: IPortraitLipSection,
): ((coordinate: IPortraitLipCoordinate) => number) => {
  const shape = { ...input };
  if (
    !Object.values(shape).every(Number.isFinite) ||
    [shape.upperTubercleWidth, shape.lowerPadWidth].some(
      (v) => v <= 0 || v > 1,
    ) ||
    shape.lowerPadOffset < 0 ||
    shape.lowerPadOffset > 1
  )
    throw new Error(
      "Lip sections need finite projections and bounded relative widths.",
    );
  return ({ side, lateral: u, across: v }) => {
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
    const envelope = (1 - u * u) ** 2 * Math.sin(Math.PI * v) ** 2;
    const projection =
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
    const result = envelope * projection;
    if (!Number.isFinite(result))
      throw new Error("Lip section relief exceeds its representable range.");
    return result;
  };
};
