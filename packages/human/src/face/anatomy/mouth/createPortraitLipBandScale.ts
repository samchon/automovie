import { IPortraitLipBandKnot } from "./structures/IPortraitLipBandKnot";

/**
 * Resolve an optional thickness profile independently of the oral aperture.
 * Omission is identity. A scalar sets the central ratio and joins ratio one at
 * both corners; an ordered array of two to 64 knots owns the full profile and must preserve
 * those same endpoint values. Adjacent knots use a cubic smoothstep, so values
 * stay within their positive endpoint hull with zero slope at the knots.
 * The function owns copied data; a provided zero or empty array is invalid.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Changes vermilion thickness independently of aperture size while preserving the two commissures.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Admits a scalar or two-to-64-knot profile and interpolates positive ratios inside their endpoint hull with identity corners.
 */
export function createPortraitLipBandScale(
  input?: number | readonly IPortraitLipBandKnot[],
): (lateral: number) => number {
  const knots =
    input === undefined
      ? [
          { at: -1, scale: 1 },
          { at: 1, scale: 1 },
        ]
      : typeof input === "number"
        ? [
            { at: -1, scale: 1 },
            { at: 0, scale: input },
            { at: 1, scale: 1 },
          ]
        : input.map((knot) => ({ ...knot }));
  if (
    knots.length < 2 ||
    knots.length > 64 ||
    knots[0].at !== -1 ||
    knots.at(-1)!.at !== 1 ||
    knots[0].scale !== 1 ||
    knots.at(-1)!.scale !== 1 ||
    knots.some(
      (knot, i) =>
        ![knot.at, knot.scale].every(Number.isFinite) ||
        knot.scale <= 0 ||
        (i > 0 && knot.at <= knots[i - 1].at),
    )
  )
    throw new Error(
      "Lip thickness needs ordered positive ratios from -1 to +1 with identity corners.",
    );
  return (lateral) => {
    if (!Number.isFinite(lateral) || lateral < -1 || lateral > 1)
      throw new Error("Lip thickness samples must lie in the unit oral span.");
    if (lateral === -1 || lateral === 1) return 1;
    const i = knots.findIndex((knot) => knot.at >= lateral),
      a = knots[i - 1],
      b = knots[i];
    const t = (lateral - a.at) / (b.at - a.at),
      blend = t * t * (3 - 2 * t);
    return Math.max(
      Math.min(a.scale, b.scale),
      Math.min(
        Math.max(a.scale, b.scale),
        a.scale * (1 - blend) + b.scale * blend,
      ),
    );
  };
}
