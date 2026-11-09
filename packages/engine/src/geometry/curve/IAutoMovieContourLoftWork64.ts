import type { AutoMovieCurveMath64 as M } from "./AutoMovieCurveMath64";
import type { prepareAutoMovieContourDocument64 as prepare } from "./prepareAutoMovieContourDocument64";

/**
 * Source-free intermediate contour records for one loft operation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Members state their units, ownership and local diagnostic scope.
 * @evidence contracts/development/design.md#principled-representation Represents Source-free intermediate contour records for one loft operation: companion namespace of 3 members (`Ring`, `Group`, `Slab`); units and frames named in its text: local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IAutoMovieContourLoftWork64` in packages/engine/src/geometry/curve/IAutoMovieContourLoftWork64.ts; its surface is the 3 members listed and the text shows 1 other file naming it, mostly packages/engine (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace IAutoMovieContourLoftWork64 {
  /**
   * One generated ring with explicit signed winding and inherited physical phase.
   *
   * @evidence contracts/development/design.md#principled-representation The structural record retains the original coefficient, phase and physical identity fields.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This type owner separates immutable contracts from numerical execution.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A type does not supply geometry, weld positions or certify source fidelity.
   * @evidence contracts/development/common.md#meaningful-documentation Members state their units, ownership and local diagnostic scope.
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
   * @evidence contracts/development/design.md#principled-representation The structural record retains the original coefficient, phase and physical identity fields.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This type owner separates immutable contracts from numerical execution.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A type does not supply geometry, weld positions or certify source fidelity.
   * @evidence contracts/development/common.md#meaningful-documentation Members state their units, ownership and local diagnostic scope.
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
   * @evidence contracts/development/design.md#principled-representation The structural record retains the original coefficient, phase and physical identity fields.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This type owner separates immutable contracts from numerical execution.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A type does not supply geometry, weld positions or certify source fidelity.
   * @evidence contracts/development/common.md#meaningful-documentation Members state their units, ownership and local diagnostic scope.
   */
  export interface Slab {
    /** Lower saved-section ordinal. */
    k: number;
    /** All declared local groups; unsupported groups are retained. */
    groups: Group[];
  }
}
