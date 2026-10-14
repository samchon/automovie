import type { IAutoMoviePlanarPoint } from "@automovie/interface";

import { PLANAR_EPSILON } from "./constants/PLANAR_EPSILON";
import { planarCross } from "./planarCross";
import { planarSegmentsMeet } from "./planarSegmentsMeet";
import { pointInPlanarRing } from "./pointInPlanarRing";
import { signedArea } from "./signedArea";

/**
 * Return the first deterministic hygiene failure in one planar region, or
 * `null` when every ring describes one unambiguous bounded region.
 *
 * The result is a message rather than repaired geometry. Drawing,
 * triangulation, and support decomposition need different outputs, but they
 * must agree on whether their shared input has an interior. A caller that can
 * report a gap may retain the message; a constructor can throw it verbatim.
 *
 * Each ring is checked in declaration order, outer ring first, for at least
 * three points, finite coordinates, no point repeated beside itself, a
 * nonzero area, no spike doubling back along its own edge, and no crossing
 * between non-neighbouring edges. Then every ring pair is checked for any
 * shared point, and finally every hole must lie inside the outer ring and
 * outside every other hole. Zero means within the absolute `PLANAR_EPSILON`
 * (1e-12) of square metres or metres. Messages name rings as `<label> outer
 * ring` and `<label> hole[i]`, with `label` defaulting to `polygon`.
 *
 * @param props.outer Outer ring in any winding, the last point joined back to the first.
 * @param props.holes Rings removed from the region; omitted means none.
 * @param props.label Name the messages give the region.
 * @returns The first failure message, or `null` for an admissible region.
 *
 * @evidence contracts/common.md#principled-implementation Ring hygiene by shoelace area, orientation determinants and pairwise closed-segment contact, then hole placement by the even-odd rule on one hole vertex, which decides the whole hole because rings were already proven not to touch; the area check precedes the turn and crossing checks so an area-free ring keeps its established diagnostic.
 * @evidence contracts/common.md#clear-and-simple-design One validator returning a message shared by `canonicalRegion`, polygon triangulation, footprint convex pieces and portrait skin reservation, so they agree on admission while each decides whether to throw or skip; segment contact, ring containment, area and orientation come from the geometry kernel's shared helpers rather than private copies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is repaired, reordered or dropped to make a ring pass, and no caller or label changes a check; the order of checks only decides which of several failures is reported first.
 * @evidence contracts/common.md#meaningful-documentation States the return contract and why it is a message, every check in order with its tolerance and unit, the ring naming in messages, and each parameter's default.
 * @evidence contracts/performance.md#efficient-algorithms For N points over all rings, per-ring checks are linear, self-crossing is quadratic in each ring and ring contact quadratic across ring pairs, so the worst case is O(N^2) with no allocation inside the pair loops; inputs are authored profiles, footprints and skin loops of tens to hundreds of points, where a sweep-line intersection test would cost more than it saves, and the early return stops at the first failure.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure validation of the rings passed in; callers validate each region once, and portrait skin reservation calls it per candidate loop because each loop differs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates one array of ring labels and one of rings per call and releases both on return; the caller's rings are only read.
 * @author Samchon
 */
