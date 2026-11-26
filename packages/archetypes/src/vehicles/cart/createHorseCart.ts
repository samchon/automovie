import { type AutoMovieArchetype } from "../../core";
import { CartConstruction } from "../CartConstruction";
import { CartDrawn } from "../CartDrawn";
import { CartFit } from "../CartFit";
import type { AutoMovieArchetypeHorseCart } from "../AutoMovieArchetypeHorseCart";

/**
 * Horse-drawn two-wheeled cart.
 *
 * The axle crosses X at the origin. The coupling is ahead along +Z. The seat,
 * footboard and driving-line contacts move with the cart.
 *
 * @param params The scene identity and the dimensions and catalogue choices
 *   this carrier admits.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createHorseCartImpl(
  params: AutoMovieArchetypeHorseCart.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeHorseCart.Affordance, AutoMovieArchetypeHorseCart.Dimension> {
  return CartConstruction(
    "cart",
    params,
    seed,
    CartDrawn.cart,
    CartFit.harness,
  );
}
