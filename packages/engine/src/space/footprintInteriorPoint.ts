import { IAutoMovieVector3 } from "@automovie/interface";
import { FOOTPRINT_EPSILON } from "./FOOTPRINT_EPSILON";
import { IAutoMovieFootprint } from "./IAutoMovieFootprint";
import { IAutoMovieFootprintRing } from "./IAutoMovieFootprintRing";
import { footprintConvexPieces } from "./footprintConvexPieces";
import { footprintRing } from "./footprintRing";
import { footprintRingPlacement } from "./footprintRingPlacement";

/**
 * A plan point guaranteed to be on the region, or `null` when it has none.
 *
 * The mean of a ring's own vertices is not on the region that ring bounds: an
 * L-shaped plate's mean falls in its notch and a holed slab's falls straight
 * down the atrium, so anything anchoring to "the middle of the patch" that way
 * anchors where the patch is not. The mean of a convex piece is always inside
 * that piece, and the widest piece is chosen so the anchor sits in the part of
 * the patch there is most of. A patch that was already convex is its own widest
 * piece, so the answer is unchanged wherever it was already right.
 *
 * @evidence requirements/staging/marks-zones-and-blocking.md#staging-zone-membership `footprintInteriorPoint` produces a plan point guaranteed to be on the region, or `null` when it has none. This ensures membership is judged from a subject footprint rather than a point.
 * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `footprintInteriorPoint` performs interior point footprint evaluation when the engine resolves host-relative support geometry and whole-footprint zone membership.
 */
export const footprintInteriorPoint = (
  footprint: IAutoMovieFootprint,
): { x: number; z: number } | null => {
  let best: IAutoMovieVector3[] | null = null;
  let bestArea = 0;
  for (const piece of footprintConvexPieces(footprint)) {
    const area = Math.abs(footprintRing(piece).doubleArea);
    if (area > bestArea) {
      best = piece;
      bestArea = area;
    }
  }
  if (best === null) return null;
  const sum = best.reduce(
    (total, point) => ({ x: total.x + point.x, z: total.z + point.z }),
    { x: 0, z: 0 },
  );
  return { x: sum.x / best.length, z: sum.z / best.length };
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

/** One ring edge crossing a slab, kept with the edge that produced it. */
interface ISlabCrossing {
  /** Plan `z` where the edge crosses the slab's own mid-abscissa. */
  z: number;
  /** The crossing edge's start, in world XZ. */
  from: IAutoMovieVector3;
  /** The crossing edge's end, in world XZ. */
  to: IAutoMovieVector3;
}

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
