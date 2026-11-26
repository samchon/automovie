import { type AutoMovieArchetype } from "../../core";
import { CartConstruction } from "../CartConstruction";
import { CartDrawn } from "../CartDrawn";
import type { AutoMovieArchetypeChariot } from "../AutoMovieArchetypeChariot";

/**
 * Two-wheeled standing chariot.
 *
 * The pole coupling leads along +Z from the axle. The platform and rail support
 * standing performers.
 *
 * @param params The scene identity and the dimensions and catalogue choices
 *   this carrier admits.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createChariot(
  params: AutoMovieArchetypeChariot.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeChariot.Affordance, AutoMovieArchetypeChariot.Dimension> {
  return CartConstruction("chariot", params, seed, CartDrawn.chariot);
}
