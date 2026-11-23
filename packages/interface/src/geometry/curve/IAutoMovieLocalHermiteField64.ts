import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";
import type { AutoMovieBernsteinGrid64 } from "./AutoMovieBernsteinGrid64";

/**
 * Data and callback contracts shared by the LocalHermiteField64 operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Bicubic cells use normalized course phase and physical millimetre stations; jets distinguish the two derivative units. Borrowed admitted coefficients must remain immutable while closures live; these records do not claim an embedded or approximation-qualified mesh.
 * @evidence contracts/development/design.md#principled-representation Bicubic cells use normalized course phase and physical millimetre stations; jets distinguish the two derivative units.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieLocalHermiteField64 prepares shared field closures for adaptive planning and saved-course evaluation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Borrowed admitted coefficients must remain immutable while closures live; these records do not claim an embedded or approximation-qualified mesh.
 */
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
     */
    interval: (index: number) => IAutoMovieLocalHermiteField64.Cell[];
    /**
     * Authoritative saved-course value and right-sided partials; u=1 uses the left span.
     */
    station: (index: number, u: number) => IAutoMovieLocalHermiteField64.Jet;
  };
}
