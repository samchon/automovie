import { AutoMovieArchetypeCookingPot } from "../AutoMovieArchetypeCookingPot";
import { ArchetypeDraw, type AutoMovieArchetype } from "../../core/index";
import { VesselConstruction } from "../VesselConstruction";


/**
 * A saucepan with a long handle or a stockpot with paired side handles.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
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
