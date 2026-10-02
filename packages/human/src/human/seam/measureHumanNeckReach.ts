import { HUMAN_PERSON_SEAM } from "../constants/HUMAN_PERSON_SEAM";

/**
 * How far the neck extends below the collar, read from the body's own rig.
 *
 * The body's skin weights say which bone carries each vertex. Walking the skin
 * outward from the collar in order of distance, the neck and head carry
 * nearly all of it at first, and the upper chest, the shoulder girdle and the
 * arms take over as the walk reaches the trapezius and the shoulder. The reach
 * is the distance at which the running share of neck- or head-dominated
 * vertices falls below `HUMAN_PERSON_SEAM.neckShare`: inside it the skin is
 * mostly the neck's, beyond it mostly the trunk's and shoulder's, so a neck
 * that differs between the two documents reshapes what the rig calls neck and
 * leaves the shoulder alone.
 *
 * `distance[v]` is the distance from the collar to vertex `v` along the skin
 * (`Infinity` for a vertex the collar cannot reach, which is ignored) and
 * `isNeck(v)` says whether the neck or head bone has the largest weight there.
 * A skin that never falls below the share returns its greatest finite
 * distance; one with no reachable vertex refuses.
 *
 * @evidence contracts/common.md#principled-implementation The reach is a running statistic over vertices ordered by distance, so it is the smallest distance at which the stated share is crossed, and it depends only on the body's authored weights and mesh.
 * @evidence contracts/common.md#clear-and-simple-design One sort and one running count.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No length is supplied; the only choices are the named share and the refusal of an empty input.
 * @evidence contracts/common.md#meaningful-documentation The comment states the statistic, what the two inputs are and the limiting cases.
 * @evidence contracts/modeling.md#spatial-conventions Distances are metres along the skin in the body's frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function measures a length and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; the reach is observed in the assembled person.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The extent of the neck is read from the body basis's authored weights, whose source the body owns; the function adds no value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no input a caller shapes a human form with.
 */
export function measureHumanNeckReach(
  distance: Float64Array,
  isNeck: (vertex: number) => boolean,
): number {
  const order: number[] = [];
  for (let vertex = 0; vertex < distance.length; vertex++)
    if (Number.isFinite(distance[vertex])) order.push(vertex);
  if (order.length === 0)
    throw new Error("No skin vertex is reachable from the collar.");
  order.sort((a, b) => distance[a] - distance[b]);
  let neck = 0;
  for (let counted = 1; counted <= order.length; counted++) {
    if (isNeck(order[counted - 1])) neck++;
    if (neck / counted < HUMAN_PERSON_SEAM.neckShare)
      return distance[order[counted - 1]];
  }
  return distance[order[order.length - 1]];
}
