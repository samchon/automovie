import type { IAutoMovieSurfacePattern } from "./IAutoMovieSurfacePattern";

/** Authored planar pattern and synchronous zone generators consumed by deterministic surface laying. */
export namespace IAutoMovieGenerateSurfacePattern {
  /**
   * Authored planar pattern and synchronous zone generators consumed by deterministic surface laying.
   *
   * With stable input and a pure generator, the fixed sequence is repeatable in the same numerical runtime: zones in declaration order, rows outermost, columns innermost and candidates in generator order. Engine code samples neither clock nor `Math.random`; variants use {@link seededValue} with the pattern seed and an FNV-1a occurrence-id hash. The callback's own purity is a caller premise.
   *
   * Every module is clipped to its own zone region, then measured against every
   * exclusion. A module the region rejects entirely is not a zero-area
   * occurrence, it is absent, and so is one an exclusion covers entirely. What
   * survives carries the coverage it kept, why it was cut, and the identity that
   * the mesh, the instance slot, the finish, and the take-off all cite, so a
   * quantity can be traced back to the exact piece it counted. Quantities are
   * reported per zone and in total, and quality is judged by
   * {@link autoMoviePatternFindings}.
   *
   * Coordinates are the surface's planar (u, v) metres and angles are degrees. A malformed declaration throws an `Error` naming the field: blank or duplicate ids, non-finite or non-positive sizes, a non-convex region or exclusion, overlapping zones or exclusions, ambiguous surviving occurrence ids, a zone spanning more than `AUTOMOVIE_MAX_PATTERN_CELLS` lattice cells, non-safe-integer derived lattice bounds, or a generated module reaching beyond its cell's declared reach. Quality defects are not thrown; they are returned as `findings` (sliver, unsupported-piece, module-overlap, joint-deviation, grain-break).
   *
   * @evidence contracts/development/design.md#principled-representation Pattern coordinates are planar U/V metres and angles are degrees; generateAutoMovieSurfacePattern checks declaration geometry, safe lattice bounds and candidate reach before emitting placements.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The single pattern member reuses IAutoMovieSurfacePattern, including its generator contract; the engine owns placement and quantity calculation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Generator purity is a caller premise and callback exceptions propagate; geometric admission throws while quality findings are returned, and callbacks are not retained.
   * @evidence contracts/development/common.md#meaningful-documentation Authored planar pattern and synchronous zone generators consumed by deterministic surface laying. Pattern coordinates are planar U/V metres and angles are degrees; generateAutoMovieSurfacePattern checks declaration geometry, safe lattice bounds and candidate reach before emitting placements.
   */
  export type IProps = {
    /**
     * Borrowed planar-metre declarations and synchronous zone generators. Validation
     * refuses malformed geometry/budgets; generator exceptions propagate. Stable
     * inputs and pure generators are caller premises for repeatable placement.
     */
    pattern: IAutoMovieSurfacePattern;
  };
}
