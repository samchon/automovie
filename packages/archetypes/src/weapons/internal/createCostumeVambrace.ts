import type { AutoMovieArchetypeCostumeVambrace } from "../AutoMovieArchetypeCostumeVambrace";
import { type AutoMovieArchetype } from "../../core/index";
import { ArmourLimb } from "./ArmourLimb";
import { CostumeConstruction } from "./CostumeConstruction";


/**
 * Worn forearm costume.
 *
 * A hollow costume shell registered to a lower-arm segment by the wear frame.
 *
 * @param params The scene id and optional measurements and model choice of this
 *   costume.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
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
