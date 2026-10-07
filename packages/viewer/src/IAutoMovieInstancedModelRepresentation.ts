import type { IAutoMovieFormationCycle } from "./IAutoMovieFormationCycle";
import type { IAutoMovieInstancedGeometry } from "./IAutoMovieInstancedGeometry";

/**
 * Rigid prototype geometry with the cycle baked after its rest-space extraction.
 * An adopted rigid object has a null cycle; a generated model may also return
 * null when no bake was requested or its source supplies no gait or skeleton.
 *
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Keeps the prototype's geometry and available animated representation together.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Preserves the generated-versus-adopted cycle alternative without duplicating representation structure.
 * @author Samchon
 */
export interface IAutoMovieInstancedModelRepresentation<Cycle extends IAutoMovieFormationCycle | null = IAutoMovieFormationCycle | null> extends IAutoMovieInstancedGeometry {
  /**
   * Baked rigid-part matrix table, or null for the static representation.
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Supplies only the cycle actually available to the selected tier.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Retains null as a static alternative rather than inventing motion for an adopted prototype.
   */
  cycle: Cycle;
}
