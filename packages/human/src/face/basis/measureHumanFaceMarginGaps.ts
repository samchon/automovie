import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasisSurface } from "../structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFaceLipMargin } from "../structures/IAutoMovieHumanFaceLipMargin";
import type { IHumanFaceLipMarginPoint as IHumanFaceLipMarginPointImported } from "./IHumanFaceLipMarginPoint";
import type { IHumanFaceLipMarginPoints as IHumanFaceLipMarginPointsImported } from "./IHumanFaceLipMarginPoints";
import type { IHumanFaceMarginGraphViolation as IHumanFaceMarginGraphViolationImported } from "./IHumanFaceMarginGraphViolation";
import { readHumanFaceLipMarginPoints } from "./readHumanFaceLipMarginPoints";
import { readHumanFaceMarginGraphViolations } from "./readHumanFaceMarginGraphViolations";

/**
 * The signed aperture at every legacy vertex or native material course knot
 * against the opposite course on actual posed positions, in metres.
 *
 * Each point's opening height is compared with the opposite course's linearly interpolated height at its mandibular-axis coordinate, extending the nearest endpoint beyond that chain. Positive is open, zero is projected contact and negative is overlap; upper-chain gaps precede lower-chain gaps in their source order.
 *
 * Material courses require their matching source surface and canonical engine interpolation. Both representations require finite performed projections, a directed span and a monotone single-valued height graph; equal-along joins may have only equal heights. Otherwise interpolation refuses. For admitted affine graphs the courses' union of knots contains every aperture extremum. Legacy calls retain four arguments while satisfying that same performed-graph requirement.
 *
 * @evidence contracts/common.md#principled-implementation Signed heights along up are compared at each chain knot's mandibular-axis coordinate using affine opposite-chain interpolation and nearest-end extension. Material courses use canonical source interpolation and both representations admit a finite directed single-valued performed graph before reading its brackets.
 * @evidence contracts/common.md#clear-and-simple-design The material branch materializes actual course points, then shares the existing vertex-chain projection/interpolation operation instead of introducing a different aperture convention.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing native source or an invalid performed graph refuses in either representation; nearest-end extension is an explicit polyline boundary convention. Equal-along joins require equal heights before interpolation, and knot extrema prove only an admitted affine height graph, not arbitrary 3D lip contact.
 * @evidence contracts/common.md#meaningful-documentation Prose states metres/signs, upper-then-lower ordering, material-source and performed-graph requirements, endpoint extension and the retained legacy call shape with its required admission.
 * @evidence contracts/performance.md#efficient-algorithms For U/L knots the legacy bracket scan costs O(UL) and stores O(U+L) gaps. Material handling additionally interpolates source points and admits their graph before constructing the same finite knot arrays; no sampling density invents missing extrema.
 * @evidence contracts/performance.md#reuse-equivalent-work Material points are read once for graph admission and the shared vertex representation; both directions share the same positions/frame. Changed performed coordinates require another measurement, with no cross-pose cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Course points, flattened positions and knot indices are per-call; only ordered gaps transfer to admission/summary callers. No source mesh, external query or request history is retained.
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
    const points: IHumanFaceLipMarginPointsImported =
      readHumanFaceLipMarginPoints(surface, margin, positions);
    // On a monotone height graph, the union of both courses' knots contains
    // every extremum of the piecewise-affine gap, including end extensions.
    const violations: IHumanFaceMarginGraphViolationImported[] =
      readHumanFaceMarginGraphViolations(points, axis, up);
    if (violations.length !== 0)
      throw new Error(
        "Lip aperture course is not a single-valued monotone height graph: " +
          JSON.stringify(violations),
      );
    const nativePositions: number[] = [];
    const chain: (items: IHumanFaceLipMarginPointImported[]) => number[] = (
      items: typeof points.upper,
    ): number[] =>
      items.map(({ point }: IHumanFaceLipMarginPointImported): number => {
        const vertex: number = nativePositions.length / 3;
        nativePositions.push(point.x, point.y, point.z);
        return vertex;
      });
    return measureHumanFaceMarginGaps(
      nativePositions,
      { upper: chain(points.upper), lower: chain(points.lower) },
      axis,
      up,
    );
  }
  const along: (v: number) => number = (v: number): number =>
    positions[3 * v] * axis[0] +
    positions[3 * v + 1] * axis[1] +
    positions[3 * v + 2] * axis[2];
  const height: (v: number) => number = (v: number): number =>
    positions[3 * v] * up.x +
    positions[3 * v + 1] * up.y +
    positions[3 * v + 2] * up.z;
  for (const course of [margin.upper, margin.lower]) {
    const direction: number = Math.sign(
      along(course[course.length - 1]) - along(course[0]),
    );
    if (course.length < 2 || !Number.isFinite(direction) || direction === 0)
      throw new Error("Lip aperture course needs a finite directed axis span.");
    for (let ordinal: number = 0; ordinal < course.length; ordinal++) {
      const current: number = course[ordinal];
      if (!Number.isFinite(along(current)) || !Number.isFinite(height(current)))
        throw new Error(
          "Lip aperture course needs finite performed coordinates.",
        );
      if (ordinal === 0) continue;
      const previous: number = course[ordinal - 1];
      const difference: number = along(current) - along(previous);
      if (
        direction * difference < 0 ||
        (difference === 0 && height(current) !== height(previous))
      )
        throw new Error(
          "Lip aperture course is not a single-valued monotone height graph.",
        );
    }
  }
  const across: (chain: readonly number[], at: number) => number = (
    chain: readonly number[],
    at: number,
  ): number => {
    const first: number = chain[0];
    const last: number = chain[chain.length - 1];
    const ascending: boolean = along(last) >= along(first);
    const before: (a: number, b: number) => boolean = (
      a: number,
      b: number,
    ): boolean => (ascending ? a <= b : a >= b);
    if (before(at, along(first))) return height(first);
    if (before(along(last), at)) return height(last);
    for (let j: number = 0; j + 1 < chain.length; j++) {
      const a: number = chain[j];
      const b: number = chain[j + 1];
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
    ...margin.upper.map(
      (v: number): number => height(v) - across(margin.lower, along(v)),
    ),
    ...margin.lower.map(
      (v: number): number => across(margin.upper, along(v)) - height(v),
    ),
  ];
}
