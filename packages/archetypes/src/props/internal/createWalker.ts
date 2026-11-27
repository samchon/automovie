import type { AutoMovieArchetypeWalker } from "../AutoMovieArchetypeWalker";
import type { AutoMovieArchetype } from "../../core/index";
import { MobilityAidConstruction } from "./MobilityAidConstruction";


/*
 * A four-legged walking frame with a paired hand-grip and a central floor
 * reference.
 * Parameter params: The optional identifier, the admitted settings and any fixed
 * dimensions in the inherited units.
 * Parameter seed: Draws remaining dimensions and any model choice. Omit it for the
 * first model and band midpoints.
 * Returns: The generated model and its named local contacts.
 * For a setting this producer cannot admit.
 */
export function createWalker(
  params: AutoMovieArchetypeWalker.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeWalker.Affordance, AutoMovieArchetypeWalker.Dimension> {
  return MobilityAidConstruction.walker(params, seed);
}
