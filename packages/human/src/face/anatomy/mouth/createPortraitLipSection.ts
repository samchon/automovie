import { IPortraitLipCoordinate } from "./structures/IPortraitLipCoordinate";
import { IPortraitLipSection } from "./structures/IPortraitLipSection";

/**
 * Own a section profile and evaluate forward relief in its live lip coordinates.
 * Both band edges and both corners receive exactly zero: the section cannot
 * independently move the skin junction, aperture, or dental attachment.
 *
 * @evidence contracts/common.md#principled-implementation The relief at a lip coordinate is a broad body projection plus a central upper Gaussian tubercle or two lower Gaussian pads, multiplied by the envelope (1-u^2)^2 sin^2(pi v). The envelope and its first derivative vanish at both corners (u = +-1) and at both band edges (v = 0, 1), so the relief is tangent-continuous with the fixed skin and aperture and cannot move the shared boundaries; the exact zeros on the edges are returned directly.
 * @evidence contracts/common.md#clear-and-simple-design One profile owner: the shape is validated once and the returned function is a pure evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is named, and the boundary zeros are the product's contract and not a patch.
 * @evidence contracts/common.md#meaningful-documentation The comment states that both band edges and both corners receive exactly zero and why the envelopes are smooth.
 * @evidence contracts/modeling.md#spatial-conventions Coordinates are the unitless lip coordinates and the result is a forward projection in millimetres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function evaluates a relief and defines no part or group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive; it displaces existing lip vertices.
 * @evidence contracts/modeling.md#shared-boundaries The relief is exactly zero on both band edges and at both corners, so it cannot move the boundaries the lip shares with the skin, the aperture and the dental frame; the two tangents also vanish there, so no crease is introduced.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint.
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
