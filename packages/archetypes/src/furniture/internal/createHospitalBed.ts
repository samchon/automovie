import type { AutoMovieArchetypeHospitalBed } from "../AutoMovieArchetypeHospitalBed";
import type { AutoMovieArchetype } from "../../core/index";
import { BedConstruction } from "./BedConstruction";


/*
 * A hospital bed with a caster base, patient support and bars along both sides.
 * Parameter params: The optional identifier, the admitted settings and any fixed
 * dimensions in the inherited units.
 * Parameter seed: Draws remaining dimensions and any model choice. Omit it for the
 * first model and band midpoints.
 * Returns: The generated model and its named local contacts.
 * For a setting this producer cannot admit.
 */
export function createHospitalBed(
  params: AutoMovieArchetypeHospitalBed.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeHospitalBed.Affordance,
  AutoMovieArchetypeHospitalBed.Dimension
> {
  return BedConstruction.hospital(params, seed);
}
