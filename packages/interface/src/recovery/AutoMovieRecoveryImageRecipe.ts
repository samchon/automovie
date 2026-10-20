import type { IAutoMovieRecoveryImageLoft } from "./IAutoMovieRecoveryImageLoft";
import type { IAutoMovieRecoverySupportLoft } from "./IAutoMovieRecoverySupportLoft";

/**
 * Closed saved-coefficient image reconstruction choices.
 * Each discriminator preserves its own inference assumptions and unknown regions;
 * a generic consumer dispatches it without choosing a family from an object name.
 *
 * @evidence contracts/common.md#principled-implementation Distinct ellipse and finite-support family discriminators preserve representation-specific meaning while both independently generate geometry from coefficients.
 * @evidence contracts/common.md#clear-and-simple-design One pure union supplies real file/viewer consumers without coupling them to acquisition reports.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No open plugin arm, specimen switch, source mesh or inferred completion replaces an unsupported recipe.
 * @evidence contracts/common.md#meaningful-documentation States closed dispatch and preserved family/coverage semantics for saved-coefficient consumers.
 */
export type AutoMovieRecoveryImageRecipe =
  | IAutoMovieRecoveryImageLoft
  | IAutoMovieRecoverySupportLoft;
