import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanHeadReading } from "./IAutoMovieHumanHeadReading";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import type { IAutoMovieHumanTragionTopMeasurement } from "./IAutoMovieHumanTragionTopMeasurement";
import { humanHeadPoint } from "./humanHeadPoint";

/**
 * Read tragion–top of head on a head view at rest: the height of the highest
 * head view vertex above the rule's tragion. On a triangle mesh the highest
 * point is a vertex, so the horizontal plane tangent to the top of the head
 * (ANSUR II 6.4.83) touches it.
 *
 * @evidence contracts/common.md#principled-implementation The highest Y among rest-head vertices supplies the top of a piecewise-linear triangle surface, and its height above the registered tragion reports the vertical reading. Nonempty finite admitted head skin is the caller premise.
 * @evidence contracts/common.md#clear-and-simple-design The common point reader owns tragion registration and this instrument owns the complete vertex maximum and marker output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No expected stature/head height or study sample bound replaces the source maximum, and no fixture vertex is preselected as the top.
 * @evidence contracts/common.md#meaningful-documentation The comment gives triangle-vertex maximum semantics, tangent-plane role and named tragion reference; the result carries metre units and actual markers.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices, one O(V) maximum scan with O(1) candidate state is required, followed by fixed vector/result construction.
 * @evidence contracts/performance.md#reuse-equivalent-work The selected top index is reused for output coordinates and height; no cached top is shared across changed rest-head positions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One selected vector, registered point and scalar transfer to the caller; scan state is local and no skin buffer, handle or running task is retained.
 */
export function readHumanTragionTop(
  head: IAutoMovieHumanHeadSkin,
  rule: IAutoMovieHumanTragionTopMeasurement,
): IAutoMovieHumanHeadReading {
  const tragion: IAutoMovieVector3 = humanHeadPoint(head, rule.tragion);
  let top: number = 0;
  for (let v: number = 1; v < head.positions.length / 3; v++)
    if (head.positions[v * 3 + 1] > head.positions[top * 3 + 1]) top = v;
  const vertex: IAutoMovieVector3 = {
    x: head.positions[top * 3],
    y: head.positions[top * 3 + 1],
    z: head.positions[top * 3 + 2],
  };
  return { metres: vertex.y - tragion.y, points: { tragion, vertex } };
}
