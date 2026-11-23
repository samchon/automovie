import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieTrackCourse } from "./IAutoMovieTrackCourse";

/** A course, carrier and show clock for a scoped scenic ride module. */
export interface IAutoMovieTrackedRide {
  /** Spatial course in module-local metres, from the reusable course producer. */
  course: IAutoMovieTrackCourse.IPrepared;
  /**
   * Rigid generated model with a side-facing boarding support and a named seat
   * or grip.
   */
  car: IAutoMovieModel;
  /**
   * Side threshold surface id of the car. Its local X must point to an
   * identifiable side of the car.
   */
  boarding: string;
  /**
   * Film-local clock starting at zero. Times strictly increase and distances
   * stay on the course.
   */
  schedule: readonly IAutoMovieTrackedRide.IMark[];
  /** Named stations at held distances, on level boarding surfaces. */
  stops: Readonly<Record<string, number>>;
  /** Rail-center spacing in metres, strictly above the rail width. Default 1.2. */
  gauge?: number;
}

export namespace IAutoMovieTrackedRide {
  /** One authored time and travel distance in the show's clock. */
  export interface IMark {
    /** Seconds on the shot clock, starting at zero. */
    seconds: number;
    /**
     * Metres along the course. Equal successive distances pause, while a
     * decrease moves backwards.
     */
    distance: number;
  }
}
