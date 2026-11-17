import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanDigitLine; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanDigitLine exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups ILeg, ILine. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanDigitLine; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the ILeg, ILine contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanDigitLine {
  /** One bone of the line.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One bone of the line.
   * @evidence contracts/development/design.md#principled-representation `direction`: Unit direction. `length`: Length along the arc, mm. `turn`: Half length of the turn onto the next leg at this leg's distal joint, mm; ignored on the last leg.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanDigitLine.build.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `direction`, `length`, `turn`; callers supply the complete record.
   */
  export interface ILeg {
    /** Unit direction. */
    direction: AutoMovieVector3Tuple;

    /** Length along the arc, mm. */
    length: number;

    /**
     * Half length of the turn onto the next leg at this leg's distal joint,
     * mm; ignored on the last leg.
     */
    turn: number;
  }

  /** A built line.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A built line.
   * @evidence contracts/development/design.md#principled-representation `points`: Points from the start, one every {@link ILine.step}. `step`: Spacing of the points along the arc. `length`: Arc length of the whole line.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanDigitLine.build. Also types AutoMovieHumanHandDigitBones.line.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `points`, `step`, `length`, `joints`, `at`, `tangent`; callers supply the complete record.
   */
  export interface ILine {
    /** Points from the start, one every {@link ILine.step}. */
    points: AutoMovieVector3Tuple[];

    /** Spacing of the points along the arc. */
    step: number;

    /** Arc length of the whole line. */
    length: number;

    /** Arc length of each leg's distal end: the joints, then the line's end. */
    joints: number[];

    /**
     * Point at an arc length, clamped to the line.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Point at an arc length, clamped to the line.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanDigitLine owns the numerical method described above.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanDigitLine.ILine.at declares the invocation boundary only; AutoMovieHumanDigitLine and its callback provider own the implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanDigitLine.ILine.at must justify them.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanDigitLine.ILine.at owns its time and space costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanDigitLine and the callback's provider own sharing under the stated input and result contract.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanDigitLine producer or caller supplying the callback owns captured state and its lifetime.
     */
    at: (s: number) => AutoMovieVector3Tuple;

    /**
     * Unit tangent at an arc length.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Unit tangent at an arc length.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanDigitLine owns the numerical method described above.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanDigitLine.ILine.tangent declares the invocation boundary only; AutoMovieHumanDigitLine and its callback provider own the implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanDigitLine.ILine.tangent must justify them.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanDigitLine.ILine.tangent owns its time and space costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanDigitLine and the callback's provider own sharing under the stated input and result contract.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanDigitLine producer or caller supplying the callback owns captured state and its lifetime.
     */
    tangent: (s: number) => AutoMovieVector3Tuple;
  }
}
