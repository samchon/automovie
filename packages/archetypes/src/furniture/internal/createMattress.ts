import type { AutoMovieArchetypeMattress } from "../AutoMovieArchetypeMattress";
import type { AutoMovieArchetype } from "../../core/index";
import { BedConstruction } from "./BedConstruction";


/*
 * A loose mattress set directly on its floor with a lying surface and side
 * contacts.
 * Parameter params: The optional identifier, the admitted settings and any fixed
 * dimensions in the inherited units.
 * Parameter seed: Draws remaining dimensions and any model choice. Omit it for the
 * first model and band midpoints.
 * Returns: The generated model and its named local contacts.
 * For a setting this producer cannot admit.
 */
export function createMattress(
  params: AutoMovieArchetypeMattress.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeMattress.Affordance, AutoMovieArchetypeMattress.Dimension> {
  return BedConstruction.platform("mattress", params, seed);
}
