import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceLipMargin } from "../structures/IAutoMovieHumanFaceLipMargin";
import type { IAutoMovieHumanFaceBasisSurface } from "../structures/IAutoMovieHumanFaceBasisSurface";
import { readHumanFaceLipMarginPoints } from "./readHumanFaceLipMarginPoints";
import { readHumanFaceMarginGraphViolations } from "./readHumanFaceMarginGraphViolations";

/**
 * The signed aperture at every legacy vertex or native material course knot
 * against the opposite course on actual posed positions, in metres.
 *
 * Each point's height along the opening direction is compared with the
 * opposite course's height at its position along the mandibular axis,
 * interpolated linearly between the two opposite knots that bracket it (the
 * nearest end beyond the opposite chain). Positive is open, zero is contact
 * and negative is overlap, upper chain first, then lower, in chain order.
 * Native material courses require their matching source surface and retain
 * canonical engine interpolation. A nonmonotone posed course or a constant
 * along span with differing heights refuses: it is not a single-valued height
 * graph. For admitted graphs the two courses' union of knots contains every
 * extremum of the piecewise-affine aperture. Legacy vertex callers retain the
 * original four-argument behavior.
 *
 * @author Samchon
 */
export function measureHumanFaceMarginGaps(
  positions: readonly number[],
  margin: IAutoMovieHumanFaceLipMargin,
  axis: readonly [number, number, number],
  up: IAutoMovieVector3,
  surface?: IAutoMovieHumanFaceBasisSurface,
): number[] {
  if (margin.kind === "material") {
    if (surface === undefined)
      throw new Error("Material lip aperture needs its actual source surface.");
    const points = readHumanFaceLipMarginPoints(surface, margin, positions);
    // On a monotone height graph, the union of both courses' knots contains
    // every extremum of the piecewise-affine gap, including end extensions.
    const violations = readHumanFaceMarginGraphViolations(points, axis, up);
    if (violations.length !== 0)
      throw new Error("Lip aperture course is not a single-valued monotone height graph: " + JSON.stringify(violations));
    const nativePositions: number[] = [];
    const chain = (items: typeof points.upper): number[] => items.map(({ point }) => {
      const vertex = nativePositions.length / 3;
      nativePositions.push(point.x, point.y, point.z);
      return vertex;
    });
    return measureHumanFaceMarginGaps(nativePositions,
      { upper: chain(points.upper), lower: chain(points.lower) }, axis, up);
  }
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
