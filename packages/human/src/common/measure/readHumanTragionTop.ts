import type { IAutoMovieHumanHeadReading } from "./IAutoMovieHumanHeadReading";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import type { IAutoMovieHumanTragionTopMeasurement } from "./IAutoMovieHumanTragionTopMeasurement";
import { humanHeadPoint } from "./humanHeadPoint";

/**
 * Read tragion–top of head on a head view at rest: the height of the highest
 * head view vertex above the rule's tragion. On a triangle mesh the highest
 * point is a vertex, so the horizontal plane tangent to the top of the head
 * (ANSUR II 6.4.83) touches it.
 */
export function readHumanTragionTop(
  head: IAutoMovieHumanHeadSkin,
  rule: IAutoMovieHumanTragionTopMeasurement,
): IAutoMovieHumanHeadReading {
  const tragion = humanHeadPoint(head, rule.tragion);
  let top = 0;
  for (let v = 1; v < head.positions.length / 3; v++)
    if (head.positions[v * 3 + 1] > head.positions[top * 3 + 1]) top = v;
  const vertex = {
    x: head.positions[top * 3],
    y: head.positions[top * 3 + 1],
    z: head.positions[top * 3 + 2],
  };
  return { metres: vertex.y - tragion.y, points: { tragion, vertex } };
}
