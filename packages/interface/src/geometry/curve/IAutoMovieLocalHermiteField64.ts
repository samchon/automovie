import type { AutoMovieBernsteinGrid64 } from "./AutoMovieBernsteinGrid64";
import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";

/** Data and callback contracts shared by the LocalHermiteField64 operations. */
export namespace IAutoMovieLocalHermiteField64 {
  /**
     * Exact analytic cell; rows run along station t, columns along normalized phase u.
     *
     * @evidence contracts/development/design.md#principled-representation Four complete cubic rows retain the local tensor coefficients in millimetres.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Phase extent accompanies its coefficient grid.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts No sample or source topology substitutes for coefficients.
     * @evidence contracts/development/common.md#meaningful-documentation States grid direction and units.
     */
    export type Cell = {
      /** First normalized course phase. */
      u0: number;
      /** Last normalized course phase, strictly greater than u0. */
      u1: number;
      /** Millimetre bicubic coefficient rows, station first and course second. */
      grid: AutoMovieBernsteinGrid64;
    };

  /**
     * Millimetre position and full partials per normalized phase and physical station mm.
     *
     * @evidence contracts/development/design.md#principled-representation Complete evaluated first derivatives retain their chart scale.
     * @evidence contracts/development/design.md#minimal-and-owned-surface One jet supplies positions and analytic normals.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Partials are not unit tangent hints.
     * @evidence contracts/development/common.md#meaningful-documentation States units of both independent parameters.
     */
    export type Jet = {
      /** Source curve position in millimetres. */
      position: AutoMovieVector3Tuple;
      /** Derivative per normalized course phase, millimetres. */
      coursePartial: AutoMovieVector3Tuple;
      /** Derivative per physical station millimetre. */
      stationPartial: AutoMovieVector3Tuple;
    };

  /**
     * Admitted field closures. Inputs must stay immutable until the caller releases this
     * object; only partitions and derivative weights are retained in addition to inputs.
     *
     * @evidence contracts/development/design.md#principled-representation Interval cells use at most four contributing courses and station jets use the same fixed derivative weights.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Two operations expose analytic cells and authoritative station-edge jets.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Shared boundaries are evaluated from the original course rather than adjacent rounded restrictions.
     * @evidence contracts/development/common.md#meaningful-documentation States immutable lifetime and right-sided knot derivatives, with the final endpoint left-sided.
     */
    export type Prepared = {
      /**
       * Increasing local phase cells for one admitted physical station interval.
       *
       * @evidence contracts/development/implementation.md#principled-implementation Exact restrictions and fixed physical derivative weights construct bicubic cells from admitted courses.
       * @evidence contracts/development/implementation.md#clear-and-simple-structure One interval address returns caller-owned coefficient cells without observation or topology inference.
       * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No source face, sampled replacement curve or limiter changes the prepared field.
       * @evidence contracts/development/common.md#meaningful-documentation The prepared owner states station indexing, millimetres, immutable course lifetime and unsupported geometric guarantees.
       * @evidence contracts/development/implementation.md#efficient-algorithms Work sorts the at-most-four incident course partitions and performs constant-degree restriction per resulting cell.
       * @evidence contracts/development/implementation.md#reuse-equivalent-work Admitted partitions and station derivative weights are reused by every interval call.
       * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Fresh cell arrays belong to the caller; no additional process-wide state is retained.
       */
      interval: (index: number) => IAutoMovieLocalHermiteField64.Cell[];
      /**
       * Authoritative saved-course value and right-sided partials; u=1 uses the left span.
       *
       * @evidence contracts/development/implementation.md#principled-implementation The stored course evaluates position once while the same physical station stencil supplies its transverse derivative.
       * @evidence contracts/development/implementation.md#clear-and-simple-structure One normalized phase query returns a complete analytic jet from the prepared field.
       * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unit tangent hints, source normals and coordinate-based neighbor matching do not supply derivatives.
       * @evidence contracts/development/common.md#meaningful-documentation States one-sided knot convention, physical versus normalized derivatives and saved-curve authority.
       * @evidence contracts/development/implementation.md#efficient-algorithms Binary span lookup and constant-degree evaluation visit at most four incident course spans.
       * @evidence contracts/development/implementation.md#reuse-equivalent-work Prepared partitions and physical derivative weights serve every station query.
       * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned jet is newly owned and no query cache or source mesh is retained.
       */
      station: (index: number, u: number) => IAutoMovieLocalHermiteField64.Jet;
    };
}
