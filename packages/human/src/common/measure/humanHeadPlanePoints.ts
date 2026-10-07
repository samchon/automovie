import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";

/**
 * The points where a head view's triangle edges cross an axis-aligned plane
 * (`axis` 0, 1 or 2 for X, Y or Z at `value`). A vertex on the plane counts as the positive side, so it is
 * reached as the crossing at its own end. Only the triangles `keep` accepts
 * are cut; omitted, every triangle is.
 *
 * @evidence contracts/common.md#principled-implementation Every section-based head rule cuts the skin by this one crossing rule.
 * @evidence contracts/common.md#clear-and-simple-design One pass over the triangle edges.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Crossings are interpolated on the edges; no vertex is snapped to the plane.
 * @evidence contracts/common.md#meaningful-documentation States the plane, the crossing convention and the triangle filter.
 * @evidence contracts/modeling.md#spatial-conventions Axis-aligned planes of the head frame; points in metres.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical definition.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; its reading carries the points a render marks.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function humanHeadPlanePoints(
  head: IAutoMovieHumanHeadSkin,
  axis: 0 | 1 | 2,
  value: number,
  keep?: (triangle: number) => boolean,
): IAutoMovieVector3[] {
  const p = head.positions;
  const points: IAutoMovieVector3[] = [];
  for (let t = 0; t < head.indices.length / 3; t++) {
    if (keep !== undefined && !keep(t)) continue;
    for (let k = 0; k < 3; k++) {
      const a = head.indices[t * 3 + k];
      const b = head.indices[t * 3 + ((k + 1) % 3)];
      const da = p[a * 3 + axis] - value;
      const db = p[b * 3 + axis] - value;
      if (da >= 0 === db >= 0) continue;
      const s = da / (da - db);
      points.push({
        x: p[a * 3] + s * (p[b * 3] - p[a * 3]),
        y: p[a * 3 + 1] + s * (p[b * 3 + 1] - p[a * 3 + 1]),
        z: p[a * 3 + 2] + s * (p[b * 3 + 2] - p[a * 3 + 2]),
      });
    }
  }
  return points;
}
