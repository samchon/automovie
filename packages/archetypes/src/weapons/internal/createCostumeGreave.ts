import type { AutoMovieArchetypeCostumeGreave } from "../AutoMovieArchetypeCostumeGreave";
import { type AutoMovieArchetype } from "../../core/index";
import { ArmourLimb } from "./ArmourLimb";
import { CostumeConstruction } from "./CostumeConstruction";


/**
 * Worn lower-leg costume.
 *
 * A hollow costume shell registered to a lower-leg segment by the wear frame.
 *
 * @param params The scene id and optional measurements and model choice of this
 *   costume.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createCostumeGreave(
  params: AutoMovieArchetypeCostumeGreave.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeCostumeGreave.Affordance,
  AutoMovieArchetypeCostumeGreave.Dimension
> {
  return CostumeConstruction("greave", params, seed, ArmourLimb);
}
