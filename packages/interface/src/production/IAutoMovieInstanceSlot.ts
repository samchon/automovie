import { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One exactly regenerated member of a non-formation instance set.
 *
 * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `IAutoMovieInstanceSlot` as the portable data boundary for the formation slot identity requirement.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `IAutoMovieInstanceSlot` for the performance formation layout slot assignment system contract.
 */
export interface IAutoMovieInstanceSlot {
  /**
   * Zero-based deterministic slot index.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `slot` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `slot` for the performance formation layout slot assignment system contract.
   */
  slot: number;

  /**
   * Compiler-owned stable instance id.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `node` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `node` for the performance formation layout slot assignment system contract.
   */
  node: string;

  /**
   * Runtime model recipe id.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `modelRecipe` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `modelRecipe` for the performance formation layout slot assignment system contract.
   */
  modelRecipe: string;

  /**
   * Selected prototype id; omitted for a legacy single-prototype set.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `prototype` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `prototype` for the performance formation layout slot assignment system contract.
   */
  prototype?: string;

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
   * Positive uniform scale.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `scale` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `scale` for the performance formation layout slot assignment system contract.
   */
  scale: number;

  /**
   * Exact full rotation for an enhanced set.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `rotation` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `rotation` for the performance formation layout slot assignment system contract.
   */
  rotation?: IAutoMovieQuaternion;

  /**
   * Exact non-uniform scale for an enhanced set.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `scale3` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `scale3` for the performance formation layout slot assignment system contract.
   */
  scale3?: IAutoMovieVector3;

  /**
   * Explicit or seeded visibility for an enhanced set.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `visible` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `visible` for the performance formation layout slot assignment system contract.
   */
  visible?: boolean;

  /**
   * Selected exact sRGB palette value.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `palette` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `palette` for the performance formation layout slot assignment system contract.
   */
  palette: string;

  /**
   * Seed-derived numeric traits keyed by declared name.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `traits` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `traits` for the performance formation layout slot assignment system contract.
   */
  traits: Record<string, number>;
}
