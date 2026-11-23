import type { IAutoMovieRecoveryImageLoft } from "./IAutoMovieRecoveryImageLoft";
import type { IAutoMovieRecoverySupportLoft } from "./IAutoMovieRecoverySupportLoft";

/**
 * Closed saved-coefficient image reconstruction choices. Each discriminator
 * preserves its own inference assumptions and unknown regions; a generic
 * consumer dispatches it without choosing a family from an object name.
 */
export type IAutoMovieRecoveryImageRecipe =
  | IAutoMovieRecoveryImageLoft
  | IAutoMovieRecoverySupportLoft;
