import type { IAutoMovieInstancedModelRepresentation } from "./IAutoMovieInstancedModelRepresentation.js";
import type { createFormationCycleShadowMaterials } from "./createFormationCycleShadowMaterials.js";

/**
 * Owned tier resources shared by all of its anonymous instance chunks.
 * Static tiers allocate no custom shadow materials and use Three's normal path.
 *
 * @author Samchon
 */
export interface IFormationTierRepresentation
  extends IAutoMovieInstancedModelRepresentation {
  /**
   * Null for a static tier; otherwise its shared directional/spot and point projections.
   */
  shadows: ReturnType<typeof createFormationCycleShadowMaterials> | null;
}
