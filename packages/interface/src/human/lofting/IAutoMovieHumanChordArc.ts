import type { IAutoMovieArcLengthJet } from "../../geometry/IAutoMovieArcLengthJet";

/**
 * Published arclength endpoint jets and arc samples differentiated in their own xi parameter. Runtime construction and admission remain with AutoMovieHumanChordArc in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes published arclength endpoint jets and arc samples differentiated in their own xi parameter; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Published arclength endpoint jets and arc samples differentiated in their own xi parameter. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanChordArc; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing ChordArc contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanChordArc {
  /** A guide's published jet in the section chart, by arclength: `AutoMovieHumanSeam.publish`.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A guide's published jet in the section chart, by arclength: `AutoMovieHumanSeam.publish`.
   * @evidence contracts/development/design.md#principled-representation A guide's published jet in the section chart, by arclength: `AutoMovieHumanSeam.publish`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanChordArc.jet, AutoMovieHumanChordArc.published. Also types AutoMovieHumanLegRingRow.ends, AutoMovieHumanLegRingRow.b.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLegRingRow.ends, AutoMovieHumanLegRingRow.fullness, AutoMovieHumanLegRingRow.b, AutoMovieHumanLegTube.ends for a guide's published jet in the section chart, by arclength: `AutoMovieHumanSeam.publish`.
   */
  export type IEnd = {
    [K in keyof IAutoMovieArcLengthJet]: Readonly<IAutoMovieArcLengthJet[K]>;
  };

  /** A point of the arc with its first and second derivatives in `xi`.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A point of the arc with its first and second derivatives in `xi`.
   * @evidence contracts/development/design.md#principled-representation A point of the arc with its first and second derivatives in `xi`. Ordered tuple slots are 0, 1, 2; fixed arity preserves their correspondence.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanChordArc.jet. Also types AutoMovieHumanLegTube.[p, d1, d2], AutoMovieHumanChordArc.out.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLegTube.sectors, AutoMovieHumanChordArc.jet, AutoMovieHumanChordArc.out for a point of the arc with its first and second derivatives in `xi`.
   */
  export type Jet = [number[], number[], number[]];
}
