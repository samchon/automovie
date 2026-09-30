import { HUMAN_PERSON_SEAM } from "../constants/HUMAN_PERSON_SEAM";

/**
 * How far above the collar the neck's skin turns into the head's, read from
 * the body's own rig.
 *
 * Below the collar the body's skin weights give the head a share that fades
 * with distance: the skin just under the collar follows the head a little (the
 * cervical spine carries the head's turn down the neck) and the skin far
 * below follows it not at all. The face's neck skin above the collar continues
 * that ramp upward to the head's full weight, and it should take as long to do
 * it as the body takes to let go. The length is the distance from the collar
 * within which `HUMAN_PERSON_SEAM.headShare` of all the head weight in the
 * neck's skin lies: vertices are taken in order of distance, only those
 * within `limit` count (the neck's own reach, so the shoulders' small head
 * weights are not added), and the answer is the distance at which the
 * running sum first reaches that share of the sum.
 *
 * `distance[v]` is the distance from the collar to vertex `v` along the skin
 * (`Infinity` for a vertex the collar cannot reach, which is ignored) and
 * `headWeight(v)` is the total weight the head bone has at `v`. A skin with no
 * head weight inside the limit refuses, because no ramp is defined.
 *
 * @evidence contracts/common.md#principled-implementation A cumulative share over vertices ordered by distance is the quantile of the head weight's distribution along the skin, so the result is the distance below which the stated share of the head's influence lies, and it depends only on the body's authored weights and mesh.
 * @evidence contracts/common.md#clear-and-simple-design One filter, one sort and one running sum.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No length is supplied; the share and the limit are named and stated, and a skin with no head weight refuses.
 * @evidence contracts/common.md#meaningful-documentation The comment states the statistic, what each input is, why the limit exists and the refusal.
 * @evidence contracts/modeling.md#spatial-conventions Distances are metres along the skin in the body's frame; weights are dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function measures a length and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; the ramp is observed in the assembled person under head turns.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The extent of the head's influence is read from the body basis's authored weights, whose source the body owns; the function adds no value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no input a caller shapes a human form with.
 */
export function measureHumanHeadReach(
  distance: Float64Array,
  headWeight: (vertex: number) => number,
  limit: number,
): number {
  const order: number[] = [];
  for (let vertex = 0; vertex < distance.length; vertex++)
    if (distance[vertex] < limit) order.push(vertex);
  order.sort((a, b) => distance[a] - distance[b]);
  const total = order.reduce((sum, vertex) => sum + headWeight(vertex), 0);
  if (!(total > 0))
    throw new Error("The skin near the collar has no head weight to fade.");
  let running = 0;
  for (const vertex of order) {
    running += headWeight(vertex);
    if (running >= HUMAN_PERSON_SEAM.headShare * total) return distance[vertex];
  }
  return distance[order[order.length - 1]];
}
