import type { AutoMovieArchetypeCarryBasket } from "../AutoMovieArchetypeCarryBasket";
import type { AutoMovieArchetype } from "../../core/index";
import { TrayConstruction } from "./TrayConstruction";


/*
 * A carry basket with an open floor and a raised bar grip.
 * Parameter params: The optional identifier, the admitted settings and any fixed
 * dimensions in the inherited units.
 * Parameter seed: Draws remaining dimensions and any model choice. Omit it for the
 * first model and band midpoints.
 * Returns: The generated model and its named local contacts.
 * For a setting this producer cannot admit.
 */
export function createCarryBasket(
  params: AutoMovieArchetypeCarryBasket.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeCarryBasket.Affordance,
  AutoMovieArchetypeCarryBasket.Dimension
> {
  return TrayConstruction.basket(params, seed);
}
