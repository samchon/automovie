import type { AutoMovieArchetypeBunkBed } from "../AutoMovieArchetypeBunkBed";
import type { AutoMovieArchetype } from "../../core/index";
import { BedConstruction } from "./BedConstruction";


/*
 * A stacked pair of beds with lower side seats, an upper sleep surface and a
 * guard bar.
 * Parameter params: The optional identifier, the admitted settings and any fixed
 * dimensions in the inherited units.
 * Parameter seed: Draws remaining dimensions and any model choice. Omit it for the
 * first model and band midpoints.
 * Returns: The generated model and its named local contacts.
 * For a setting this producer cannot admit.
 */
export function createBunkBed(
  params: AutoMovieArchetypeBunkBed.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeBunkBed.Affordance, AutoMovieArchetypeBunkBed.Dimension> {
  return BedConstruction.bunk(params, seed);
}
