import type { IAutoMovieHumanPersonRestHead } from "../structures/IAutoMovieHumanPersonRestHead";
import type { IAutoMovieHumanPersonHeadReading } from "../structures/IAutoMovieHumanPersonHeadReading";
import type { IAutoMovieHumanPersonTragionTopMeasurement } from "../structures/IAutoMovieHumanPersonTragionTopMeasurement";
import { humanPersonHeadPoint } from "./humanPersonHeadPoint";

/**
 * Read tragion–top of head on a head view at rest: the height of the highest
 * head view vertex above the rule's tragion. On a triangle mesh the highest
 * point is a vertex, so the horizontal plane tangent to the top of the head
 * (ANSUR II 6.4.83) touches it.
 *
 * @evidence contracts/common.md#principled-implementation The vertex is the skin's own highest point, found on each skin.
 * @evidence contracts/common.md#clear-and-simple-design One pass for the top and one point lookup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The tragion is the declared point; a missing name refuses.
 * @evidence contracts/common.md#meaningful-documentation States the instrument and why a vertex is the tangent point.
 * @evidence contracts/modeling.md#spatial-conventions A height along +Y of the person frame, metres.
 * @evidence contracts/anatomy.md#anatomical-source Follows ANSUR II 6.4.83 as the rule cites it.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; its reading carries the points a render marks.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing; the rule's range is a report.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function readHumanPersonTragionTop(
  head: IAutoMovieHumanPersonRestHead,
  rule: IAutoMovieHumanPersonTragionTopMeasurement,
): IAutoMovieHumanPersonHeadReading {
  const tragion = humanPersonHeadPoint(head, rule.tragion);
  let top = 0;
  for (let v = 1; v < head.positions.length / 3; v++)
    if (head.positions[v * 3 + 1] > head.positions[top * 3 + 1]) top = v;
  const vertex = { x: head.positions[top * 3], y: head.positions[top * 3 + 1], z: head.positions[top * 3 + 2] };
  return { metres: vertex.y - tragion.y, points: { tragion, vertex } };
}
