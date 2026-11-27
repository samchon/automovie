import type { AutoMovieArchetypeInfusionStand } from "../AutoMovieArchetypeInfusionStand";
import type { AutoMovieArchetype } from "../../core/index";
import { MobilityAidConstruction } from "./MobilityAidConstruction";


/*
 * A mobile infusion stand with a tube grip and a top bag hook.
 * Parameter params: The optional identifier, the admitted settings and any fixed
 * dimensions in the inherited units.
 * Parameter seed: Draws remaining dimensions and any model choice. Omit it for the
 * first model and band midpoints.
 * Returns: The generated model and its named local contacts.
 * For a setting this producer cannot admit.
 */
export function createInfusionStand(
  params: AutoMovieArchetypeInfusionStand.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeInfusionStand.Affordance,
  AutoMovieArchetypeInfusionStand.Dimension
> {
  return MobilityAidConstruction.infusionStand(params, seed);
}
