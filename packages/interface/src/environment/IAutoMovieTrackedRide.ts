import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieTrackCourse } from "./IAutoMovieTrackCourse";

/**
 * A course, carrier and show clock for a scoped scenic ride module.
 *
 * @evidence contracts/development/design.md#principled-representation Several carriers can use the same spatial course with independent authored schedules. Each schedule interpolates distance by seconds and repeated distances hold position.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One model supplies the carrier, its boarding threshold and its named rider affordances, with optional dimensions only for the static track and platforms.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The scenic producer refuses incompatible docking and malformed timing. It does not derive operating speeds, certify accessibility or model restraint dynamics.
 * @evidence contracts/development/common.md#meaningful-documentation Explains the course and clock, supported motion and what remains outside the scenic record.
 */
export interface IAutoMovieTrackedRide {
  /** Spatial course in module-local metres, from the reusable course producer. */
  course: IAutoMovieTrackCourse.IPrepared;
  /** Rigid generated model with a side-facing boarding support and a named seat or grip. */
  car: IAutoMovieModel;
  /** Side threshold surface id of the car. Its local X must point to an identifiable side of the car. */
  boarding: string;
  /** Film-local clock starting at zero. Times strictly increase and distances stay on the course. */
  schedule: readonly IAutoMovieTrackedRide.IMark[];
  /** Named stations at held distances, on level boarding surfaces. */
  stops: Readonly<Record<string, number>>;
  /** Rail-center spacing in metres, strictly above the rail width. Default 1.2. */
  gauge?: number;
}

export namespace IAutoMovieTrackedRide {
  /**
   * One authored time and travel distance in the show's clock.
   *
   * @evidence contracts/development/design.md#principled-representation A separate distance from time permits a pause without zeroing the curve's tangent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two scalars describe a timed station; the spatial course owns height and orientation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The staging producer rejects nonfinite or out-of-order marks and distances outside the course.
   * @evidence contracts/development/common.md#meaningful-documentation Defines both units and the interpretation of equal or decreasing adjacent distances.
   */
  export interface IMark {
    /** Seconds on the shot clock, starting at zero. */
    seconds: number;
    /** Metres along the course. Equal successive distances pause, while a decrease moves backwards. */
    distance: number;
  }
}
