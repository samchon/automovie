import type { IAutoMovieHumanBodySimpleShapeFat } from "./IAutoMovieHumanBodySimpleShapeFat";
import type { IAutoMovieHumanBodySimpleShapeIdentity } from "./IAutoMovieHumanBodySimpleShapeIdentity";
import type { IAutoMovieHumanBodySimpleShapeLimits } from "./IAutoMovieHumanBodySimpleShapeLimits";
import type { IAutoMovieHumanBodySimpleShapeMass } from "./IAutoMovieHumanBodySimpleShapeMass";
import type { IAutoMovieHumanBodySimpleShapeMaturity } from "./IAutoMovieHumanBodySimpleShapeMaturity";
import type { IAutoMovieHumanBodySimpleShapeMeasurement } from "./IAutoMovieHumanBodySimpleShapeMeasurement";
import type { IAutoMovieHumanBodySimpleShapeSolved } from "./IAutoMovieHumanBodySimpleShapeSolved";
import type { IAutoMovieHumanBodySimpleShapeTerm } from "./IAutoMovieHumanBodySimpleShapeTerm";

/**
 * The shape of the simple-tier expansion table: the envelope, the stature
 * and mass models, the age-specific body fat estimates and the term rows,
 * all numbers.
 *
 * A term row scales the product of piecewise-linear curves, one per simple
 * or derived parameter, into one channel; rows for the same channel add. A
 * curve holds its end values outside its points. The identity, solved and
 * measurement entries name the channels the projection reads back and the
 * inversions solve. The table is data so a relation is audited and tuned as
 * a row, never as code.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeTable {
  /** Inclusive envelope of each simple parameter, the optional ones included. */
  limits: IAutoMovieHumanBodySimpleShapeLimits;

  /**
   * The identity parameters a detailed shape is projected back to: each
   * reads one channel through the inverse of its first term row, after the
   * other rows naming that channel (an age loss on the muscle) are removed.
   */
  identity: IAutoMovieHumanBodySimpleShapeIdentity;

  /**
   * The stature channel, solved by measurement, and the mass direction: the
   * channels a kilogram is spread over (the source's weight macro and the
   * regional fat, by sex) as term rows whose products are the direction's
   * coefficients; the mass is solved as one scalar along that direction,
   * over the envelope of the channel named `range`.
   */
  solved: IAutoMovieHumanBodySimpleShapeSolved;

  /** Optional exterior girths and rig shoulder-centre distance: each channel is solved by its own `HUMAN_BODY_MEASUREMENTS` rule. */
  measurements: IAutoMovieHumanBodySimpleShapeMeasurement[];

  /** Siri's density model and the trusted fat band. */
  mass: IAutoMovieHumanBodySimpleShapeMass;

  /** Deurenberg's two body-fat regressions and the essential fat the definition gates subtract. */
  fat: IAutoMovieHumanBodySimpleShapeFat;

  /**
   * Authored age ramp for the model's training contribution: zero before
   * `startAgeYears`, one from `endAgeYears` and linear between, with endpoints
   * interpolated over sex. It measures no individual's capacity. The derived
   * `developedMuscle` is the muscle parameter times this ramp; relations
   * calibrated on adult training read it instead of `muscle`, and so does
   * the fat-free mass the definition gates subtract.
   */
  maturity: IAutoMovieHumanBodySimpleShapeMaturity;

  /** Channel weight = Σ gain · Π curve(parameter) over the rows naming that channel. */
  terms: IAutoMovieHumanBodySimpleShapeTerm[];
}
