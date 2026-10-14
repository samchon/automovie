import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBrows } from "../../structures/IAutoMovieHumanFaceBrows";
import { HUMAN_FACE_BROW_POPULATION } from "./HUMAN_FACE_BROW_POPULATION";

/**
 * Resolve whole-section omission against registered source implantation bands.
 * An explicit sparse section is copied without adding sides or changing supplied
 * dimensions. Only whole omission selects the population owner's conventional
 * default; no clinical reconstruction is inferred from the registration.
 *
 * @evidence contracts/common.md#principled-implementation Only whole-section omission selects the conventional source population on sides with actual registered implantation bands.
 * @evidence contracts/common.md#clear-and-simple-design An explicit sparse section is independently cloned; omission creates a fresh result by inspecting the two source sides.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing sides are not filled into supplied input and registration does not imply clinical reconstruction of brow count or dimensions.
 * @evidence contracts/common.md#meaningful-documentation The prose documents whole omission, sparse-input preservation, owned copies and authored defaults.
 * @evidence contracts/performance.md#efficient-algorithms Omitted input checks exactly two sides; supplied input is cloned in proportion to its actual profile data.
 * @evidence contracts/performance.md#reuse-equivalent-work The conventional HUMAN_FACE_BROW_POPULATION record is shared only as immutable source, while each returned side owns its clone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned section; no basis, profile cache, live geometry or task is retained globally.
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
