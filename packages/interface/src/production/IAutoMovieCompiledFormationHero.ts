import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";

/**
 * One slot promoted out of anonymous batches into an explicit scene node.
 *
 * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `IAutoMovieCompiledFormationHero` as the portable data boundary for the formation slot identity requirement.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `IAutoMovieCompiledFormationHero` for the performance formation layout slot assignment system contract.
 */
export interface IAutoMovieCompiledFormationHero {
  /**
   * Exact promoted slot.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `slot` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `slot` for the performance formation layout slot assignment system contract.
   */
  slot: number;

  /**
   * Named explicit scene-node id.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `actor` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `actor` for the performance formation layout slot assignment system contract.
   */
  actor: string;

  /**
   * Compiler-owned base transform before source-authored performance.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `transform` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `transform` for the performance formation layout slot assignment system contract.
   */
  transform: IAutoMovieTransform;
}
