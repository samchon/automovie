import type { IAutoMovieRenderFormationCycle } from "./IAutoMovieRenderFormationCycle";
import type { IAutoMovieInstancedGeometry } from "./IAutoMovieInstancedGeometry";

/**
 * Rigid prototype geometry with the cycle baked after its rest-space
 * extraction. An adopted rigid object has a null cycle; a generated model may
 * also return null when no bake was requested or its source supplies no gait or
 * skeleton.
 */
export interface IAutoMovieInstancedModelRepresentation<
  Cycle extends IAutoMovieRenderFormationCycle | null =
    IAutoMovieRenderFormationCycle | null,
> extends IAutoMovieInstancedGeometry {
  /** Baked rigid-part matrix table, or null for the static representation. */
  cycle: Cycle;
}
