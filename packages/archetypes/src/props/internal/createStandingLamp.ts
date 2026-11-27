import { AutoMovieArchetypeStandingLamp } from "../AutoMovieArchetypeStandingLamp";
import {
  type AutoMovieArchetype,
} from "../../core/index";
import {
  ArchetypeDraw,
} from "../../core/internal/ArchetypeDraw";
import { PracticalLightConstruction } from "./PracticalLightConstruction";


/*
 * A freestanding table or floor lamp with a positioned light binding.
 * Parameter params: The optional identifier, the admitted settings and any fixed
 * dimensions in the inherited units.
 * Parameter seed: Draws remaining dimensions and any model choice. Omit it for the
 * first model and band midpoints.
 * Returns: The generated model and its named local contacts.
 * For a setting this producer cannot admit.
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
