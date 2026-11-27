import type { AutoMovieArchetypeCostumeCuirass } from "../AutoMovieArchetypeCostumeCuirass";
import { type AutoMovieArchetype } from "../../core/index";
import { ArmourTorso } from "./ArmourTorso";
import { CostumeConstruction } from "./CostumeConstruction";


/*
 * Worn cuirass costume.
 *
 * A chest-mounted display shell with a body-fit cavity and a distinct wear
 * frame.
 * Parameter params: The scene id and optional measurements and model choice of this
 * costume.
 * Parameter seed: Uses the original named draw session to resolve omitted settings.
 * Returns: The digital model and its authored contact frames.
 * For inputs the selected catalogue profile
 * cannot use.
 */
export function createCostumeCuirass(
  params: AutoMovieArchetypeCostumeCuirass.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeCostumeCuirass.Affordance,
  AutoMovieArchetypeCostumeCuirass.Dimension
> {
  return CostumeConstruction("cuirass", params, seed, ArmourTorso);
}
