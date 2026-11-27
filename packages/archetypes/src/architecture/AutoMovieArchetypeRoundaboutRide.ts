import type { IAutoMovieTransform } from "@automovie/interface";
import { rideRoundaboutImplementation } from "./internal/rideRoundabout";

/** A ride operation owned by the roundabout family. */
export namespace AutoMovieArchetypeRoundaboutRide {
  /**
   * A roundabout turned by a pusher on the ride's clock: the disc model
   * (`AutoMovieArchetypeRoundabout.disc`) turns about the spindle by the angle the pusher
   * drives until `release`, then coasts at the angular speed it had at release.
   * Bearing friction over a take's few seconds is neglected (provisional).
   *
   * @param placement The installed roundabout's world placement.
   * @param ride The driven angle and the release second.
   * @returns The disc's angle and frame on the ride's clock.
   * @throws {AutoMovieArchetypeRefusal} For a release before the ride starts.
   */
  export function ride(
    placement: IAutoMovieTransform,
    ride: AutoMovieArchetypeRoundaboutRide.IRideParams,
  ): AutoMovieArchetypeRoundaboutRide.IRideResult {
    return rideRoundaboutImplementation(placement, ride);
  }

  /** Driven-angle input and release second for one roundabout ride. */
  export interface IRideParams {
    /**
     * The disc's angle while the pusher holds it, degrees about `+y`.
     *
     * @param seconds Ride seconds.
     * @returns The angle.
     */
    driven(seconds: number): number;
    /** The ride second the pusher lets go. */
    release: number;
  }

  /** One turning roundabout's readers. */
  export interface IRideResult {
    /** The coasting angular speed after release, degrees per second. */
    speed: number;
    /**
     * The disc's angle at a ride second, degrees about `+y`.
     *
     * @param seconds Ride seconds.
     * @returns The angle.
     */
    angle(seconds: number): number;
    /**
     * The disc model's world frame at a ride second.
     *
     * @param seconds Ride seconds.
     * @returns The frame.
     */
    disc(seconds: number): IAutoMovieTransform;
  }
}