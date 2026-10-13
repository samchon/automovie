import type { IAutoMovieInstancedModelRepresentation } from "./IAutoMovieInstancedModelRepresentation.js";
import type { createFormationCycleShadowMaterials } from "./createFormationCycleShadowMaterials.js";

/**
 * Owned tier resources shared by all of its anonymous instance chunks.
 * Static tiers allocate no custom shadow materials and use Three's normal path.
 *
 * @evidence requirements/lighting/shadows-reflections-and-transmission.md#lighting-shadow-time-sampling Keeps the deformed caster's beauty and shadow resources under one cycle owner.
 * @evidence specifications/camera-light-and-visibility/light-transport-color-and-budget.md#clv-shadow-state-sampling Records the shadow projections belonging to that tier's resolved geometry.
 * @author Samchon
 */
export interface IFormationTierRepresentation
  extends IAutoMovieInstancedModelRepresentation {
  /**
   * Null for a static tier; otherwise its shared directional/spot and point projections.
   *
   * @evidence requirements/lighting/shadows-reflections-and-transmission.md#lighting-shadow-time-sampling Identifies the projections consuming this tier's actual cycle.
   * @evidence specifications/camera-light-and-visibility/light-transport-color-and-budget.md#clv-shadow-state-sampling Keeps static default dispatch distinct from animated custom dispatch.
   */
  shadows: ReturnType<typeof createFormationCycleShadowMaterials> | null;
}
