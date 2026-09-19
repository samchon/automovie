import { IAutoMovieVector3 } from "@automovie/interface";
import { autoMoviePlanarRegionFailure } from "../geometry/autoMoviePlanarRegionFailure";
import { convexHull2D } from "../math/convexHull2D";
import { FOOTPRINT_EPSILON } from "./constants/FOOTPRINT_EPSILON";
import { IAutoMovieFootprint } from "./IAutoMovieFootprint";
import { IAutoMovieFootprintRing } from "./IAutoMovieFootprintRing";
import { footprintRing } from "./footprintRing";
import { footprintRingPlacement } from "./footprintRingPlacement";

/**
 * The footprint as convex pieces whose union is exactly the region.
 *
 * Everything that has to sweep, clip or draw a footprint wants convex input:
 * lattice clipping is Sutherland–Hodgman, a fan is only a triangulation of a
 * convex ring, and a containment probe against a convex piece is four
 * comparisons. Handing those a hull was the original defect; handing them a
 * decomposition of the true region is the same code with the notch and the hole
 * still missing from it.
 *
 * A solid convex footprint is already one convex piece and comes back as its
 * own hull, which is both the minimal decomposition and byte-for-byte what this
 * region used to produce. Anything else is decomposed by a vertical slab sweep:
 * cut the plan at every vertex `x`, and inside each slab pair the ring
 * crossings by even-odd parity, so a hole is a pair of crossings that closes
 * the band rather than a case anybody has to name. A degenerate region yields
 * nothing.
 *
 * **A ring that crosses itself has no region, and this does not invent one.**
 * Both readings of such a footprint stay finite and deterministic — nothing
 * throws, nothing is `NaN` — but the pieces here and what
 * {@link footprintContains} answers need not describe the same shape, because
 * there is no shape for them to agree on. That is why `validateSpace` refuses a
 * self-crossing ring outright rather than leaving either reading to stand for
 * it.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `footprintConvexPieces` produces the footprint as convex pieces whose union is exactly the region. This ensures degenerate or self-intersecting planar geometry is rejected before use.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `footprintConvexPieces` performs convex pieces footprint evaluation when the engine checks finite planar topology before consuming geometry.
 */
export const footprintConvexPieces = (
  footprint: IAutoMovieFootprint,
): IAutoMovieVector3[][] => {
  const failure = autoMoviePlanarRegionFailure({
    outer: footprint.outer.plan,
    holes: footprint.holes.map((hole) => hole.plan),
    label: "footprint",
  });
  if (failure !== null) return [];
  if (footprint.outer.doubleArea === 0) return [];
  if (footprint.holes.length === 0) {
    const hull = convexHull2D(footprint.outer.points);
    if (isConvexRing(footprint.outer, hull)) return [hull];
  }
  return slabPieces(footprint);
};

/**
 * Is the outer ring already convex, i.e. does every vertex sit on its own hull?
 *
 * This is the predicate `validateSpace` enforced while footprints had to be
 * convex, kept because it is still the question that decides whether a region
 * needs decomposing at all. For a simple ring it is exactly right: all vertices
 * on the hull and no crossing means the ring **is** the hull.
 *
 * A hull too small to enclose area holds no vertex on its boundary, so a
 * degenerate ring answers `false` without a case of its own.
 */
const isConvexRing = (
  ring: IAutoMovieFootprintRing,
  hull: readonly IAutoMovieVector3[],
): boolean => {
  const onHull = footprintRing(hull);
  return ring.points.every(
    (point) => footprintRingPlacement(onHull, point.x, point.z) === "boundary",
  );
};

/** One ring edge crossing a slab, kept with the edge that produced it. */
interface ISlabCrossing {
  /** Plan `z` where the edge crosses the slab's own mid-abscissa. */
  z: number;
  /** The crossing edge's start, in world XZ. */
  from: IAutoMovieVector3;
  /** The crossing edge's end, in world XZ. */
  to: IAutoMovieVector3;
}

/**
 * Decompose a region into trapezoids by sweeping vertical slabs.
 *
 * No vertex falls strictly inside a slab, so every edge that crosses the slab's
 * midline spans the whole slab, and the band between two consecutive crossings
 * is bounded left and right by those two edges alone. Sorting the crossings by
 * `z` and taking them in pairs is the even-odd rule, which is why a hole needs
 * no separate treatment: its two rims are simply the crossings that close one
 * band and open the next.
 */
const slabPieces = (footprint: IAutoMovieFootprint): IAutoMovieVector3[][] => {
  const rings = [footprint.outer, ...footprint.holes];
  const cuts = [
    ...new Set(rings.flatMap((ring) => ring.points.map((point) => point.x))),
  ].sort((left, right) => left - right);
  const pieces: IAutoMovieVector3[][] = [];
  for (let index = 0; index + 1 < cuts.length; ++index) {
    const left = cuts[index]!;
    const right = cuts[index + 1]!;
    if (right - left <= FOOTPRINT_EPSILON) continue;
    const middle = (left + right) / 2;
    const crossings: ISlabCrossing[] = [];
    for (const ring of rings)
      for (let edge = 0; edge < ring.points.length; ++edge) {
        const from = ring.points[edge]!;
        const to = ring.points[(edge + 1) % ring.points.length]!;
        if (Math.min(from.x, to.x) >= middle) continue;
        if (Math.max(from.x, to.x) <= middle) continue;
        crossings.push({ z: edgeZAt(from, to, middle), from, to });
      }
    crossings.sort((a, b) => a.z - b.z);
    for (let pair = 0; pair + 1 < crossings.length; pair += 2) {
      const piece = slabPiece(
        crossings[pair]!,
        crossings[pair + 1]!,
        left,
        right,
      );
      if (piece.length >= 3) pieces.push(piece);
    }
  }
  return pieces;
};

/** Plan `z` of the edge `from → to` at abscissa `x`, which the edge spans. */
const edgeZAt = (
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  x: number,
): number => from.z + ((x - from.x) / (to.x - from.x)) * (to.z - from.z);

/**
 * The trapezoid between two crossings over one slab, wound positively.
 *
 * Either vertical side collapses when the two edges meet at that abscissa (the
 * apex of a triangle), so the duplicated corner is dropped rather than emitted
 * as a zero-length edge no consumer could clip against. A band that collapses
 * at both ends encloses nothing and comes back as the two points it is, which
 * the sweep drops.
 */
const slabPiece = (
  lower: ISlabCrossing,
  upper: ISlabCrossing,
  left: number,
  right: number,
): IAutoMovieVector3[] => {
  const lowerLeft = { x: left, y: 0, z: edgeZAt(lower.from, lower.to, left) };
  const lowerRight = {
    x: right,
    y: 0,
    z: edgeZAt(lower.from, lower.to, right),
  };
  const upperRight = {
    x: right,
    y: 0,
    z: edgeZAt(upper.from, upper.to, right),
  };
  const upperLeft = { x: left, y: 0, z: edgeZAt(upper.from, upper.to, left) };
  const piece: IAutoMovieVector3[] = [lowerLeft, lowerRight];
  if (Math.abs(upperRight.z - lowerRight.z) > FOOTPRINT_EPSILON)
    piece.push(upperRight);
  if (Math.abs(upperLeft.z - lowerLeft.z) > FOOTPRINT_EPSILON)
    piece.push(upperLeft);
  return piece;
};