export const autoMoviePlanarRegionFailure = (props: {
  outer: readonly IAutoMoviePlanarPoint[];
  holes?: ReadonlyArray<readonly IAutoMoviePlanarPoint[]>;
  label?: string;
}): string | null => {
  const label: string = props.label ?? "polygon";
  const holes: ReadonlyArray<readonly IAutoMoviePlanarPoint[]> =
    props.holes ?? [];
  const labels: string[] = [
    `${label} outer ring`,
    ...holes.map(
      (_hole: readonly IAutoMoviePlanarPoint[], index: number): string =>
        `${label} hole[${index}]`,
    ),
  ];
  const loops: ReadonlyArray<readonly IAutoMoviePlanarPoint[]> = [
    props.outer,
    ...holes,
  ];
  for (let index: number = 0; index < loops.length; ++index) {
    const failure: string | null = ringFailure(loops[index]!, labels[index]!);
    if (failure !== null) return failure;
  }
  for (let left: number = 0; left + 1 < loops.length; ++left)
    for (let right: number = left + 1; right < loops.length; ++right) {
      const one: readonly IAutoMoviePlanarPoint[] = loops[left]!;
      const other: readonly IAutoMoviePlanarPoint[] = loops[right]!;
      for (let a: number = 0; a < one.length; ++a)
        for (let b: number = 0; b < other.length; ++b)
          if (
            planarSegmentsMeet(
              one[a]!,
              one[(a + 1) % one.length]!,
              other[b]!,
              other[(b + 1) % other.length]!,
            )
          )
            return `${labels[left]} and ${labels[right]} touch or cross at edge ${a} and edge ${b}`;
    }
  for (let hole: number = 1; hole < loops.length; ++hole) {
    const probe: IAutoMoviePlanarPoint = loops[hole]![0]!;
    if (pointInPlanarRing(probe, loops[0]!) === false)
      return `${labels[hole]} must lie inside ${labels[0]}`;
    for (let other: number = 1; other < loops.length; ++other)
      if (other !== hole && pointInPlanarRing(probe, loops[other]!))
        return `${labels[hole]} must lie outside ${labels[other]}`;
  }
  return null;
};

/** The first defect inside one ring, before relations to other rings matter. */
const ringFailure = (
  ring: readonly IAutoMoviePlanarPoint[],
  label: string,
): string | null => {
  if (ring.length < 3) return `${label} needs at least three points`;
  for (let index: number = 0; index < ring.length; ++index) {
    const point: IAutoMoviePlanarPoint = ring[index]!;
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y))
      return `${label}[${index}] must be finite`;
  }
  const size: number = ring.length;
  for (let index: number = 0; index < size; ++index) {
    const point: IAutoMoviePlanarPoint = ring[index]!;
    const next: IAutoMoviePlanarPoint = ring[(index + 1) % size]!;
    if (Math.hypot(next.x - point.x, next.y - point.y) <= PLANAR_EPSILON)
      return `${label}[${index}] repeats the point beside it`;
  }
  // Preserve the established procedural diagnostic order: an area-free ring
  // is rejected before topology is classified. A nonzero-area self-crossing
  // ring still reaches the explicit crossing diagnosis below.
  if (Math.abs(signedArea(ring)) <= PLANAR_EPSILON)
    return `${label} encloses no area`;
  for (let index: number = 0; index < size; ++index) {
    const previous: IAutoMoviePlanarPoint = ring[(index + size - 1) % size]!;
    const point: IAutoMoviePlanarPoint = ring[index]!;
    const next: IAutoMoviePlanarPoint = ring[(index + 1) % size]!;
    if (
      Math.abs(planarCross(previous, point, next)) <= PLANAR_EPSILON &&
      (point.x - previous.x) * (next.x - point.x) +
        (point.y - previous.y) * (next.y - point.y) <
        0
    )
      return `${label}[${index}] doubles back along its own edge`;
  }
  return ringCrossingFailure(ring, label);
};

/** First meeting of two non-neighbouring edges in one ring. */
const ringCrossingFailure = (
  ring: readonly IAutoMoviePlanarPoint[],
  label: string,
): string | null => {
  for (let left: number = 0; left < ring.length; ++left)
    for (let right: number = left + 1; right < ring.length; ++right)
      if (
        neighbouringEdges(ring.length, left, right) === false &&
        planarSegmentsMeet(
          ring[left]!,
          ring[(left + 1) % ring.length]!,
          ring[right]!,
          ring[(right + 1) % ring.length]!,
        )
      )
        return `${label} crosses itself between edge ${left} and edge ${right}`;
  return null;
};

/** Are two edges of the same ring the pair that share a corner? */
const neighbouringEdges = (
  size: number,
  left: number,
  right: number,
): boolean => (left + 1) % size === right || (right + 1) % size === left;
