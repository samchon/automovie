import type { AutoMovieArchetypePendantLamp } from "../AutoMovieArchetypePendantLamp";
import type { AutoMovieArchetype } from "../../core/index";
import { PracticalLightConstruction } from "../PracticalLightConstruction";


/**
 * A hanging pendant lamp with its ceiling hook at the origin.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createPendantLamp(
  params: AutoMovieArchetypePendantLamp.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypePendantLamp.Affordance,
  AutoMovieArchetypePendantLamp.Dimension
> {
  return PracticalLightConstruction.pendant(params, seed);
}
