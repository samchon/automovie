import { type AutoMovieArchetype } from "../../core";
import { CartCoach } from "../CartCoach";
import { CartConstruction } from "../CartConstruction";
import type { AutoMovieArchetypeWagon } from "../AutoMovieArchetypeWagon";

/**
 * Four-wheeled wagon.
 *
 * The rear axle crosses X at the origin. The front axle steers the pole and the
 * bed supports freight.
 *
 * @param params The scene identity and the dimensions and catalogue choices
 *   this carrier admits.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createWagon(
  params: AutoMovieArchetypeWagon.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeWagon.Affordance, AutoMovieArchetypeWagon.Dimension> {
  return CartConstruction("wagon", params, seed, CartCoach.wagon);
}
