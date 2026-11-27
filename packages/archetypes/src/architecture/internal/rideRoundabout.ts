import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame, AutoMovieArchetypeRefusal } from "../../core";
import type { AutoMovieArchetypeRoundaboutRide } from "../AutoMovieArchetypeRoundaboutRide";

/** A unit scale: the rides move rigid frames. */
const ONE: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };

/** The spindle's axis. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** The step that reads the driven angle's rate at release, seconds. */
const RATE: number = 1e-3;

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
export function rideRoundabout(
  placement: IAutoMovieTransform,
  ride: AutoMovieArchetypeRoundaboutRide.IRideParams,
): AutoMovieArchetypeRoundaboutRide.IRideResult {
  if (!(ride.release > RATE))
    throw new AutoMovieArchetypeRefusal({
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
      AutoMovieArchetypeFrame.compose(placement, {
        scale: ONE,
        translation: { x: 0, y: 0, z: 0 },
        rotation: Quaternion.fromAxisAngle(UP, angle(seconds)),
      }),
  };
}
