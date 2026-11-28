import type { IAutoMovieRecoveryImageLoft } from "./IAutoMovieRecoveryImageLoft";
import type { IAutoMovieRecoverySupportLoft } from "./IAutoMovieRecoverySupportLoft";

/**
 * Saved image reconstruction coefficients for one of the two supported section
 * families. Use the `family` tag to select the matching compilation operation
 * and its budget.
 */
export type IAutoMovieRecoveryImageRecipe =
  | IAutoMovieRecoveryImageLoft
  | IAutoMovieRecoverySupportLoft;
