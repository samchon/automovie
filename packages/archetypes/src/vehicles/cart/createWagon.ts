import { type AutoMovieArchetype } from "../../core";
import { CartCoach } from "../internal/CartCoach";
import { CartConstruction } from "../internal/CartConstruction";
import type { AutoMovieArchetypeWagon } from "../AutoMovieArchetypeWagon";

/*
 * Four-wheeled wagon.
 *
 * The rear axle crosses X at the origin. The front axle steers the pole and the
 * bed supports freight.
 * Parameter params: The scene identity and the dimensions and catalogue choices
 * this carrier admits.
 * Parameter seed: Uses the original named draw session to resolve omitted settings.
 * Returns: The digital model and its authored contact frames.
 * For inputs the selected catalogue profile
 * cannot use.
 */
export function createWagon(
  params: AutoMovieArchetypeWagon.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeWagon.Affordance, AutoMovieArchetypeWagon.Dimension> {
  return CartConstruction("wagon", params, seed, CartCoach.wagon);
}
