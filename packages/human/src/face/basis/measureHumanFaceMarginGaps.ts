import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceLipMargin } from "../structures/IAutoMovieHumanFaceLipMargin";

/**
 * The signed aperture of every lip margin chain vertex against the opposite
 * chain on posed positions, in metres.
 *
 * Each vertex's height along the opening direction is compared with the
 * opposite chain's height at the vertex's position along the mandibular axis,
 * interpolated linearly between the two opposite vertices that bracket it (the
 * nearest end beyond the opposite chain). Positive is open, zero is contact
 * and negative is overlap, upper chain first, then lower, in chain order.
 *
 * @evidence contracts/common.md#principled-implementation The aperture is read the same way the closure gain solves contact, so a sealed margin reads zero.
 * @evidence contracts/common.md#clear-and-simple-design One reading per chain vertex.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Readings come from the posed positions, never from the solve.
 * @evidence contracts/common.md#meaningful-documentation States the comparison, the sign and the order.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The reading names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The reading is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The reading emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Basis metres along the opening direction.
 * @evidence contracts/modeling.md#shared-boundaries It measures the boundary where upper and lower vermilion meet.
 * @evidence contracts/modeling.md#rendered-observation The summary reports it on the geometry the viewer displays.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The reading carries no anatomical norm.
 * @evidenceExclude contracts/anatomy.md#permitted-range The reading bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The reading is output, not input.
 * @author Samchon
 */
export function measureHumanFaceMarginGaps(
  positions: readonly number[],
  margin: IAutoMovieHumanFaceLipMargin,
  axis: readonly [number, number, number],
  up: IAutoMovieVector3,
): number[] {
  const along = (v: number) =>
    positions[3 * v] * axis[0] +
    positions[3 * v + 1] * axis[1] +
    positions[3 * v + 2] * axis[2];
  const height = (v: number) =>
    positions[3 * v] * up.x +
    positions[3 * v + 1] * up.y +
    positions[3 * v + 2] * up.z;
  const across = (chain: readonly number[], at: number): number => {
    const first = chain[0];
    const last = chain[chain.length - 1];
    const ascending = along(last) >= along(first);
    const before = (a: number, b: number) => (ascending ? a <= b : a >= b);
    if (before(at, along(first))) return height(first);
    if (before(along(last), at)) return height(last);
    for (let j = 0; j + 1 < chain.length; j++) {
      const a = chain[j];
      const b = chain[j + 1];
      if (before(along(a), at) && before(at, along(b)))
        return along(b) === along(a)
          ? height(a)
          : height(a) +
              ((at - along(a)) * (height(b) - height(a))) /
                (along(b) - along(a));
    }
    return height(last);
  };
  return [
    ...margin.upper.map((v) => height(v) - across(margin.lower, along(v))),
    ...margin.lower.map((v) => across(margin.upper, along(v)) - height(v)),
  ];
}
