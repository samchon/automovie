import type { IAutoMovieFormationCycle } from "./IAutoMovieFormationCycle.js";
import type { IAutoMovieInstancedGeometry } from "./IAutoMovieInstancedGeometry.js";

/**
 * Rigid prototype geometry with the cycle baked after its rest-space extraction.
 * An adopted rigid object has a null cycle; a generated model may also return
 * null when no bake was requested or its source supplies no gait or skeleton.
 *
 * @author Samchon
 */
export interface IAutoMovieInstancedModelRepresentation<
  Cycle extends IAutoMovieFormationCycle | null =
    IAutoMovieFormationCycle | null,
> extends IAutoMovieInstancedGeometry {
  /** Baked rigid-part matrix table, or null for the static representation. */
  cycle: Cycle;
}
