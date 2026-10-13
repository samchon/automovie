import { IPortraitLipBandKnot } from "./structures/IPortraitLipBandKnot";

/**
 * Resolve an optional thickness profile independently of the oral aperture. Omission is identity. A scalar sets the central ratio and joins ratio one at both corners; an ordered array of two to 64 knots owns the full profile and must preserve those same endpoint values. Adjacent knots use a cubic smoothstep, so values stay within their positive endpoint hull with zero slope at the knots. The function owns copied data; a provided zero or empty array is invalid.
 *
 * @evidence contracts/common.md#principled-implementation A positive scalar or ordered knot profile interpolates thickness by cubic smoothstep with identity corners.
 * @evidence contracts/common.md#clear-and-simple-design Thickness remains independent from oral aperture and omission preserves ratio one.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero, empty, unordered or nonidentity-corner profiles refuse; the ratios are authoring controls, not tissue measurements.
 * @evidence contracts/common.md#meaningful-documentation Samples use normalized lateral minus one to one and interpolate within each positive endpoint hull.
 * @evidence contracts/performance.md#efficient-algorithms Preparation is linear in two-to-64 knots and sampling linearly locates a segment.
 * @evidence contracts/performance.md#reuse-equivalent-work Copied admitted knots are reused for all band samples without mutable-input memoization.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned closure owns only its small knot profile and releases it when the sampler is dropped.
 */
export function createPortraitLipBandScale(
  input?: number | readonly IPortraitLipBandKnot[],
): (lateral: number) => number {
  const knots: { at: number; scale: number; }[] =
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
        : input.map((knot: IPortraitLipBandKnot): { at: number; scale: number; } => ({ ...knot }));
  if (
    knots.length < 2 ||
    knots.length > 64 ||
    knots[0].at !== -1 ||
    knots.at(-1)!.at !== 1 ||
    knots[0].scale !== 1 ||
    knots.at(-1)!.scale !== 1 ||
    knots.some(
      (knot: { at: number; scale: number; }, i: number): boolean =>
        ![knot.at, knot.scale].every(Number.isFinite) ||
        knot.scale <= 0 ||
        (i > 0 && knot.at <= knots[i - 1].at),
    )
  )
    throw new Error(
      "Lip thickness needs ordered positive ratios from -1 to +1 with identity corners.",
    );
  return (lateral: number): number => {
    if (!Number.isFinite(lateral) || lateral < -1 || lateral > 1)
      throw new Error("Lip thickness samples must lie in the unit oral span.");
    if (lateral === -1 || lateral === 1) return 1;
    const i: number = knots.findIndex((knot: { at: number; scale: number; }): boolean => knot.at >= lateral),
      a: { at: number; scale: number; } = knots[i - 1],
      b: { at: number; scale: number; } = knots[i];
    const t: number = (lateral - a.at) / (b.at - a.at),
      blend: number = t * t * (3 - 2 * t);
    return Math.max(
      Math.min(a.scale, b.scale),
      Math.min(
        Math.max(a.scale, b.scale),
        a.scale * (1 - blend) + b.scale * blend,
      ),
    );
  };
}
