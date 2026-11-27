import { AutoMovieArchetypeCostumeHelmet } from "../AutoMovieArchetypeCostumeHelmet";
import {
  type AutoMovieArchetype,
} from "../../core/index";
import {
  ArchetypeDraw,
} from "../../core/internal/ArchetypeDraw";
import { ArmourHelmet } from "./ArmourHelmet";
import { CostumeConstruction } from "./CostumeConstruction";


/*
 * Worn helmet costume.
 *
 * The piece keeps its existing open, closed or brimmed helmet cavity and is
 * fixed at its wear frame on the head.
 * Parameter params: The scene id and optional measurements and model choice of this
 * costume.
 * Parameter seed: Uses the original named draw session to resolve omitted settings.
 * Returns: The digital model and its authored contact frames.
 * For inputs the selected catalogue profile
 * cannot use.
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
