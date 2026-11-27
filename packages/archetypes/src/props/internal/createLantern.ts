import type { AutoMovieArchetypeLantern } from "../AutoMovieArchetypeLantern";
import type { AutoMovieArchetype } from "../../core/index";
import { PracticalLightConstruction } from "./PracticalLightConstruction";


/**
 * A standing or hung lantern with a raised bail and a burner light binding.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createLantern(
  params: AutoMovieArchetypeLantern.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeLantern.Affordance, AutoMovieArchetypeLantern.Dimension> {
  return PracticalLightConstruction.lantern(params, seed);
}
