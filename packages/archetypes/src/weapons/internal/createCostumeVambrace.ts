import type { AutoMovieArchetypeCostumeVambrace } from "../AutoMovieArchetypeCostumeVambrace";
import { type AutoMovieArchetype } from "../../core/index";
import { ArmourLimb } from "./ArmourLimb";
import { CostumeConstruction } from "./CostumeConstruction";


/*
 * Worn forearm costume.
 *
 * A hollow costume shell registered to a lower-arm segment by the wear frame.
 * Parameter params: The scene id and optional measurements and model choice of this
 * costume.
 * Parameter seed: Uses the original named draw session to resolve omitted settings.
 * Returns: The digital model and its authored contact frames.
 * For inputs the selected catalogue profile
 * cannot use.
 */
export function createCostumeVambrace(
  params: AutoMovieArchetypeCostumeVambrace.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeCostumeVambrace.Affordance,
  AutoMovieArchetypeCostumeVambrace.Dimension
> {
  return CostumeConstruction("vambrace", params, seed, ArmourLimb);
}
