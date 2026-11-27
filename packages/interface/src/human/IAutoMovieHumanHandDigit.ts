import type { IAutoMovieNaturalCubicSpline } from "../construction/IAutoMovieNaturalCubicSpline";
import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanHandClear } from "./IAutoMovieHumanHandClear";
import type { IAutoMovieHumanHandDigitDepthKnot } from "./IAutoMovieHumanHandDigitDepthKnot";
import type { IAutoMovieHumanHandDigitWidthKnot } from "./IAutoMovieHumanHandDigitWidthKnot";

/**
 * A digit's law in the hand form's axes: its centre line, the half width and
 * half depth of its sections along it, the way its section's phase turns, and
 * its rounded tip. The form is shared by every person; a person's hand is the
 * form through the hand's three scales.
 */
export interface IAutoMovieHumanHandDigit {
  /** Centre of its root at the web, where its line starts. */
  centre: AutoMovieVector3Tuple;

  /**
   * Natural splines of the line's three coordinates over the length along it,
   * mm of the form.
   */
  line: IAutoMovieNaturalCubicSpline[];

  /** Knots of half width across the digit, at lengths along the digit, mm. */
  width: IAutoMovieHumanHandDigitWidthKnot[];

  /** Knots of half depth through the digit, at lengths along the digit, mm. */
  depth: IAutoMovieHumanHandDigitDepthKnot[];

  /** Section angle of each control point, turning one way round the digit. */
  angles: number[];

  /** Station of its first own section, past its webs' crests. */
  first: number;

  /**
   * What its first section must clear: its arcs of the parent's ring and its
   * webs' crests.
   */
  clear: IAutoMovieHumanHandClear[];

  /** Station where the rounded tip starts. */
  cap: number;

  /** The tip's apex, where the radius has fallen to nothing. */
  pole: AutoMovieVector3Tuple;
}
