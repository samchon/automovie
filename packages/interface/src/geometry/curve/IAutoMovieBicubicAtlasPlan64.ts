import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";
import type { IAutoMovieBicubicAtlas64 } from "./IAutoMovieBicubicAtlas64";
import type { IAutoMoviePrepareBicubicAtlasBoundary64 } from "./IAutoMoviePrepareBicubicAtlasBoundary64";

/**
 * Admitted atlas preparation and shared per-invocation vertex accounting.
 *
 * @evidence contracts/development/design.md#principled-representation Prepared millimetre charts retain their input patch ordering and separate physical identity from render fan receipts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IResult connects atlas planning to registry construction and emission.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Plan diagnostics preserve omitted and over-tolerance work independently of finite output.
 * @evidence contracts/development/common.md#meaningful-documentation The result documents input retention, mutable caches and arithmetic callback units.
 */
export namespace IAutoMovieBicubicAtlasPlan64 {
  /**
   * Prepared canonical coefficients, adaptive leaves and shared arithmetic/cache
   * services for one atlas invocation. Input controls and bindings remain borrowed
   * by boundary closures; keep them unchanged throughout registry and emission.
   *
   * @evidence contracts/development/design.md#principled-representation Plans use millimetre grids on normalized charts while fan receipts store emitted model-metre positions and global indices.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieBicubicAtlasPlan64 returns the state shared by registry creation and emission; the fan cache separates physical identity from render normals.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Local omissions and retained coarse estimates remain in plans rather than being replaced by synthetic geometry.
   * @evidence contracts/development/common.md#meaningful-documentation States borrowed input lifetime, shared mutable caches, per-patch ordering and unit-preserving arithmetic callbacks.
   */
  export type IResult = {
    /** Admitted canonical authority/control bindings shared by planning, registry and emission. Retain their identity throughout this generator invocation. */
    boundary: IAutoMoviePrepareBicubicAtlasBoundary64.IResult;
    /** Per-invocation cache mapping physical identity then normal-fan identity to an emitted render vertex. Different normal fans can share a position identity without sharing a render index. */
    fanVertices: Map<string, Map<string, IAutoMovieBicubicAtlas64.Vertex>>;
    /**
     * Euclidean norm of the supplied three components, preserving their units; no direction normalization or finite-value admission is implied.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States that Euclidean norm preserves operand units without normalizing directions or admitting finite values.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; AutoMovieBicubicAtlasPlan64's per-invocation arithmetic closures own the numerical method under the documented units and input premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature exposes the callback boundary; AutoMovieBicubicAtlasPlan64's per-invocation arithmetic closures own executable decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This declaration supplies no algorithm, compensation or fallback; the actual behavior is implemented by AutoMovieBicubicAtlasPlan64's per-invocation arithmetic closures.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no traversal or allocation strategy; AutoMovieBicubicAtlasPlan64's per-invocation arithmetic closures own its evaluation cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration schedules no work; AutoMovieBicubicAtlasPlan64's per-invocation arithmetic closures decide whether calls share coefficients, identities or mutable state.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This signature acquires no storage or handles; AutoMovieBicubicAtlasPlan64's per-invocation arithmetic closures own references retained by the supplied callable.
     */
    norm: (p: AutoMovieVector3Tuple) => number;
    /**
     * Three-dimensional cross product returning a new tuple. Output units are the product of operand units; this callback does not normalize the result.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States allocation of a new cross-product tuple, product units and absence of result normalization.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; AutoMovieBicubicAtlasPlan64's per-invocation arithmetic closures own the numerical method under the documented units and input premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature exposes the callback boundary; AutoMovieBicubicAtlasPlan64's per-invocation arithmetic closures own executable decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This declaration supplies no algorithm, compensation or fallback; the actual behavior is implemented by AutoMovieBicubicAtlasPlan64's per-invocation arithmetic closures.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no traversal or allocation strategy; AutoMovieBicubicAtlasPlan64's per-invocation arithmetic closures own its evaluation cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration schedules no work; AutoMovieBicubicAtlasPlan64's per-invocation arithmetic closures decide whether calls share coefficients, identities or mutable state.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This signature acquires no storage or handles; AutoMovieBicubicAtlasPlan64's per-invocation arithmetic closures own references retained by the supplied callable.
     */
    cross: (
      a: AutoMovieVector3Tuple,
      b: AutoMovieVector3Tuple,
    ) => AutoMovieVector3Tuple;
    /** One adaptive plan per input patch in input order, sharing the admitted global cell budget. Empty or incomplete cells and diagnostics remain visible for omitted work. */
    plans: IAutoMovieBicubicAtlas64.Plan[];
  };
}
