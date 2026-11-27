import { AutoMovieArchetypeCostumeHelmet } from "../AutoMovieArchetypeCostumeHelmet";
import { ArchetypeDraw, type AutoMovieArchetype } from "../../core/index";
import { ArmourHelmet } from "./ArmourHelmet";
import { CostumeConstruction } from "./CostumeConstruction";


/**
 * Worn helmet costume.
 *
 * The piece keeps its existing open, closed or brimmed helmet cavity and is
 * fixed at its wear frame on the head.
 *
 * @param params The scene id and optional measurements and model choice of this
 *   costume.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createCostumeHelmet(
  params: AutoMovieArchetypeCostumeHelmet.IParams,
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeCostumeHelmet.Affordance,
  AutoMovieArchetypeCostumeHelmet.Dimension
> {
  const kind: AutoMovieArchetypeCostumeHelmet.Kind = ArchetypeDraw.choice(
    "armour",
    "kind",
    params.kind,
    AutoMovieArchetypeCostumeHelmet.KINDS,
  );
  return CostumeConstruction(kind, params, seed, ArmourHelmet);
}
