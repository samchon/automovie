import { AutoMovieArchetypeStandingLamp } from "../AutoMovieArchetypeStandingLamp";
import { ArchetypeDraw, type AutoMovieArchetype } from "../../core/index";
import { PracticalLightConstruction } from "../PracticalLightConstruction";


/**
 * A freestanding table or floor lamp with a positioned light binding.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createStandingLamp(
  params: AutoMovieArchetypeStandingLamp.IParams,
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeStandingLamp.Affordance,
  AutoMovieArchetypeStandingLamp.Dimension
> {
  return PracticalLightConstruction.standing(
    ArchetypeDraw.choice(
      "light",
      "kind",
      params.kind,
      AutoMovieArchetypeStandingLamp.KINDS,
    ),
    params,
    seed,
  );
}
