import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { IAutoMovieHumanFootConnection } from "./IAutoMovieHumanFootConnection";

/**
 * Type contracts exchanged by AutoMovieHumanToeVertical; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanToeVertical exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups ISource. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanToeVertical; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the ISource contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanToeVertical {
  /** Full original vertical curves plus their actual parent contact authority.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Full original vertical curves plus their actual parent contact authority.
   * @evidence contracts/development/design.md#principled-representation `height`: Original world-height axis curve, mm. `upper`: Positive dorsal and negative plantar radial source curves, mm. `lower`: Negative radial source; height+lower equals plantar under the same clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanToeVertical.create. Also types AutoMovieHumanFootToeSources.vertical.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `height`, `upper`, `lower`, `plantar`, `root`, `hidden`, `at`; callers supply the complete record.
   */
  export interface ISource {
    /** Original world-height axis curve, mm. */
    height: IAutoMovieViewPart.IOutline;
    /** Positive dorsal and negative plantar radial source curves, mm. */
    upper: IAutoMovieViewPart.IOutline;
    /** Negative radial source; height+lower equals plantar under the same clock. */
    lower: IAutoMovieViewPart.IOutline;
    /** Nonnegative absolute plantar source, not a bound on a moving relative edge. */
    plantar: IAutoMovieViewPart.IOutline;
    /** Actual parent local chord at the named skin root. */
    root: IAutoMovieHumanFootConnection.IChord;
    /** Actual parent local chord at the hidden closing point. */
    hidden: IAutoMovieHumanFootConnection.IChord;
    /**
     * Read [height, upper, lower, plantar] in millimetres at the same physical source station in millimetres, using the retained outlines; source evaluation failures throw.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Read [height, upper, lower, plantar] in millimetres at the same physical source station in millimetres, using the retained outlines; source evaluation failures throw.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanToeVertical owns the numerical method described above.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanToeVertical.ISource.at declares the invocation boundary only; AutoMovieHumanToeVertical and its callback provider own the implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanToeVertical.ISource.at must justify them.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanToeVertical.ISource.at owns its time and space costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanToeVertical and the callback's provider own sharing under the stated input and result contract.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanToeVertical producer or caller supplying the callback owns captured state and its lifetime.
     */
    at: (station: number) => [number, number, number, number];
  }
}
