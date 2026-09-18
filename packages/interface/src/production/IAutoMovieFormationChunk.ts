import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieFormationBounds } from "./IAutoMovieFormationBounds";

/**
 * One bounded slot range regenerated independently by viewer workers.
 *
 * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `IAutoMovieFormationChunk` as the portable data boundary for the formation slot identity requirement.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `IAutoMovieFormationChunk` for the performance formation layout slot assignment system contract.
 */
export interface IAutoMovieFormationChunk {
  /**
   * Zero-based stable chunk index.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `index` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `index` for the performance formation layout slot assignment system contract.
   */
  index: number;
  /**
   * Inclusive first slot.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `start` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `start` for the performance formation layout slot assignment system contract.
   */
  start: number;
  /**
   * Number of slots in this chunk.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `count` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `count` for the performance formation layout slot assignment system contract.
   */
  count: number;
  /**
   * Anonymous slots rendered through instancing after hero exclusion.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `anonymousCount` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `anonymousCount` for the performance formation layout slot assignment system contract.
   */
  anonymousCount: number;
  /**
   * Exact world-space range bounds.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `bounds` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `bounds` for the performance formation layout slot assignment system contract.
   */
  bounds: IAutoMovieFormationBounds;
  /**
   * Exact arithmetic centroid of the range.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `centroid` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `centroid` for the performance formation layout slot assignment system contract.
   */
  centroid: IAutoMovieVector3;
}
