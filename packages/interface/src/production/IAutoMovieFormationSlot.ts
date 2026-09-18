import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One deterministic formation member materialized from compact design.
 *
 * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `IAutoMovieFormationSlot` as the portable data boundary for the formation slot identity requirement.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `IAutoMovieFormationSlot` for the performance formation layout slot assignment system contract.
 */
export interface IAutoMovieFormationSlot {
  /**
   * Zero-based deterministic slot index.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `slot` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `slot` for the performance formation layout slot assignment system contract.
   */
  slot: number;
  /**
   * Compiler-owned scene-node id.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `node` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `node` for the performance formation layout slot assignment system contract.
   */
  node: string;
  /**
   * Named hero actor at this slot, or null.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `actor` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `actor` for the performance formation layout slot assignment system contract.
   */
  actor: string | null;
  /**
   * Runtime model recipe id.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `modelRecipe` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `modelRecipe` for the performance formation layout slot assignment system contract.
   */
  modelRecipe: string;
  /**
   * Compiler-derived world position in meters.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `position` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `position` for the performance formation layout slot assignment system contract.
   */
  position: IAutoMovieVector3;
  /**
   * Compiler-derived world-space heading in degrees.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `facingDeg` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `facingDeg` for the performance formation layout slot assignment system contract.
   */
  facingDeg: number;
  /**
   * Stable normalized phase used by bounded instance motion.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `motionPhase` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `motionPhase` for the performance formation layout slot assignment system contract.
   */
  motionPhase: number;
}
