import { type IAutoMovieModel, type IAutoMovieTrackCourse, type IAutoMovieEnvironmentModule, type IAutoMovieTrackedRide } from "@automovie/interface";
import { createCoasterCar as createCoasterCarImplementation } from "./internal/createCoasterCar";
import { createTrackedCourse as createTrackedCourseImplementation } from "./internal/createTrackedCourse";
import { createTrackedRide as createTrackedRideImplementation } from "./internal/createTrackedRide";

/** Public operations for Auto Movie Environment Ride. */
export namespace AutoMovieEnvironmentRide {
  /**
   * Make a coarse single-seat amusement ride car with a level side threshold.
   *
   * The origin is at track height. The car faces +Z, its threshold is on +X and
   * its seat faces +Z. The body is a visual proxy with no physics or restraint
   * metadata. A production can substitute another admitted rigid carriage while
   * leaving the course unchanged.
   *
   * @param id Model identity, defaulting to coaster-car.
   * @returns A generated model with seat and boarding affordances.
   */
  export function coasterCar(id?: string): IAutoMovieModel {
    return createCoasterCarImplementation(id);
  }

  /**
   * Prepare a reusable banked course through XYZ waypoints.
   *
   * @param input Local waypoints, closure and optional bank and lateral input.
   * @returns Approximate arc stations and their shared rigid frame sampler.
   * @throws On malformed points or orientation, degenerate travel or distances
   *   the sampled frame cannot represent.
   */
  export function trackedCourse(input: IAutoMovieTrackCourse.IInput): IAutoMovieTrackCourse.IPrepared {
    return createTrackedCourseImplementation(input);
  }

  /**
   * Place a course, its moving car and its usable waiting platforms as one
   * module.
   *
   * The route's geometric clock runs in metres. The film clock linearly advances
   * through the author's distance marks, inserting a clip key wherever a rail
   * station or distance mark is reached. Both the ordinary object motion reader
   * and the rider's carrier reader can sample the returned clip with
   * `bakedTransformFromClipsAt`. Between the keys, the motion uses linear
   * translation and quaternion interpolation, the same approximation in both
   * views; its centre lies on the sampled course and its border rails interpolate
   * corresponding cross sections. Named stops are static anchors. The exported
   * carrier-affordance anchors describe the initial pose.
   *
   * @param input Course, rigid car with a named threshold and rider contact, time
   *   marks, and named held stops.
   * @returns An environment module with models, set pieces, prop, support and
   *   object clip.
   * @throws On malformed timing, gauge, carrier, threshold or stop positions, or
   *   if a threshold is not level and side-aligned in its placed stop frame.
   */
  export function trackedRide(input: IAutoMovieTrackedRide): IAutoMovieEnvironmentModule {
    return createTrackedRideImplementation(input);
  }
}
