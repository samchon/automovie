import { IPortraitLipBandKnot } from "./structures/IPortraitLipBandKnot";

/**
 * Resolve an optional thickness profile independently of the oral aperture.
 * Omission is identity. A scalar sets the central ratio and joins ratio one at
 * both corners; an ordered array of two to 64 knots owns the full profile and must preserve
 * those same endpoint values. Adjacent knots use a cubic smoothstep, so values
 * stay within their positive endpoint hull with zero slope at the knots.
 * The function owns copied data; a provided zero or empty array is invalid.
 *
 * @evidence contracts/common.md#principled-implementation Between adjacent knots the profile is the cubic smoothstep blend of the two ratios, which is monotone and flat at every knot, and the result is clamped to the endpoint hull, so no interpolated ratio leaves the range of its neighbours or turns nonpositive. Identity corners keep the oral corners fixed, which is the premise the mouth fit relies on.
 * @evidence contracts/common.md#clear-and-simple-design One resolver for an omitted, scalar or knot-array profile, returning a single evaluation function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is named; the knot limit is a documented bound of the profile.
 * @evidence contracts/common.md#meaningful-documentation The comment states what omission, a scalar and an array mean, the knot count, the interpolation and that the function owns copied data.
 * @evidence contracts/modeling.md#parameter-channels The channel is the thickness ratio of one lip band along the oral span. Its neutral is a ratio of one (identity), not zero, so a configuration is a ratio to neutral; a ratio above one thickens the band. Upper and lower bands are separate arguments and the profile runs from the anatomical right (-1) to the left (+1), so asymmetry is authored by unequal knots.
 * @evidence contracts/modeling.md#spatial-conventions The argument is the unitless transverse fraction in [-1, 1] and the result a unitless ratio.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function resolves a profile and defines no part or group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface; identity at both corners is what keeps the shared corners fixed under any profile.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint.
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
