import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanHeadBreadthMeasurement } from "./IAutoMovieHumanHeadBreadthMeasurement";
import type { IAutoMovieHumanHeadReading } from "./IAutoMovieHumanHeadReading";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { humanHeadEar } from "./humanHeadEar";

/**
 * Read head breadth on a head view at rest: the X extent of the head above
 * the ears, the ears left out.
 *
 * The triangles touching either declared ear area are not searched. Of the
 * rest, each side (right is -X) is searched above that side's ear top: every
 * vertex at or above the top, and every edge crossing of the top's height,
 * so the bound is exact rather than snapped to a vertex. The euryons are the
 * outermost points found on each side and the breadth is their X distance,
 * the separation of two sagittal planes touching the head, which is what a
 * spreading caliper held horizontal across the head reads at its maximum.
 * A side with no point above its ear refuses by name.
 *
 * Triangle exclusion removes the declared ear's lateral extent even above
 * the area height bound. The height condition separately excludes lower
 * non-ear scalp; both predicates retain their own source-derived population.
 *
 * @evidence contracts/common.md#principled-implementation The ears are left out as declared areas and the bound is read from those areas on each skin.
 * @evidence contracts/common.md#clear-and-simple-design One pass over the triangles that remain.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty side refuses; the bound is the ear's own top, not a constant.
 * @evidence contracts/common.md#meaningful-documentation States the exclusion, the bound, the extent and why both conditions are needed.
 * @evidence contracts/modeling.md#spatial-conventions Right is -X and the extent is along X of the person frame, metres.
 * @evidence contracts/anatomy.md#anatomical-source Follows ANSUR II 6.4.46 as the rule cites it.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; its reading carries the points a render marks.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing; the rule's range is a report.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function readHumanHeadBreadth(
  head: IAutoMovieHumanHeadSkin,
  rule: IAutoMovieHumanHeadBreadthMeasurement,
): IAutoMovieHumanHeadReading {
  const right = humanHeadEar(head, rule.rightEar);
  const left = humanHeadEar(head, rule.leftEar);
  const p = head.positions;
  let euryonRight: IAutoMovieVector3 | undefined;
  let euryonLeft: IAutoMovieVector3 | undefined;
  const consider = (x: number, y: number, z: number): void => {
    if (x < 0) {
      if (y >= right.top && (euryonRight === undefined || x < euryonRight.x))
        euryonRight = { x, y, z };
    } else if (y >= left.top && (euryonLeft === undefined || x > euryonLeft.x))
      euryonLeft = { x, y, z };
  };
  for (let t = 0; t < head.indices.length / 3; t++) {
    if (right.triangles.has(t) || left.triangles.has(t)) continue;
    for (let k = 0; k < 3; k++) {
      const a = head.indices[t * 3 + k];
      const b = head.indices[t * 3 + ((k + 1) % 3)];
      consider(p[a * 3], p[a * 3 + 1], p[a * 3 + 2]);
      // the crossing of the bound height on this edge, for the side the edge lies on
      const bound = p[a * 3] < 0 ? right.top : left.top;
      const da = p[a * 3 + 1] - bound;
      const db = p[b * 3 + 1] - bound;
      if (da >= 0 === db >= 0) continue;
      const s = da / (da - db);
      consider(
        p[a * 3] + s * (p[b * 3] - p[a * 3]),
        bound,
        p[a * 3 + 2] + s * (p[b * 3 + 2] - p[a * 3 + 2]),
      );
    }
  }
  if (euryonRight === undefined || euryonLeft === undefined)
    throw new Error(
      `The head view of ${head.id} has no skin above ${euryonRight === undefined ? rule.rightEar : rule.leftEar}.`,
    );
  return {
    metres: euryonLeft.x - euryonRight.x,
    points: { "euryon-right": euryonRight, "euryon-left": euryonLeft },
  };
}
