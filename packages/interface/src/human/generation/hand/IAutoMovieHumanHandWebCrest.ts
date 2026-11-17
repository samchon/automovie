import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanHandWebCrest; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanHandWebCrest exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IInput, IPair. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanHandWebCrest; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IInput, IPair contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanHandWebCrest {
  /** A web's fixed inputs.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A web's fixed inputs.
   * @evidence contracts/development/design.md#principled-representation `dorsal`: The dorsal crest, left frame, mm. `mcp`: The knuckle of the finger whose phalanx the palmar crest reads, mm. `along`: Unit direction along the finger's proximal phalanx.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHandWebCrest.pair.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `dorsal`, `mcp`, `along`, `phalanx`; callers supply the complete record.
   */
  export interface IInput {
    /** The dorsal crest, left frame, mm. */
    dorsal: AutoMovieVector3Tuple;

    /** The knuckle of the finger whose phalanx the palmar crest reads, mm. */
    mcp: AutoMovieVector3Tuple;

    /** Unit direction along the finger's proximal phalanx. */
    along: AutoMovieVector3Tuple;

    /** Length of that phalanx, mm. */
    phalanx: number;
  }

  /** The two crests.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The two crests.
   * @evidence contracts/development/design.md#principled-representation `dorsal`: The dorsal crest, mm. `palmar`: The palmar crest, mm, distal of the dorsal one.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHandWebCrest.pair.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `dorsal`, `palmar`; callers supply the complete record.
   */
  export interface IPair {
    /** The dorsal crest, mm. */
    dorsal: AutoMovieVector3Tuple;

    /** The palmar crest, mm, distal of the dorsal one. */
    palmar: AutoMovieVector3Tuple;
  }
}
