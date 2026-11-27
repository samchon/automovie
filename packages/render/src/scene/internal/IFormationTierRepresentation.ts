import type { IAutoMovieInstancedModelRepresentation } from "../IAutoMovieInstancedModelRepresentation";
import type { AutoMovieRenderFormationCycle } from "../AutoMovieRenderFormationCycle";

/*
 * Owned tier resources shared by all of its anonymous instance chunks. Static
 * tiers allocate no custom shadow materials and use Three's normal path.
 */
export interface IFormationTierRepresentation extends IAutoMovieInstancedModelRepresentation {
  /*
   * Null for a static tier; otherwise its shared directional/spot and point
   * projections.
   */
  shadows: AutoMovieRenderFormationCycle.IShadowMaterials | null;
}
