import type { IAutoMovieRecoveryImageLoft } from "./IAutoMovieRecoveryImageLoft";
import type { IAutoMovieRecoverySupportLoft } from "./IAutoMovieRecoverySupportLoft";

/**
 * Closed saved-coefficient image reconstruction choices.
 * Each discriminator preserves its own inference assumptions and unknown regions;
 * a generic consumer dispatches it without choosing a family from an object name.
 *
 * @evidence contracts/development/design.md#principled-representation Distinct ellipse and finite-support family discriminators preserve representation-specific meaning while both independently generate geometry from coefficients.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One pure union supplies real file/viewer consumers without coupling them to acquisition reports.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No open plugin arm, specimen switch, source mesh or inferred completion replaces an unsupported recipe.
 * @evidence contracts/development/common.md#meaningful-documentation States closed dispatch and preserved family/coverage semantics for saved-coefficient consumers.
 */
export type AutoMovieRecoveryImageRecipe =
  | IAutoMovieRecoveryImageLoft
  | IAutoMovieRecoverySupportLoft;
