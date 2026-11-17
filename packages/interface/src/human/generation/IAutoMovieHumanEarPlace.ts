import type { AutoMovieHumanSexPair } from "../AutoMovieHumanSexPair";

/**
 * Ear placement regressions and fore-aft offsets, distinguishing head-length fractions from millimetre results.
 *
 * The interface package owns these declarations; AutoMovieHumanEarPlace in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Ear placement regressions and fore-aft offsets, distinguishing head-length fractions from millimetre results. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only AboveTragionOnLength, IForward, IForwardResult declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation AboveTragionOnLength, IForward, IForwardResult separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanEarPlace exchanges the named AboveTragionOnLength, IForward, IForwardResult contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanEarPlace {
  /** The line on the ear length, women and men, mm.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The line on the ear length, women and men, mm.
   * @evidence contracts/development/design.md#principled-representation The line on the ear length, women and men, mm. The outer tuple/array is readonly; nested element types determine whether their contents can change.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanEarPlace.AboveTragionOnLength is the canonical exchange used by AutoMovieHumanEarPlace.ABOVE_TRAGION_ON_LENGTH.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanEarPlace.ABOVE_TRAGION_ON_LENGTH for the line on the ear length, women and men, mm.
   */
  export type AboveTragionOnLength = AutoMovieHumanSexPair<{
    /** Intercept of the table's affine predictor, in the response quantity's documented unit. */
    readonly a: number;
    /** Slope of the table's affine predictor, response units per predictor unit. */
    readonly b: number;
  }>;

  /** The ear's fore-aft place at the tragion's height, forward of the skull's
  centre (the midpoint of the midline's front and back where they stand
  farthest apart) per head length: the rim's most anterior point and the
  mean of the rim's points. Estimated from the private reference set; no
  published source found: `test_human_estimate_nasion_ear` reads -0.0996
  (SD 0.0068) and -0.1406 (SD 0.0215) on eight ears of four people.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The ear's fore-aft place at the tragion's height, forward of the skull's centre (the midpoint of the midline's front and back where they stand farthest apart) per head length: the rim's most anterior point and the mean of the rim's points.
 * @evidence contracts/development/design.md#principled-representation `front`: Rim's most anterior position relative to the skull's centre; positive is forward. `centre`: Mean rim position relative to the skull's centre; positive is forward.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanEarPlace.IForward is the canonical exchange used by AutoMovieHumanEarPlace.FORWARD.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `front`, `centre`; callers supply the complete record.
 */
  export type IForward = {
    /** Rim's most anterior position relative to the skull's centre; positive is forward. IForward stores a dimensionless fraction of head length; IForwardResult stores millimetres. */
    readonly front: number;
    /** Mean rim position relative to the skull's centre; positive is forward. IForward stores a dimensionless fraction of head length; IForwardResult stores millimetres. */
    readonly centre: number;
  };

  /** Result of AutoMovieHumanEarPlace.forward. The ear's fore-aft place at the tragion's height.
  @param head The head's measures, for its length.
  @returns The rim's front and centre forward of the skull's centre, mm (negative behind it).
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The ear's fore-aft place at the tragion's height.
 * @evidence contracts/development/design.md#principled-representation `front`: Rim's most anterior position relative to the skull's centre; positive is forward. `centre`: Mean rim position relative to the skull's centre; positive is forward.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanEarPlace.IForwardResult is the canonical exchange used by AutoMovieHumanEarPlace.forward.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `front`, `centre`; callers supply the complete record.
 */
  export type IForwardResult = {
    /** Rim's most anterior position relative to the skull's centre; positive is forward. IForward stores a dimensionless fraction of head length; IForwardResult stores millimetres. */
    front: number;
    /** Mean rim position relative to the skull's centre; positive is forward. IForward stores a dimensionless fraction of head length; IForwardResult stores millimetres. */
    centre: number;
  };
}
