import { IAutoMovieSoftBodyDomain } from "@automovie/interface";

import { shortestRestLength } from "./shortestRestLength";

/** Report dt*declared reference speed divided by the shortest structural rest edge; no-edge Infinity yields zero. This authored travel ratio is an admission heuristic, not a guarantee against collider tunnelling.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The shortest-edge owner supplies a shared direct-square distance estimate; the ratio uses declared reference speed rather than measured peak velocity or collider thickness, and malformed domains are refused separately.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Validation and budget report read one authored travel measure instead of independently choosing a timestep; actual integration owns its trajectory and discrete contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Zero is the documented no-edge result, not proof that a missing lattice is safe; no speed clamp or continuous collision certificate is inferred from a ratio at most one.
 * @evidence contracts/development/common.md#meaningful-documentation States the declared ratio, no-edge sentinel and its discrete-contact limitation.
 * @evidence contracts/development/implementation.md#efficient-algorithms The shortest structural-edge scan dominates at O(P) time for P lattice particles, with constant extra storage.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared shortest-edge arithmetic serves the solver and budget; mutable rest geometry must be rescanned and has no retained minimum cache here.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The ratio is returned by value; domain arrays are read without copying or retaining them.
 */
export const softBodyTravelNumber: (
  domain: IAutoMovieSoftBodyDomain,
) => number = (domain: IAutoMovieSoftBodyDomain): number => {
  const shortest: number = shortestRestLength(domain);
  if (shortest === Infinity) return 0;
  return (
    (domain.solver.fixedStepSeconds * domain.solver.referenceSpeed) / shortest
  );
};
