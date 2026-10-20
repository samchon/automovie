import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { polygonDoubleArea } from "../architecture/polygonDoubleArea";
import { autoMoviePlanarRegionFailure } from "../geometry/autoMoviePlanarRegionFailure";

/**
 * Ear-clip one simple planar polygon into triangle index triples.
 *
 * Each pass clips the best-scoring remaining corner: a reflex or straight
 * corner scores below a convex corner whose triangle still covers another
 * remaining corner, which scores below a true ear, and among ears the one with
 * the largest turn, the fattest, wins, with ties going to the earliest
 * position. Scoring rather than searching for an ear means some corner is
 * always best, so every pass makes progress.
 *
 * Throws an `Error` for fewer than three corners, and with the
 * {@link autoMoviePlanarRegionFailure} message for a ring that is not one
 * unambiguous region, because a triangle of undefined or crossing corners
 * would put a face of nothing into a drawing.
 *
 * The ring is walked counter-clockwise whichever way it was authored, so a
 * clockwise outline triangulates as its own region rather than clipping its
 * reflex corners as ears.
 *
 * @param polygon Simple ring in a planar frame, either winding.
 * @returns `n - 2` triples of indices into `polygon`, each wound
 *   counter-clockwise.
 *
 * @evidence contracts/common.md#principled-implementation Ear clipping, which triangulates any simple polygon because one always has two ears (Meisters' two-ears theorem); the premise of a simple ring is enforced by `autoMoviePlanarRegionFailure` before clipping, the ring is oriented counter-clockwise by its shoelace sign so a positive turn means convex, and covered counts include corners on a triangle's boundary, so a touching corner blocks an ear rather than producing a sliver that crosses it.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the triangulation of a cap outline; the turn, coverage and containment rules are private helpers because nothing else scores ears.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No polygon is special-cased, and a ring with no clean ear is clipped at its best corner by the same score instead of through a fallback branch.
 * @evidence contracts/common.md#meaningful-documentation The comment states the scoring order and tie rule, why progress is guaranteed, both refusals and their messages, that either winding is accepted and walked counter-clockwise, and the shape and winding of the result.
 * @evidence contracts/performance.md#efficient-algorithms For `n` corners, the initial coverage counts cost `O(n^2)`, and each of the `n - 3` passes costs `O(n)`: one scan for the best score, one containment test of the clipped corner against every other triangle to decrement the counts it leaves, and a full recount for only the two neighbours whose triangles change, so the whole clip is `O(n^2)` with linear extra space.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function called once per face-only boundary per drawing; the scores it maintains are reused across its own passes and nothing outlives the call.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The ring, turn and coverage arrays are allocated per call and released when it returns; only the returned triples survive.
 */
export const triangulateAutoMoviePolygon = (
  polygon: readonly IAutoMoviePlanarPoint[],
): Array<[number, number, number]> => {
  if (polygon.length < 3)
    throw new Error(
      `a polygon needs at least 3 corners to triangulate, but had ${polygon.length}`,
    );
  const failure: string | null = autoMoviePlanarRegionFailure({
    outer: polygon,
  });
  if (failure !== null) throw new Error(failure);
  // Walked counter-clockwise whatever the authored winding, because the turn
  // test reads a positive turn as convex.
  const ring: number[] = polygon.map(
    (_: IAutoMoviePlanarPoint, index: number): number => index,
  );
  if (polygonDoubleArea(polygon) < 0) ring.reverse();
  const turns: number[] = ring.map((_: number, index: number): number =>
    turnAt(polygon, ring, index),
  );
  const covers: number[] = ring.map((_: number, index: number): number =>
    coverAt(polygon, ring, index),
  );
  const triangles: Array<[number, number, number]> = [];
  while (ring.length > 3) {
    const size: number = ring.length;
    let pick: number = 0;
    let best: number = score(turns[0]!, covers[0]!);
    for (let index: number = 1; index < size; ++index) {
      const candidate: number = score(turns[index]!, covers[index]!);
      if (candidate > best) {
        best = candidate;
        pick = index;
      }
    }
    const previous: number = (pick + size - 1) % size;
    const next: number = (pick + 1) % size;
    triangles.push([ring[previous]!, ring[pick]!, ring[next]!]);
    // The clipped corner leaves every triangle that counted it. Only the two
    // neighbours' triangles change shape, so only they are recounted below.
    const clipped: IAutoMoviePlanarPoint = polygon[ring[pick]!]!;
    for (let index: number = 0; index < size; ++index) {
      if (index === pick || index === previous || index === next) continue;
      if (inTriangle(clipped, ...cornerTriangle(polygon, ring, index)))
        --covers[index];
    }
    ring.splice(pick, 1);
    turns.splice(pick, 1);
    covers.splice(pick, 1);
    for (const neighbour of [
      pick === 0 ? ring.length - 1 : pick - 1,
      pick % ring.length,
    ]) {
      turns[neighbour] = turnAt(polygon, ring, neighbour);
      covers[neighbour] = coverAt(polygon, ring, neighbour);
    }
  }
  triangles.push([ring[0]!, ring[1]!, ring[2]!]);
  return triangles;
};

/** Rank a corner: `-1` reflex or straight, `0` covered, else its turn. */
const score = (turn: number, cover: number): number =>
  turn <= 0 ? -1 : cover > 0 ? 0 : turn;

/** The corner at ring position `index` with its two ring neighbours. */
const cornerTriangle = (
  polygon: readonly IAutoMoviePlanarPoint[],
  ring: readonly number[],
  index: number,
): [IAutoMoviePlanarPoint, IAutoMoviePlanarPoint, IAutoMoviePlanarPoint] => [
  polygon[ring[(index + ring.length - 1) % ring.length]!]!,
  polygon[ring[index]!]!,
  polygon[ring[(index + 1) % ring.length]!]!,
];

/** Twice the signed area of a corner's triangle; positive when convex. */
const turnAt = (
  polygon: readonly IAutoMoviePlanarPoint[],
  ring: readonly number[],
  index: number,
): number => {
  const [previous, corner, next] = cornerTriangle(polygon, ring, index);
  return (
    (corner.x - previous.x) * (next.y - previous.y) -
    (corner.y - previous.y) * (next.x - previous.x)
  );
};

/** How many other ring corners lie in or on a corner's triangle. */
const coverAt = (
  polygon: readonly IAutoMoviePlanarPoint[],
  ring: readonly number[],
  index: number,
): number => {
  const triangle: [
    IAutoMoviePlanarPoint,
    IAutoMoviePlanarPoint,
    IAutoMoviePlanarPoint,
  ] = cornerTriangle(polygon, ring, index);
  const size: number = ring.length;
  let count: number = 0;
  for (let other: number = 0; other < size; ++other) {
    if (
      other === index ||
      other === (index + size - 1) % size ||
      other === (index + 1) % size
    )
      continue;
    if (inTriangle(polygon[ring[other]!]!, ...triangle)) ++count;
  }
  return count;
};

/** Whether `point` lies in or on the counter-clockwise triangle `abc`. */
const inTriangle = (
  point: IAutoMoviePlanarPoint,
  a: IAutoMoviePlanarPoint,
  b: IAutoMoviePlanarPoint,
  c: IAutoMoviePlanarPoint,
): boolean => {
  const side = (
    from: IAutoMoviePlanarPoint,
    to: IAutoMoviePlanarPoint,
  ): number =>
    (to.x - from.x) * (point.y - from.y) - (to.y - from.y) * (point.x - from.x);
  return side(a, b) >= 0 && side(b, c) >= 0 && side(c, a) >= 0;
};
