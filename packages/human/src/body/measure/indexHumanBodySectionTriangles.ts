import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Half the width, in metres, of the band around a station in which a triangle
 * is kept as a candidate. The signed distance a section reads is a sum of
 * three products of body coordinates (a metre or two at most) and the
 * projection this index compares is another arrangement of the same
 * products, so the two differ by rounding near 1e-15 m. A nanometre is a
 * million times that, and no straddling triangle can fall outside it.
 */
const MARGIN_METRES = 1e-9;

/**
 * For each station of a stack of parallel section planes, the ordinals of the
 * triangles that can straddle it, ascending.
 *
 * A tape rule cuts one shaped surface at ten to twenty stations along a
 * segment, all with the plane normal the rule fixes, and a full cut walks
 * every triangle at every station. A triangle straddles the plane at
 * `level` (the projection of the station's point on the normal) only when
 * that level lies between the lowest and highest projections of its corners,
 * so one pass over the triangles, projecting each corner once and finding by
 * bisection the stations its span covers, lists for every station the few
 * hundred triangles it can cut. `measureHumanSection` then walks only
 * those. A listed triangle need not straddle: the exact sign test of the
 * cut decides that, on the same arithmetic as a full walk, so the section is
 * the one a full walk gives. A triangle that straddles is always listed,
 * because its corner projections bracket the level within the margin.
 *
 * The normal must be finite; the levels need no order. Coordinates are
 * metres in the rest body's frame, the levels are metres along the normal
 * and an empty stack answers an empty list. Cost is linear in the triangle
 * count plus the listed triangles, once per stack.
 */
export function indexHumanBodySectionTriangles(
  positions: number[],
  indices: number[],
  normal: IAutoMovieVector3,
  levels: number[],
): number[][] {
  const lists: number[][] = levels.map(() => []);
  if (levels.length === 0) return lists;
  const order = levels.map((_, station) => station);
  order.sort((a, b) => levels[a] - levels[b]);
  const sorted = order.map((station) => levels[station]);
  const projection = new Float64Array(positions.length / 3);
  for (let v = 0; v < projection.length; v++)
    projection[v] =
      positions[v * 3] * normal.x +
      positions[v * 3 + 1] * normal.y +
      positions[v * 3 + 2] * normal.z;
  const first = (level: number): number => {
    let low = 0;
    let high = sorted.length;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (sorted[middle] < level) low = middle + 1;
      else high = middle;
    }
    return low;
  };
  for (let t = 0; t < indices.length / 3; t++) {
    const a = projection[indices[t * 3]];
    const b = projection[indices[t * 3 + 1]];
    const c = projection[indices[t * 3 + 2]];
    const high = Math.max(a, b, c) + MARGIN_METRES;
    for (
      let rank = first(Math.min(a, b, c) - MARGIN_METRES);
      rank < sorted.length && sorted[rank] <= high;
      rank++
    )
      lists[order[rank]].push(t);
  }
  return lists;
}
