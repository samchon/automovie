import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBrows } from "../../structures/IAutoMovieHumanFaceBrows";
import { HUMAN_FACE_BROW_POPULATION } from "./HUMAN_FACE_BROW_POPULATION";

/**
 * Resolve whole-section omission against registered source implantation bands.
 * An explicit sparse section is copied without adding sides or changing supplied
 * dimensions. Only whole omission selects the population owner's conventional
 * default; no clinical reconstruction is inferred from the registration.
 *
 * @evidence contracts/common.md#principled-implementation Whole omission and explicit sparse selection retain distinct meanings; each registered side receives an owned copy of the sole canonical default.
 * @evidence contracts/common.md#clear-and-simple-design One adapter resolves default selection without copying population values.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Explicit counts and radii remain unchanged, including legacy numerical documents.
 * @evidence contracts/common.md#meaningful-documentation States omission, copying and the clinical limitation.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The assembly owns the brow parts.
 * @evidence contracts/modeling.md#parameter-channels Left and right default independently only when a source band exists; explicit omission of a side remains omission.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The shaft builder emits geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Values retain the population owner's units without conversion.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The source band and shaft assembly own the skin attachment.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembly and connected builder observe brows.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The canonical population declares its measured and conventional grounds.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing shaft admission owns limits.
 * @evidence contracts/anatomy.md#parametric-authority This adapter selects named numerical populations without authored vertices or curves.
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
