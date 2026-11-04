import type { AutoMovieNaturalSpline } from "@automovie/engine";
import type { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";
import type { IAutoMovieHumanHandClear } from "./IAutoMovieHumanHandClear";

type Vec3 = AutoMovieHumanHandVector.Vec3;

/**
 * A digit's law in the hand form's axes: its centre line, the half width and
 * half depth of its sections along it, the way its section's phase turns, and
 * its rounded tip. The form is shared by every person; a person's hand is the
 * form through the hand's three scales.
 */
export interface IAutoMovieHumanHandDigit {
  /** Centre of its root at the web, where its line starts. */
  centre: Vec3;

  /** Natural splines of the line's three coordinates over the length along it, mm of the form. */
  line: AutoMovieNaturalSpline.ISpline[];

  /** `[length, half width]` knots across the digit, mm of the form. */
  width: [number, number][];

  /** `[length, half depth]` knots through the digit, mm of the form. */
  depth: [number, number][];

  /** Section angle of each control point, turning one way round the digit. */
  angles: number[];

  /** Station of its first own section, past its webs' crests. */
  first: number;

  /** What its first section must clear: its arcs of the parent's ring and its webs' crests. */
  clear: IAutoMovieHumanHandClear[];

  /** Station where the rounded tip starts. */
  cap: number;

  /** The tip's apex, where the radius has fallen to nothing. */
  pole: Vec3;
}
