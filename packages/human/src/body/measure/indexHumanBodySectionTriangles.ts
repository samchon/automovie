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
 * hundred triangles it can cut. `measureHumanBodySection` then walks only
 * those. A listed triangle need not straddle: the exact sign test of the
 * cut decides that, on the same arithmetic as a full walk, so the section is
 * the one a full walk gives. A triangle that straddles is always listed,
 * because its corner projections bracket the level within the margin.
 *
 * The normal must be finite; the levels need no order. Coordinates are
 * metres in the rest body's frame, the levels are metres along the normal
 * and an empty stack answers an empty list. Cost is linear in the triangle
 * count plus the listed triangles, once per stack.
 *
 * @evidence contracts/common.md#principled-implementation A triangle can change sign across a plane only when the plane's level lies between its lowest and highest corner projections, so listing every triangle whose span holds the level, widened by a margin far above the rounding of the two arrangements of the same products, is a superset of the straddlers; the exact sign test stays in the cut. The bisection over the sorted levels is the ordinary lower-bound search.
 * @evidence contracts/common.md#clear-and-simple-design One responsibility: which triangles a stack of parallel planes can reach. The cut, the loops and the tape stay in `measureHumanBodySection`, which takes the list as an optional argument and otherwise walks everything.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No surface, landmark, rule or expected girth is named; the list depends on the triangles, the normal and the levels alone, and the cut still decides every crossing.
 * @evidence contracts/common.md#meaningful-documentation The comment states the reason for the index, the superset guarantee and its margin, the ordering the cut relies on, the units and the cost.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function is an index over triangles and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry, only triangle ordinals of the surface it was given.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint a viewer displays; the measuring reader that consumes it answers that chapter.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is not an input through which a caller shapes a body.
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
