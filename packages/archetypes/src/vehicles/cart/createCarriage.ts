import { type AutoMovieArchetype } from "../../core";
import { CartCoach } from "../internal/CartCoach";
import { CartConstruction } from "../internal/CartConstruction";
import type { AutoMovieArchetypeCarriage } from "../AutoMovieArchetypeCarriage";

/*
 * Enclosed passenger carriage.
 *
 * The front axle steers the forward pole and the doors articulate
 * independently. The interior seat and side apertures serve boarding.
 * Parameter params: The scene identity and the dimensions and catalogue choices
 * this carrier admits.
 * Parameter seed: Uses the original named draw session to resolve omitted settings.
 * Returns: The digital model and its authored contact frames.
 * For inputs the selected catalogue profile
 * cannot use.
 */
export function createCarriage(
  params: AutoMovieArchetypeCarriage.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeCarriage.Affordance, AutoMovieArchetypeCarriage.Dimension> {
  return CartConstruction("carriage", params, seed, CartCoach.carriage);
}
