import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ArchetypeFrame, ArchetypeRefusal } from "../core";

/** A unit scale: the rides move rigid frames. */
const ONE: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };

/** The spindle's axis. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** The step that reads the driven angle's rate at release, seconds. */
const RATE: number = 1e-3;

/**
 * A roundabout turned by a pusher on the ride's clock: the disc model
 * (`createRoundabout.disc`) turns about the spindle by the angle the
 * pusher drives until `release`, then coasts at the angular speed it had
 * at release. Bearing friction over a take's few seconds is neglected
 * (provisional).
 *
 * @param placement The installed roundabout's world placement.
 * @param ride The driven angle and the release second.
 * @returns The disc's angle and frame on the ride's clock.
 * @throws {ArchetypeRefusal} For a release before the ride starts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the clock, the driven and coasting phases and the neglected friction.
 * @evidence contracts/development/implementation.md#principled-implementation The disc keeps the pusher's angle while held, then turns at constant speed.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the release, read its rate once, then one angle reader.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The driven angle is the caller's, from the pusher's displayed path.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per read.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each read is independent arithmetic.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the driven reader while the caller keeps the ride.
 */
export function rideRoundabout(
  placement: IAutoMovieTransform,
  ride: rideRoundabout.IParams,
): rideRoundabout.IRide {
  if (!(ride.release > RATE))
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype: "roundabout",
      axis: "release",
      value: ride.release,
      feasible: { kind: "range", minimum: RATE, maximum: null, unit: "s" },
      reason: "the pusher releases the disc after the ride starts",
      fix: "give a positive release second",
    });
  const released: number = ride.driven(ride.release);
  const speed: number = (released - ride.driven(ride.release - RATE)) / RATE;
  const angle = (seconds: number): number =>
    seconds <= ride.release
      ? ride.driven(Math.max(0, seconds))
      : released + speed * (seconds - ride.release);
  return {
    speed,
    angle,
    disc: (seconds: number): IAutoMovieTransform =>
      ArchetypeFrame.compose(placement, {
        scale: ONE,
        translation: { x: 0, y: 0, z: 0 },
        rotation: Quaternion.fromAxisAngle(UP, angle(seconds)),
      }),
  };
}

/**
 * The roundabout ride's parameters and readers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and clock.
 * @evidence contracts/development/design.md#principled-representation Degrees about `+y` and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The playground test reads these members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The pusher's angle is an input reader, not a stored table.
 */
export namespace rideRoundabout {
  /**
   * How the pusher turns the disc.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit.
   * @evidence contracts/development/design.md#principled-representation A reader of degrees over seconds and a release second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `rideRoundabout`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The angle comes from whoever pushes.
   */
  export interface IParams {
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

  /**
   * One turning roundabout's readers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and clock.
   * @evidence contracts/development/design.md#principled-representation Degrees per second and world frames over ride seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What a rider's composition and the test read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No reader stores a pose.
   */
  export interface IRide {
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
