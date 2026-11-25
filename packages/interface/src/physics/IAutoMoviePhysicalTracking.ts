import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Requested bounded joint torque, shortest-arc error and pre-cap saturation
 * diagnostics.
 */
export namespace IAutoMoviePhysicalTracking {
  /**
   * Bounded joint-frame PD torque demand and its angular tracking diagnostics.
   *
   * Torque uses N m and error uses radians in the joint frame; saturated lists
   * axes whose uncapped demand exceeds their strength-scaled cap.
   * AutoMoviePhysicalTracking.torque allocates the vectors and axis list
   * without applying them to a body or retaining controller state. The producer
   * admits positive timestep and effective inertia and strength in [0,1];
   * callers supply admitted axes and normalized orientations. A capped command
   * is not a measurement of achieved native torque.
   */
  export interface IResult {
    /** Bounded requested joint-frame torque in N m; undeclared axes remain zero. */
    torque: IAutoMovieVector3;

    /** Shortest-arc joint-frame rotation error in radians. */
    error: IAutoMovieVector3;

    /**
     * Declared axes whose pre-cap PD demand exceeds maximumTorque times
     * strength; an empty list reports no requested saturation.
     */
    saturated: ("x" | "y" | "z")[];
  }
}
