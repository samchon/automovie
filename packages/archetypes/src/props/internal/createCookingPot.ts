import { AutoMovieArchetypeCookingPot } from "../AutoMovieArchetypeCookingPot";
import {
  type AutoMovieArchetype,
} from "../../core/index";
import {
  ArchetypeDraw,
} from "../../core/internal/ArchetypeDraw";
import { VesselConstruction } from "./VesselConstruction";


/*
 * A saucepan with a long handle or a stockpot with paired side handles.
 * Parameter params: The optional identifier, the admitted settings and any fixed
 * dimensions in the inherited units.
 * Parameter seed: Draws remaining dimensions and any model choice. Omit it for the
 * first model and band midpoints.
 * Returns: The generated model and its named local contacts.
 * For a setting this producer cannot admit.
 */
export function createCookingPot(
  params: AutoMovieArchetypeCookingPot.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeCookingPot.Affordance, AutoMovieArchetypeCookingPot.Dimension> {
  return VesselConstruction.cookingPot(
    ArchetypeDraw.choice("vessel", "kind", params.kind, AutoMovieArchetypeCookingPot.KINDS),
    params,
    seed,
  );
}
