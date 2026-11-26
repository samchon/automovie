import type { AutoMovieArchetypeBunkBed } from "../AutoMovieArchetypeBunkBed";
import type { AutoMovieArchetype } from "../../core/index";
import { BedConstruction } from "../BedConstruction";


/**
 * A stacked pair of beds with lower side seats, an upper sleep surface and a
 * guard bar.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createBunkBed(
  params: AutoMovieArchetypeBunkBed.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeBunkBed.Affordance, AutoMovieArchetypeBunkBed.Dimension> {
  return BedConstruction.bunk(params, seed);
}
