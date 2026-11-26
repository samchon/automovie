import type { AutoMovieArchetypeCrib } from "../AutoMovieArchetypeCrib";
import type { AutoMovieArchetype } from "../../core/index";
import { BedConstruction } from "../BedConstruction";


/**
 * A crib with a surrounding slat frame and grasp bars on both sides.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createCrib(
  params: AutoMovieArchetypeCrib.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeCrib.Affordance, AutoMovieArchetypeCrib.Dimension> {
  return BedConstruction.crib(params, seed);
}
