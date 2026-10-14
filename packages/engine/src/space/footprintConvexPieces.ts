import { IAutoMovieVector3, IAutoMoviePlanarPoint } from "@automovie/interface";
import { autoMoviePlanarRegionFailure } from "../geometry/autoMoviePlanarRegionFailure";
import { planarCross } from "../geometry/planarCross";
import { convexHull2D } from "../math/convexHull2D";
import { IAutoMovieFootprint } from "./IAutoMovieFootprint";
import { IAutoMovieFootprintRing } from "./IAutoMovieFootprintRing";
/**
 * Produce convex pieces for the footprint's exact-region contract.
 *
 * @evidence contracts/common.md#principled-implementation Region hygiene precedes a winding-aware convex-turn fast path or even-odd vertical slab sweep. Raw orientation signs preserve admitted concavity, and every distinct positive-width slab and nonidentical corner survives without a second feature-size tolerance.
 * @evidence contracts/common.md#clear-and-simple-design The decomposition owner feeds surface clipping and support/anchor queries while the shared region gate owns topology admission; the original rings remain the region definition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejected regions return no pieces and a cached zero-area ring also yields none; callers must rebuild after mutation. No admitted band is dropped or notch filled to fit containment's separate rim tolerance, though binary64 cancellation or unrepresentable interior abscissae still limit extreme coordinates.
 * @evidence contracts/common.md#meaningful-documentation States exact-region intent, hygiene refusal, positive plan winding and preservation of small admitted features; finite coordinates alone do not certify exact binary64 orientation or interpolation arithmetic.
 * @evidence contracts/performance.md#efficient-algorithms For N vertices, hygiene is O(N^2), the convex-turn walk O(N), hull construction O(N log N), and the slab sweep scans/sorts crossings over up to N cuts in O(N^2 log N), with up to O(N^2) returned piece vertices.
 * @evidence contracts/performance.md#reuse-equivalent-work One sorted cut population and each slab's sorted crossings serve all bands in that slab; source projections are reused but mutable region results are not cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns returned piece arrays; slab points are fresh, while the convex fast path retains original hull point references. Call-local rings, cuts and crossings leave scope without renderer handles.
 * @author Samchon
 */
export const footprintConvexPieces: (footprint: IAutoMovieFootprint) => IAutoMovieVector3[][] = (
  footprint: IAutoMovieFootprint,
): IAutoMovieVector3[][] => {
  const failure: string | null = autoMoviePlanarRegionFailure({
    outer: footprint.outer.plan,
    holes: footprint.holes.map((hole: IAutoMovieFootprintRing): readonly IAutoMoviePlanarPoint[] => hole.plan),
    label: "footprint",
  });
  if (failure !== null) return [];
  if (footprint.outer.doubleArea === 0) return [];
  if (footprint.holes.length === 0 && isConvexRing(footprint.outer)) {
    const hull: IAutoMovieVector3[] = convexHull2D(footprint.outer.points);
    return [hull];
  }
  return slabPieces(footprint);
};

/** An admitted simple ring is convex when every nonzero turn follows its winding. */
const isConvexRing: (ring: IAutoMovieFootprintRing) => boolean = (
  ring: IAutoMovieFootprintRing,
): boolean => {
  for (let index: number = 0; index < ring.plan.length; ++index) {
    const turn: number = planarCross(ring.plan[index]!, ring.plan[(index + 1) % ring.plan.length]!, ring.plan[(index + 2) % ring.plan.length]!);
    if (ring.doubleArea > 0 ? turn < 0 : turn > 0) return false;
  }
  return true;
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
const slabPieces: (footprint: IAutoMovieFootprint) => IAutoMovieVector3[][] = (footprint: IAutoMovieFootprint): IAutoMovieVector3[][] => {
  const rings: IAutoMovieFootprintRing[] = [footprint.outer, ...footprint.holes];
  const cuts: number[] = [
    ...new Set(rings.flatMap((ring: IAutoMovieFootprintRing): number[] => ring.points.map((point: IAutoMovieVector3): number => point.x))),
  ].sort((left: number, right: number): number => left - right);
  const pieces: IAutoMovieVector3[][] = [];
  for (let index: number = 0; index + 1 < cuts.length; ++index) {
    const left: number = cuts[index]!;
    const right: number = cuts[index + 1]!;
    if (right <= left) continue;
    const middle: number = left / 2 + right / 2;
    const crossings: ISlabCrossing[] = [];
    for (const ring of rings)
      for (let edge: number = 0; edge < ring.points.length; ++edge) {
        const from: IAutoMovieVector3 = ring.points[edge]!;
        const to: IAutoMovieVector3 = ring.points[(edge + 1) % ring.points.length]!;
        if (Math.min(from.x, to.x) >= middle) continue;
        if (Math.max(from.x, to.x) <= middle) continue;
        crossings.push({ z: edgeZAt(from, to, middle), from, to });
      }
    crossings.sort((a: ISlabCrossing, b: ISlabCrossing): number => a.z - b.z);
    for (let pair: number = 0; pair + 1 < crossings.length; pair += 2) {
      const piece: IAutoMovieVector3[] = slabPiece(
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

/** Plan z of the edge from its first point to its second at abscissa x, which it spans. */
const edgeZAt: (from: IAutoMovieVector3, to: IAutoMovieVector3, x: number) => number = (
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  x: number,
): number => x === from.x ? from.z : x === to.x ? to.z : from.z + ((x - from.x) / (to.x - from.x)) * (to.z - from.z);

/**
 * The trapezoid between two crossings over one slab, wound positively.
 *
 * Either vertical side collapses when the two edges meet at that abscissa (the
 * apex of a triangle), so the duplicated corner is dropped rather than emitted
 * as a zero-length edge no consumer could clip against. A band that collapses
 * at both ends encloses nothing and comes back as the two points it is, which
 * the sweep drops.
 */
const slabPiece: (lower: ISlabCrossing, upper: ISlabCrossing, left: number, right: number) => IAutoMovieVector3[] = (
  lower: ISlabCrossing,
  upper: ISlabCrossing,
  left: number,
  right: number,
): IAutoMovieVector3[] => {
  const lowerLeft: { x: number; y: number; z: number; } = { x: left, y: 0, z: edgeZAt(lower.from, lower.to, left) };
  const lowerRight: { x: number; y: number; z: number; } = {
    x: right,
    y: 0,
    z: edgeZAt(lower.from, lower.to, right),
  };
  const upperRight: { x: number; y: number; z: number; } = {
    x: right,
    y: 0,
    z: edgeZAt(upper.from, upper.to, right),
  };
  const upperLeft: { x: number; y: number; z: number; } = { x: left, y: 0, z: edgeZAt(upper.from, upper.to, left) };
  const piece: IAutoMovieVector3[] = [lowerLeft, lowerRight];
  if (upperRight.z !== lowerRight.z)
    piece.push(upperRight);
  if (upperLeft.z !== lowerLeft.z)
    piece.push(upperLeft);
  return piece;
};
