/**
 * Admit planar outer and hole rings, canonicalize their orientation, bridge
 * the holes and ear-clip the resulting boundary in deterministic order. The
 * public triangulation operation, region extrusion and loft caps consume this
 * one owner. Input coordinates are metres and signed area is square metres.
 * Canonical rings are copied; only the private bridge and ear work lists mutate.
 * Loft validates intermediate rings without triangulating unused caps. Changing
 * canonical corner order changes loft correspondence, UVs and mesh topology.
 */
import { autoMoviePlanarRegionFailure } from "./planarRegion";
import {
  IAutoMovieProfilePoint,
  IAutoMovieRegionRing,
  IAutoMovieRegionTriangulation,
} from "./proceduralMeshTypes";

/**
 * Triangulate a free-form planar region: one arbitrary ring less its holes.
 *
 * This is the kernel's escape from convexity. A convex hull is the wrong answer
 * for an L-shaped section, a channel, a cornice, or a tube, because the hull
 * covers ground the region does not; [extrudeAutoMovieProfile](./proceduralConvexProfile.ts) refuses a
 * concave contour rather than quietly filling it in, and this is what the
 * refusal points at. The contour is taken as authored, each hole is bridged
 * into it, and the result is ear-clipped, so the triangles cover exactly the
 * enclosed area and nothing else.
 *
 * Rings are refused rather than repaired: fewer than three points, a non-finite
 * coordinate, a point repeated beside itself, a spike that doubles back along
 * its own edge, a ring enclosing no area, and a ring crossing itself each raise
 * their own diagnostic. Two rings may not touch or cross either, and a hole
 * must lie strictly inside the outer ring and outside every other hole. A hole
 * that does not is not a void this kernel guesses at; it is a region the author
 * has not described.
 *
 * Winding is canonicalized rather than demanded: the outer ring comes back
 * counter-clockwise and every hole clockwise, whichever way each was authored,
 * because which ring bounds the region and which is a void is settled by
 * containment and not by the order the points were typed in. The emitted
 * triangles are counter-clockwise, so the region faces +Z.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation Refuses malformed planar topology before producing triangles.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure Implements the shared numeric and topology validation contract for free-form regions.
 */
export const triangulateAutoMovieRegion = (props: {
  outer: readonly IAutoMovieProfilePoint[];
  holes?: ReadonlyArray<readonly IAutoMovieProfilePoint[]>;
}): IAutoMovieRegionTriangulation =>
  triangulateRegion(props.outer, props.holes ?? [], "polygon");

/**
 * Validate one region and lay its rings out canonically, naming them the way
 * its caller calls them.
 *
 * The public entry says `polygon`, a loft says which section it is checking, so
 * an author reading a refusal learns which of six sections carries the ring
 * that crosses itself rather than that "the outer ring" does.
 *
 * Triangles are not cut here, because a loft needs every section validated and
 * laid out but only triangulates the two it caps with. Cutting them for all of
 * them would be work thrown away, which is also a claim in the code that the
 * middle sections are triangulated when nothing reads those triangles.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Normalizes validated outer and hole rings without inventing vertices or changing the caller.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Returns copied canonical rings and signed area for extrusion and loft correspondence.
 */
export const canonicalRegion = (
  outer: readonly IAutoMovieProfilePoint[],
  holes: ReadonlyArray<readonly IAutoMovieProfilePoint[]>,
  label: string,
): Omit<IAutoMovieRegionTriangulation, "triangles"> => {
  const failure = autoMoviePlanarRegionFailure({ outer, holes, label });
  if (failure !== null) throw new Error(failure);
  const loops = [outer, ...holes].map((ring, index) =>
    orientedRing(
      ring.map((point) => ({ x: point.x, y: point.y })),
      index === 0,
    ),
  );
  const points: IAutoMovieProfilePoint[] = [];
  const rings: IAutoMovieRegionRing[] = [];
  for (const loop of loops) {
    rings.push({ start: points.length, count: loop.length });
    for (const point of loop) points.push(point);
  }
  return {
    points,
    rings,
    area: loops.reduce((total, loop) => total + signedArea(loop), 0),
  };
};

/** One canonical region, bridged into a single ring and ear-clipped.
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Resolves an admitted planar region into triangles while retaining its holes.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Combines canonical ring admission with deterministic bridged ear clipping.
 */
export const triangulateRegion = (
  outer: readonly IAutoMovieProfilePoint[],
  holes: ReadonlyArray<readonly IAutoMovieProfilePoint[]>,
  label: string,
): IAutoMovieRegionTriangulation => {
  const region = canonicalRegion(outer, holes, label);
  return { ...region, triangles: trianglesOf(region) };
};

/** The triangles one already-validated region resolves to.
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Triangulates an already admitted region for real cap geometry.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Uses the canonical region identities for the cap indices consumed by extrusion and loft.
 */
export const trianglesOf = (
  region: Omit<IAutoMovieRegionTriangulation, "triangles">,
): number[] => earClip(region.points, bridgeHoles(region.points, region.rings));

