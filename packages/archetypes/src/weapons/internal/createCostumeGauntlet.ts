import type { AutoMovieArchetypeCostumeGauntlet } from "../AutoMovieArchetypeCostumeGauntlet";
import { type AutoMovieArchetype } from "../../core/index";
import { ArmourLimb } from "./ArmourLimb";
import { CostumeConstruction } from "./CostumeConstruction";


/**
 * Worn gauntlet costume.
 *
 * A segmented costume piece registered to the chosen hand through its wear
 * frame.
 *
 * @param params The scene id and optional measurements and model choice of this
 *   costume.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createCostumeGauntlet(
  params: AutoMovieArchetypeCostumeGauntlet.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeCostumeGauntlet.Affordance,
  AutoMovieArchetypeCostumeGauntlet.Dimension
> {
  return CostumeConstruction("gauntlet", params, seed, ArmourLimb);
}
