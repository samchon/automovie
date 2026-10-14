import type { IAutoMovieInstancedModelRepresentation } from "./IAutoMovieInstancedModelRepresentation.js";
import type { createFormationCycleShadowMaterials } from "./createFormationCycleShadowMaterials.js";

/**
 * Owned tier resources shared by all of its anonymous instance chunks.
 * Static tiers allocate no custom shadow materials and use Three's normal path.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Extends one flattened rigid tier with optional custom depth/distance cycle projections; null means a static tier uses the ordinary Three path, while animated shadows must share the tier's cycle deformation.
 * @evidence contracts/common.md#clear-and-simple-design Attaches shadow resources to the same tier owner already holding visible geometry/materials so construction rollback and runtime disposal can enumerate one representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Static omission follows actual cycle absence, not camera/pass fixture identity; animated visible and shadow materials use the same cycle owner.
 * @evidence contracts/common.md#meaningful-documentation Documents tier-wide shared ownership and the null static versus custom directional/spot/point projection distinction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This representation shape executes no bake, shader compile or retirement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Tier construction and binding own sharing across anonymous chunks; the record coordinates no repeated effect itself.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Actual visible/shadow resource acquisition and release are owned by create/disposeFormationRepresentations, not this interface declaration.
 */
export interface IFormationTierRepresentation
  extends IAutoMovieInstancedModelRepresentation {
  /**
   * Null for a static tier; otherwise its shared directional/spot and point projections.
   */
  shadows: ReturnType<typeof createFormationCycleShadowMaterials> | null;
}