/**
 * The ring wound the way asked for, reversed in place when it disagrees.
 *
 * Reversal maps corner `k` to corner `size - 1 - k`, which is a relabelling a
 * triangulation does not care about and a loft does: the loft refuses sections
 * whose rings disagree in winding, so every section is reversed or none is, and
 * corner `k` of one section still answers to corner `k` of the next.
 */
const orientedRing = (
  points: IAutoMovieProfilePoint[],
  counterClockwise: boolean,
): IAutoMovieProfilePoint[] =>
  signedArea(points) > 0 === counterClockwise ? points : points.reverse();

/** Twice the shoelace sum, halved: positive counter-clockwise, in m².
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Measures the orientation and area of a metric construction ring.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Supplies the signed shoelace area used to preserve ring correspondence and winding.
 */
export const signedArea = (
  points: readonly IAutoMovieProfilePoint[],
): number => {
  let total = 0;
  for (let index = 0; index < points.length; ++index) {
    const from = points[index]!;
    const to = points[(index + 1) % points.length]!;
    total += from.x * to.y - to.x * from.y;
  }
  return total / 2;
};

/** Twice the signed area of the triangle `origin -> from -> to`. */
const cross2 = (
  origin: IAutoMovieProfilePoint,
  from: IAutoMovieProfilePoint,
  to: IAutoMovieProfilePoint,
): number =>
  (from.x - origin.x) * (to.y - origin.y) -
  (from.y - origin.y) * (to.x - origin.x);

/**
 * Do two segments share any point at all, touching included?
 *
 * Touching counts because a region whose rings meet at one point is not two
 * regions with a shared corner; it is a surface pinched to a line, the same
 * shape [buildAutoMovieWall](./proceduralWall.ts) refuses when two openings meet at a corner.
 */
const segmentsMeet = (
  fromA: IAutoMovieProfilePoint,
  toA: IAutoMovieProfilePoint,
  fromB: IAutoMovieProfilePoint,
  toB: IAutoMovieProfilePoint,
): boolean => {
  if (
    straddles(cross2(fromB, toB, fromA), cross2(fromB, toB, toA)) &&
    straddles(cross2(fromA, toA, fromB), cross2(fromA, toA, toB))
  )
    return true;
  const contacts: ReadonlyArray<
    readonly [
      IAutoMovieProfilePoint,
      IAutoMovieProfilePoint,
      IAutoMovieProfilePoint,
    ]
  > = [
    [fromB, toB, fromA],
    [fromB, toB, toA],
    [fromA, toA, fromB],
    [fromA, toA, toB],
  ];
  return contacts.some(([from, to, point]) => {
    if (Math.abs(cross2(from, to, point)) > PLANAR_EPSILON) return false;
    const spanX = to.x - from.x;
    const spanY = to.y - from.y;
    const along =
      ((point.x - from.x) * spanX + (point.y - from.y) * spanY) /
      (spanX * spanX + spanY * spanY);
    return along >= -PLANAR_EPSILON && along <= 1 + PLANAR_EPSILON;
  });
};

/** Are two points on strictly opposite sides of the same line? */
const straddles = (left: number, right: number): boolean =>
  Math.abs(left) > PLANAR_EPSILON &&
  Math.abs(right) > PLANAR_EPSILON &&
  left * right < 0;

/** Even-odd ray cast along +X; the caller guarantees the point is off-ring. */
const pointInRing = (
  point: IAutoMovieProfilePoint,
  ring: readonly IAutoMovieProfilePoint[],
): boolean => {
  let inside = false;
  for (let index = 0; index < ring.length; ++index) {
    const from = ring[index]!;
    const to = ring[(index + 1) % ring.length]!;
    if (
      from.y > point.y !== to.y > point.y &&
      point.x <
        from.x + ((point.y - from.y) / (to.y - from.y)) * (to.x - from.x)
    )
      inside = !inside;
  }
  return inside;
};

/**
 * Fold every hole into the outer ring along a bridge nothing else crosses.
 *
 * The bridge is a segment travelled in both directions, so the region becomes
 * one ring an ear clipper can consume while the void stays a void: the two
 * traversals meet nothing between them. The pair is searched in declared order,
 * which is what keeps the same input producing the same triangles.
 *
 * A hole validated as strictly inside the region and meeting no other ring
 * always has a mutually visible vertex to bridge to, which is why the search is
 * read as total rather than guarded: the guard would answer a question
 * {@link refuseHolePlacement} and {@link refuseRingContacts} already settled.
 */
const bridgeHoles = (
  points: readonly IAutoMovieProfilePoint[],
  rings: readonly IAutoMovieRegionRing[],
): number[] => {
  const loops = rings.map((span) =>
    Array.from({ length: span.count }, (_unused, index) => span.start + index),
  );
  const shapes = rings.map((span) =>
    points.slice(span.start, span.start + span.count),
  );
  const ring = [...loops[0]!];
  for (let hole = 1; hole < loops.length; ++hole) {
    const bridge = ring
      .flatMap((_anchor, at) =>
        loops[hole]!.map((_corner, from) => ({ at, from })),
      )
      .find((candidate) =>
        bridgeIsClear(points, shapes, ring, loops, hole, candidate),
      )!;
    const rotated = [
      ...loops[hole]!.slice(bridge.from),
      ...loops[hole]!.slice(0, bridge.from),
    ];
    const anchor = ring[bridge.at]!;
    const tail = ring.splice(bridge.at + 1);
    for (const index of rotated) ring.push(index);
    ring.push(rotated[0]!, anchor);
    for (const index of tail) ring.push(index);
  }
  return ring;
};

