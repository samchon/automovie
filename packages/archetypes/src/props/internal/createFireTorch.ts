import type { AutoMovieArchetypeFireTorch } from "../AutoMovieArchetypeFireTorch";
import type { AutoMovieArchetype } from "../../core/index";
import { PracticalLightConstruction } from "./PracticalLightConstruction";


/**
 * A period torch prop with a power grasp and an animated light frame.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createFireTorch(
  params: AutoMovieArchetypeFireTorch.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeFireTorch.Affordance, AutoMovieArchetypeFireTorch.Dimension> {
  return PracticalLightConstruction.wick("fireTorch", params, seed);
}
