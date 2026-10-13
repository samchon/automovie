import { HUMAN_PERSON_SEAM } from "../constants/HUMAN_PERSON_SEAM";

/**
 * Read the first sorted collar distance containing headShare=0.95 of sampled head-bone weight strictly inside limit. Distances/limit use metres and weights are dimensionless source rig gains. This is vertex-count sampling without surface-area weighting; tessellation density affects the observation. The caller supplies nonnegative distances (Infinity for unreachable), finite positive limit and finite nonnegative gains from a pure stable headWeight callback, which is called again during the running sum.
 *
 * No positive total weight refuses. Infinity distances are excluded under the admitted finite limit; a reached result may be zero, and the seam compiler separately requires positive reach. This source rig statistic supplies a transition convention rather than a measured biological fade, clinical neck limit or current displayed result.
 *
 * @evidence contracts/common.md#principled-implementation Actual reachable source distances and head-bone weights determine the sampled cumulative 0.95 mass distance used by face rig blending.
 * @evidence contracts/common.md#clear-and-simple-design This observer sorts/accumulates one source statistic; graph distances, bone map production and final positive-reach admission remain dedicated owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing positive head mass refuses, vertex gains are not called area-weighted tissue mass, and callback/finite-limit premises are not falsely claimed validated.
 * @evidence contracts/common.md#meaningful-documentation Prose states strict limit, metre/dimensionless domains, density dependence, repeated callback and zero-result boundary.
 * @evidence contracts/performance.md#efficient-algorithms N distances filter to K candidates, O(K log K) sorting precedes two weight passes whose actual callback work remains source-owner cost.
 * @evidence contracts/performance.md#reuse-equivalent-work One sorted candidate order serves total and cumulative mass without re-sorting; source distances are borrowed rather than recomputed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Candidate indices are call-local and only the scalar distance escapes, with no callback, source geometry, worker or render resource retained.
 */
export function measureHumanHeadReach(
  distance: Float64Array,
  headWeight: (vertex: number) => number,
  limit: number,
): number {
  const order: number[] = [];
  for (let vertex: number = 0; vertex < distance.length; vertex++)
    if (distance[vertex] < limit) order.push(vertex);
  order.sort((a: number, b: number): number => distance[a] - distance[b]);
  const total: number = order.reduce((sum: number, vertex: number): number => sum + headWeight(vertex), 0);
  if (!(total > 0))
    throw new Error("The skin near the collar has no head weight to fade.");
  let running: number = 0;
  for (const vertex of order) {
    running += headWeight(vertex);
    if (running >= HUMAN_PERSON_SEAM.headShare * total) return distance[vertex];
  }
  return distance[order[order.length - 1]];
}
