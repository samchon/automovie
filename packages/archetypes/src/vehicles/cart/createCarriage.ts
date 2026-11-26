import { type AutoMovieArchetype } from "../../core";
import { CartCoach } from "../CartCoach";
import { CartConstruction } from "../CartConstruction";
import type { AutoMovieArchetypeCarriage } from "../AutoMovieArchetypeCarriage";

/**
 * Enclosed passenger carriage.
 *
 * The front axle steers the forward pole and the doors articulate
 * independently. The interior seat and side apertures serve boarding.
 *
 * @param params The scene identity and the dimensions and catalogue choices
 *   this carrier admits.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createCarriageImpl(
  params: AutoMovieArchetypeCarriage.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeCarriage.Affordance, AutoMovieArchetypeCarriage.Dimension> {
  return CartConstruction("carriage", params, seed, CartCoach.carriage);
}
