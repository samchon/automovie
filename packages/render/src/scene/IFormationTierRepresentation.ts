import type { IAutoMovieInstancedModelRepresentation } from "./IAutoMovieInstancedModelRepresentation.js";
import type { createFormationCycleShadowMaterials } from "./createFormationCycleShadowMaterials.js";

/**
 * Owned tier resources shared by all of its anonymous instance chunks.
 * Static tiers allocate no custom shadow materials and use Three's normal path.
 *
 * @evidence contracts/development/design.md#principled-representation Extends one flattened rigid tier with optional custom depth/distance cycle projections; null means a static tier uses the ordinary Three path, while animated shadows must share the tier's cycle deformation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Attaches shadow resources to the same tier owner already holding visible geometry/materials so construction rollback and runtime disposal can enumerate one representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Static omission follows actual cycle absence, not camera/pass fixture identity; animated visible and shadow materials use the same cycle owner.
 * @evidence contracts/development/common.md#meaningful-documentation Documents tier-wide shared ownership and the null static versus custom directional/spot/point projection distinction.
 */
export interface IFormationTierRepresentation extends IAutoMovieInstancedModelRepresentation {
  /**
   * Null for a static tier; otherwise its shared directional/spot and point projections.
   */
  shadows: ReturnType<typeof createFormationCycleShadowMaterials> | null;
}
