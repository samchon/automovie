import type { IAutoMovieSoftBodyDomain } from "@automovie/interface";
import { shortestRestLength } from "./shortestRestLength";

/**
 * The travel number of the panel: `dt · referenceSpeed / shortestRestLength`.
 *
 * At most `1` for a projection that cannot tunnel. It is the single number that
 * says whether the authored step, lattice spacing and design speed can be
 * integrated at all, which is why the validator reads it instead of guessing a
 * step on the author's behalf. A lattice with no constraint at all — a single
 * particle — has nothing to cross and returns `0`.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-fidelity-boundary Measures whether the declared step can honor the bounded no-tunneling tier.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-failure-and-fidelity-boundary Supplies the numeric condition used to refuse unsupported soft motion.
 * @author Samchon
 */
export const softBodyTravelNumber = (
  domain: IAutoMovieSoftBodyDomain,
): number => {
  const shortest = shortestRestLength(domain);
  if (shortest === Infinity) return 0;
  return (
    (domain.solver.fixedStepSeconds * domain.solver.referenceSpeed) / shortest
  );
};
