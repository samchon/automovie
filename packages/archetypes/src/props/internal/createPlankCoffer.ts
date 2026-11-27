import type { AutoMovieArchetypePlankCoffer } from "../AutoMovieArchetypePlankCoffer";
import type { AutoMovieArchetype } from "../../core/index";
import { ScenicContainerConstruction } from "./ScenicContainerConstruction";


/*
 * A closed plank coffer with a rectangular top suitable for stacking.
 * Parameter params: The optional identifier, the admitted settings and any fixed
 * dimensions in the inherited units.
 * Parameter seed: Draws remaining dimensions and any model choice. Omit it for the
 * first model and band midpoints.
 * Returns: The generated model and its named local contacts.
 * For a setting this producer cannot admit.
 */
export function createPlankCoffer(
  params: AutoMovieArchetypePlankCoffer.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypePlankCoffer.Affordance,
  AutoMovieArchetypePlankCoffer.Dimension
> {
  return ScenicContainerConstruction.closedCoffer(params, seed);
}
