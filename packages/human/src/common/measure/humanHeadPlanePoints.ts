import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";

/**
 * The points where a head view's triangle edges cross an axis-aligned plane
 * (`axis` 0, 1 or 2 for X, Y or Z at `value`). A vertex on the plane counts as the positive side, so it is
 * reached as the crossing at its own end. Only the triangles `keep` accepts
 * are cut; omitted, every triangle is. The returned metre-valued points are fresh records; shared-edge crossings and coincident endpoint samples remain duplicated.
 *
 * @evidence contracts/common.md#principled-implementation Each accepted triangle edge with opposite signed axis distances contributes its linear plane crossing; zero distance counts positive. Valid finite indexed skin is the caller premise, and duplicate edge/end coordinates are intentionally retained.
 * @evidence contracts/common.md#clear-and-simple-design One axis-aligned intersection reader supplies profile instruments; optional keep owns triangle population selection while interpolation remains here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero-side classification is the declared incidence convention rather than epsilon welding, and no expected point count or specimen edge receives a special result.
 * @evidence contracts/common.md#meaningful-documentation The comment states axis numbering, on-plane endpoint behavior and optional full/filtered population; returned points are newly allocated metre coordinates.
 * @evidence contracts/performance.md#efficient-algorithms For T triangles and C crossings, one three-edge walk uses O(T+C) time and O(C) output storage; every accepted edge must be read to preserve this sample population.
 * @evidence contracts/performance.md#reuse-equivalent-work The keep predicate is called once per triangle and distances serve that edge's crossing; samples are not cached across changed axes, values or predicate effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The output array and coordinate records transfer to the caller with at most two crossing entries per nondegenerate straddling triangle; no input buffer, handle or asynchronous task is retained.
 */
export function humanHeadPlanePoints(
  head: IAutoMovieHumanHeadSkin,
  axis: 0 | 1 | 2,
  value: number,
  keep?: (triangle: number) => boolean,
): IAutoMovieVector3[] {
  const p: number[] = head.positions;
  const points: IAutoMovieVector3[] = [];
  for (let t: number = 0; t < head.indices.length / 3; t++) {
    if (keep !== undefined && !keep(t)) continue;
    for (let k: number = 0; k < 3; k++) {
      const a: number = head.indices[t * 3 + k];
      const b: number = head.indices[t * 3 + ((k + 1) % 3)];
      const da: number = p[a * 3 + axis] - value;
      const db: number = p[b * 3 + axis] - value;
      if (da >= 0 === db >= 0) continue;
      const s: number = da / (da - db);
      points.push({
        x: p[a * 3] + s * (p[b * 3] - p[a * 3]),
        y: p[a * 3 + 1] + s * (p[b * 3 + 1] - p[a * 3 + 1]),
        z: p[a * 3 + 2] + s * (p[b * 3 + 2] - p[a * 3 + 2]),
      });
    }
  }
  return points;
}
