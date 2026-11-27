import type { AutoMovieArchetypeGurney } from "../AutoMovieArchetypeGurney";
import type { AutoMovieArchetype } from "../../core/index";
import { BedConstruction } from "./BedConstruction";


/**
 * A caster stretcher with a patient surface and opposed side seats.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createGurney(
  params: AutoMovieArchetypeGurney.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeGurney.Affordance, AutoMovieArchetypeGurney.Dimension> {
  return BedConstruction.gurney(params, seed);
}
