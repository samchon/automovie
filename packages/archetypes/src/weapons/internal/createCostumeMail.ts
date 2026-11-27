import type { AutoMovieArchetypeCostumeMail } from "../AutoMovieArchetypeCostumeMail";
import { type AutoMovieArchetype } from "../../core/index";
import { ArmourTorso } from "./ArmourTorso";
import { CostumeConstruction } from "./CostumeConstruction";


/*
 * Worn mail costume.
 *
 * A torso-mounted costume shirt with a cavity, sleeve openings and existing
 * wear frame.
 * Parameter params: The scene id and optional measurements and model choice of this
 * costume.
 * Parameter seed: Uses the original named draw session to resolve omitted settings.
 * Returns: The digital model and its authored contact frames.
 * For inputs the selected catalogue profile
 * cannot use.
 */
export function createCostumeMail(
  params: AutoMovieArchetypeCostumeMail.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeCostumeMail.Affordance,
  AutoMovieArchetypeCostumeMail.Dimension
> {
  return CostumeConstruction("mail", params, seed, ArmourTorso);
}
