import type { AutoMovieCurveMath64 as M } from "./AutoMovieCurveMath64";
import type { prepareAutoMovieContourDocument64 as prepare } from "./prepareAutoMovieContourDocument64";

/**
 * Source-free intermediate contour records for one loft operation.
 *
 * @evidence contracts/common.md#principled-implementation The structural record retains the original coefficient, phase and physical identity fields.
 * @evidence contracts/common.md#clear-and-simple-design This type owner separates immutable contracts from numerical execution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A type does not supply geometry, weld positions or certify source fidelity.
 * @evidence contracts/common.md#meaningful-documentation Members state their units, ownership and local diagnostic scope.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A type owns no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns all arrays and records.
 */
export namespace IAutoMovieContourLoftWork64 {
  /**
   * One generated ring with explicit signed winding and inherited physical phase.
   *
   * @evidence contracts/common.md#principled-implementation The structural record retains the original coefficient, phase and physical identity fields.
   * @evidence contracts/common.md#clear-and-simple-design This type owner separates immutable contracts from numerical execution.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A type does not supply geometry, weld positions or certify source fidelity.
   * @evidence contracts/common.md#meaningful-documentation Members state their units, ownership and local diagnostic scope.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A type performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A type owns no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns all arrays and records.
   * @author Samchon
   */
  export interface Ring {
    /** Stable generated ring identity. */
    id: string;
    /** Generated physical millimetre boundary points, not original source mesh vertices. */
    points: M.V[];
    /** Declared signed material boundary orientation. */
    winding: number;
    /** Complete saved generating phase period. */
    period: number;
    /** Local inability to represent this generating boundary, when present. */
    unsupported?: string;
  }
  /**
   * Local incidence between two adjacent saved cuts.
   *
   * @evidence contracts/common.md#principled-implementation The structural record retains the original coefficient, phase and physical identity fields.
   * @evidence contracts/common.md#clear-and-simple-design This type owner separates immutable contracts from numerical execution.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A type does not supply geometry, weld positions or certify source fidelity.
   * @evidence contracts/common.md#meaningful-documentation Members state their units, ownership and local diagnostic scope.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A type performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A type owns no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns all arrays and records.
   * @author Samchon
   */
  export interface Group {
    /** Lower-section local ring ordinals. */
    a: number[];
    /** Upper-section local ring ordinals. */
    b: number[];
    /** Admitted generating event records owned by the prepared document. */
    critical: ReturnType<typeof prepare>["events"];
    /** Explicit local omission reason, when present. */
    unsupported?: string;
  }
  /**
   * One adjacent-cut work address and its independent local groups.
   *
   * @evidence contracts/common.md#principled-implementation The structural record retains the original coefficient, phase and physical identity fields.
   * @evidence contracts/common.md#clear-and-simple-design This type owner separates immutable contracts from numerical execution.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A type does not supply geometry, weld positions or certify source fidelity.
   * @evidence contracts/common.md#meaningful-documentation Members state their units, ownership and local diagnostic scope.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A type performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A type owns no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns all arrays and records.
   * @author Samchon
   */
  export interface Slab {
    /** Lower saved-section ordinal. */
    k: number;
    /** All declared local groups; unsupported groups are retained. */
    groups: Group[];
  }
}
