import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBrows } from "../../structures/IAutoMovieHumanFaceBrows";
import { HUMAN_FACE_BROW_POPULATION } from "./HUMAN_FACE_BROW_POPULATION";

/**
 * Resolve whole-section omission against registered source implantation bands.
 * An explicit sparse section is copied without adding sides or changing supplied
 * dimensions. Only whole omission selects the population owner's conventional
 * default; no clinical reconstruction is inferred from the registration.
 */
export function resolveHumanFaceBrows(
  basis: IAutoMovieHumanFaceBasis,
  input: IAutoMovieHumanFaceBrows | undefined,
): IAutoMovieHumanFaceBrows {
  if (input !== undefined) return structuredClone(input);
  const result: IAutoMovieHumanFaceBrows = {};
  for (const side of ["left", "right"] as const)
    if (basis.periocular?.[side].browBand !== undefined)
      result[side] = structuredClone(HUMAN_FACE_BROW_POPULATION);
  return result;
}
