import type { AutoMovieArchetypeAshtray } from "../AutoMovieArchetypeAshtray";
import type { AutoMovieArchetype } from "../../core/index";
import { VesselConstruction } from "./VesselConstruction";


/*
 * An ashtray with an inside floor and a precision grip from beneath.
 * Parameter params: The optional identifier, the admitted settings and any fixed
 * dimensions in the inherited units.
 * Parameter seed: Draws remaining dimensions and any model choice. Omit it for the
 * first model and band midpoints.
 * Returns: The generated model and its named local contacts.
 * For a setting this producer cannot admit.
 */
export function createAshtray(
  params: AutoMovieArchetypeAshtray.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeAshtray.Affordance, AutoMovieArchetypeAshtray.Dimension> {
  return VesselConstruction.ashtray(params, seed);
}
