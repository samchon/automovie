import type { AutoMovieArchetypeAshtray } from "../AutoMovieArchetypeAshtray";
import type { AutoMovieArchetype } from "../../core/index";
import { VesselConstruction } from "../VesselConstruction";


/**
 * An ashtray with an inside floor and a precision grip from beneath.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createAshtray(
  params: AutoMovieArchetypeAshtray.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeAshtray.Affordance, AutoMovieArchetypeAshtray.Dimension> {
  return VesselConstruction.ashtray(params, seed);
}
