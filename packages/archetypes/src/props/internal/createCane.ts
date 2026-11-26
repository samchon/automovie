import type { AutoMovieArchetypeCane } from "../AutoMovieArchetypeCane";
import type { AutoMovieArchetype } from "../../core/index";
import { MobilityAidConstruction } from "../MobilityAidConstruction";


/**
 * An offset walking cane with a handle over its shaft and a downward floor tip.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createCane(
  params: AutoMovieArchetypeCane.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeCane.Affordance, AutoMovieArchetypeCane.Dimension> {
  return MobilityAidConstruction.cane(params, seed);
}
