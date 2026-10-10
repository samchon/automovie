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
