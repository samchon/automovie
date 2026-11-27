import type { AutoMovieArchetypeWalker } from "../AutoMovieArchetypeWalker";
import type { AutoMovieArchetype } from "../../core/index";
import { MobilityAidConstruction } from "./MobilityAidConstruction";


/**
 * A four-legged walking frame with a paired hand-grip and a central floor
 * reference.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createWalker(
  params: AutoMovieArchetypeWalker.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeWalker.Affordance, AutoMovieArchetypeWalker.Dimension> {
  return MobilityAidConstruction.walker(params, seed);
}