/** Does one candidate bridge stay inside the region and meet nothing? */
const bridgeIsClear = (
  points: readonly IAutoMovieProfilePoint[],
  shapes: ReadonlyArray<readonly IAutoMovieProfilePoint[]>,
  ring: readonly number[],
  loops: ReadonlyArray<readonly number[]>,
  hole: number,
  candidate: { at: number; from: number },
): boolean => {
  const start = points[ring[candidate.at]!]!;
  const end = points[loops[hole]![candidate.from]!]!;
  const size = ring.length;
  for (let edge = 0; edge < size; ++edge)
    if (
      edge !== candidate.at &&
      edge !== (candidate.at + size - 1) % size &&
      segmentsMeet(
        start,
        end,
        points[ring[edge]!]!,
        points[ring[(edge + 1) % size]!]!,
      )
    )
      return false;
  for (let other = hole; other < loops.length; ++other) {
    const loop = loops[other]!;
    for (let edge = 0; edge < loop.length; ++edge)
      if (
        (other !== hole ||
          (edge !== candidate.from &&
            edge !== (candidate.from + loop.length - 1) % loop.length)) &&
        segmentsMeet(
          start,
          end,
          points[loop[edge]!]!,
          points[loop[(edge + 1) % loop.length]!]!,
        )
      )
        return false;
  }
  const middle = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };
  return (
    pointInRing(middle, shapes[0]!) &&
    shapes.every(
      (shape, at) => at === 0 || pointInRing(middle, shape) === false,
    )
  );
};

/**
 * Cut ears off one counter-clockwise ring until three corners are left.
 *
 * Each cut retains every remaining boundary vertex, including a straight-edge
 * subdivision. Input validation does not prove that a floating-point ear search
 * succeeded; a failed search must refuse before an invalid index is emitted.
 */
const earClip = (
  points: readonly IAutoMovieProfilePoint[],
  ring: readonly number[],
): number[] => {
  const working = [...ring];
  const triangles: number[] = [];
  for (let remaining = working.length; remaining > 3; --remaining) {
    const size = working.length;
    const at = working.findIndex((_corner, index) =>
      isEar(points, working, index),
    );
    if (at === -1)
      throw new Error("polygon triangulation could not find a valid ear");
    triangles.push(
      working[(at + size - 1) % size]!,
      working[at]!,
      working[(at + 1) % size]!,
    );
    working.splice(at, 1);
  }
  triangles.push(working[0]!, working[1]!, working[2]!);
  return triangles;
};

/**
 * Is the corner at `at` an ear: convex, with no other vertex in or on it?
 *
 * A vertex on the proposed diagonal blocks the cut too: skipping it can leave
 * only a zero-area chain for the remaining triangulation. A bridge repeats its
 * endpoints by index; those copies are the triangle's own corners, not blockers.
 */
const isEar = (
  points: readonly IAutoMovieProfilePoint[],
  ring: readonly number[],
  at: number,
): boolean => {
  const size = ring.length;
  const previousAt = (at + size - 1) % size;
  const nextAt = (at + 1) % size;
  const previous = points[ring[previousAt]!]!;
  const corner = points[ring[at]!]!;
  const next = points[ring[nextAt]!]!;
  if (cross2(previous, corner, next) <= PLANAR_EPSILON) return false;
  return ring.every((vertex) => {
    if (
      vertex === ring[previousAt] ||
      vertex === ring[at] ||
      vertex === ring[nextAt]
    )
      return true;
    return (
      insideOrOnTriangle(previous, corner, next, points[vertex]!) === false
    );
  });
};

/** Is the point inside or on the counter-clockwise triangle `a b c`? */
const insideOrOnTriangle = (
  a: IAutoMovieProfilePoint,
  b: IAutoMovieProfilePoint,
  c: IAutoMovieProfilePoint,
  point: IAutoMovieProfilePoint,
): boolean =>
  cross2(a, b, point) >= -PLANAR_EPSILON &&
  cross2(b, c, point) >= -PLANAR_EPSILON &&
  cross2(c, a, point) >= -PLANAR_EPSILON;

/**
 * Largest cross product or distance a free-form ring may call zero.
 *
 * Three orders of magnitude below [FACE_EPSILON](./proceduralPolyhedron.ts), because a cross product
 * is an area and an arc drawn at millimetre resolution turns through one at
 * every corner: at 1e-9 a finely tessellated arch would read as a straight line
 * and lose every ear the triangulator needs.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Keeps the region kernel numerical tolerance explicit.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Sets the cross-product and segment-contact slack used by deterministic planar construction.
 */
export const PLANAR_EPSILON = 1e-12;
