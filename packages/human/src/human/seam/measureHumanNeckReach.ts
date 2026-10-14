import { HUMAN_PERSON_SEAM } from "../constants/HUMAN_PERSON_SEAM";

/**
 * Read sorted finite collar distances until the running count share of isNeck vertices falls below neckShare=0.5. The seam's callback classifies neck/head-dominated source rig vertices; counts are uniform per vertex, not surface-area or clinical tissue sampling. Caller supplies admitted nonnegative metre distances and a stable source classifier. Infinity is excluded, and any other finite value is accepted here without separate sign validation.
 *
 * No finite distance refuses. If the sampled share never falls below 0.5, return the last finite distance; zero is possible and the seam compiler separately requires positive reach. This is a rig transition convention rather than a surveyed neck extent, general anatomical admission or current visual observation.
 *
 * @evidence contracts/common.md#principled-implementation Actual reachable source distance and caller-owned dominant-bone classification determine the cumulative sampled neck-share statistic.
 * @evidence contracts/common.md#clear-and-simple-design This observer owns finite sorting/count threshold only; graph traversal, source weight classification and positive-reach admission retain their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No reachable sample refuses and no area-weighted/geodesic/clinical neck extent is fabricated from uniform vertex counts or source rig labels.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre distance, 0.5 convention, density dependence, finite/sign premise and threshold/fallback/zero behavior.
 * @evidence contracts/performance.md#efficient-algorithms N distances filter to K finite indices; O(K log K) sorting precedes at most K source-classifier calls and scalar count updates.
 * @evidence contracts/performance.md#reuse-equivalent-work One sorted reachable order supplies the threshold walk and fallback distance without recomputing graph reach or source rig weights here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Candidate indices are call-local and only the scalar metre distance escapes; no callback, geometry, task or render resource is retained.
 */
export function measureHumanNeckReach(
  distance: Float64Array,
  isNeck: (vertex: number) => boolean,
): number {
  const order: number[] = [];
  for (let vertex: number = 0; vertex < distance.length; vertex++)
    if (Number.isFinite(distance[vertex])) order.push(vertex);
  if (order.length === 0)
    throw new Error("No skin vertex is reachable from the collar.");
  order.sort((a: number, b: number): number => distance[a] - distance[b]);
  let neck: number = 0;
  for (let counted: number = 1; counted <= order.length; counted++) {
    if (isNeck(order[counted - 1])) neck++;
    if (neck / counted < HUMAN_PERSON_SEAM.neckShare)
      return distance[order[counted - 1]];
  }
  return distance[order[order.length - 1]];
}
