import { IAutoMoviePlanarPoint } from "@automovie/interface";
import { outlineHull } from "../architecture/outlineHull";
import { autoMoviePlanarRegionFailure } from "../geometry/planarRegion";
import { autoMovieDrawingRange } from "./autoMovieDrawingRange";

/**
 * Ear-clip one simple planar polygon into triangle index triples.
 *
 * Each pass scores every remaining corner and clips the best one: a reflex
 * corner scores below a convex corner that still covers another vertex, which
 * scores below a true ear, and among ears the fattest wins. Scoring rather than
 * searching is what removes the "no ear was found" case entirely — one corner
 * is always the best one — so the loop always makes progress and there is no
 * unreachable branch pretending to handle an impossible polygon.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation Refuses a non-finite, degenerate, self-intersecting, or otherwise malformed planar polygon before it can create false drawing faces.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure Applies the shared planar-region validity check, then deterministically ear-clips the accepted simple polygon into index triples.
 * @author Samchon
 */
export const triangulateAutoMoviePolygon = (
  polygon: readonly IAutoMoviePlanarPoint[],
): Array<[number, number, number]> => {
  // Refused rather than returned empty: fewer than three corners is not a
  // polygon with no triangles in it, it is a caller that meant something else,
  // and quietly handing back a triangle of undefined corners would put a face
  // of nothing into a drawing.
  if (polygon.length < 3)
    throw new Error(
      `a polygon needs at least 3 corners to triangulate, but had ${polygon.length}`,
    );
  const failure = autoMoviePlanarRegionFailure({ outer: polygon });
  if (failure !== null) throw new Error(failure);
  const ring = polygon.map((_, index) => index);
  const triangles: Array<[number, number, number]> = [];
  while (ring.length > 3) {
    const pick = ring.reduce(
      (best, _, index) =>
        earScore(polygon, ring, index) > earScore(polygon, ring, best)
          ? index
          : best,
      0,
    );
    triangles.push([
      ring[(pick + ring.length - 1) % ring.length]!,
      ring[pick]!,
      ring[(pick + 1) % ring.length]!,
    ]);
    ring.splice(pick, 1);
  }
  triangles.push([ring[0]!, ring[1]!, ring[2]!]);
  return triangles;
};

const earScore = (
  polygon: readonly IAutoMoviePlanarPoint[],
  ring: readonly number[],
  index: number,
): number => {
  const previous = polygon[ring[(index + ring.length - 1) % ring.length]!]!;
  const corner = polygon[ring[index]!]!;
  const next = polygon[ring[(index + 1) % ring.length]!]!;
  const turn =
    (corner.x - previous.x) * (next.y - previous.y) -
    (corner.y - previous.y) * (next.x - previous.x);
  if (turn <= 0) return -1;
  for (let other = 0; other < ring.length; ++other) {
    if (
      other === index ||
      other === (index + ring.length - 1) % ring.length ||
      other === (index + 1) % ring.length
    )
      continue;
    if (inTriangle(polygon[ring[other]!]!, previous, corner, next)) return 0;
  }
  return turn;
};

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

/** The circle one bulged edge runs on. */
interface IArc {
  center: IAutoMoviePlanarPoint;
  radius: number;
  start: number;
  sweep: number;
}

const arcOf = (
  from: IAutoMoviePlanarPoint,
  to: IAutoMoviePlanarPoint,
  bulge: number,
): IArc | null => {
  if (Math.abs(bulge) <= BULGE_EPSILON) return null;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const chord = Math.hypot(dx, dy);
  if (chord <= BULGE_EPSILON) return null;
  // The bulge is `tan(|sweep| / 4)` and, in this design's convention, a positive
  // one bulges to the LEFT of the edge's own direction — the same convention
  // `outlineHull` places its sagitta by, because two spellings of which way an
  // arch curves is one spelling too many. The centre therefore sits on the
  // opposite side of the chord from the bulge, at the signed distance below,
  // which runs off to infinity exactly as the bulge goes to zero and the arc
  // becomes the chord; and the sweep runs clockwise for a positive bulge, which
  // is what puts the arc on the left.
  const offset = (chord * (1 - bulge * bulge)) / (4 * bulge);
  const center = {
    x: (from.x + to.x) / 2 + (offset * dy) / chord,
    y: (from.y + to.y) / 2 - (offset * dx) / chord,
  };
  return {
    center,
    radius: Math.hypot(chord / 2, offset),
    start: Math.atan2(from.y - center.y, from.x - center.x),
    sweep: -4 * Math.atan(bulge),
  };
};

const span = (values: readonly number[]): number => {
  const range = autoMovieDrawingRange(values);
  return range.max - range.min;
};

const earScore = (
  polygon: readonly IAutoMoviePlanarPoint[],
  ring: readonly number[],
  index: number,
): number => {
  const previous = polygon[ring[(index + ring.length - 1) % ring.length]!]!;
  const corner = polygon[ring[index]!]!;
  const next = polygon[ring[(index + 1) % ring.length]!]!;
  const turn =
    (corner.x - previous.x) * (next.y - previous.y) -
    (corner.y - previous.y) * (next.x - previous.x);
  if (turn <= 0) return -1;
  for (let other = 0; other < ring.length; ++other) {
    if (
      other === index ||
      other === (index + ring.length - 1) % ring.length ||
      other === (index + 1) % ring.length
    )
      continue;
    if (inTriangle(polygon[ring[other]!]!, previous, corner, next)) return 0;
  }
  return turn;
};

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

/** The circle one bulged edge runs on. */
interface IArc {
  center: IAutoMoviePlanarPoint;
  radius: number;
  start: number;
  sweep: number;
}
