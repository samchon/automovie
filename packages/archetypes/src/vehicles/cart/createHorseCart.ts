import { type AutoMovieArchetype } from "../../core";
import { CartConstruction } from "../internal/CartConstruction";
import { CartDrawn } from "../internal/CartDrawn";
import { CartFit } from "../internal/CartFit";
import type { AutoMovieArchetypeHorseCart } from "../AutoMovieArchetypeHorseCart";

/*
 * Horse-drawn two-wheeled cart.
 *
 * The axle crosses X at the origin. The coupling is ahead along +Z. The seat,
 * footboard and driving-line contacts move with the cart.
 * Parameter params: The scene identity and the dimensions and catalogue choices
 * this carrier admits.
 * Parameter seed: Uses the original named draw session to resolve omitted settings.
 * Returns: The digital model and its authored contact frames.
 * For inputs the selected catalogue profile
 * cannot use.
 */
export function createHorseCart(
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
