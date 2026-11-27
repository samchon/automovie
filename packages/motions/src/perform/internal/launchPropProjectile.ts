import {
  AutoMoviePhysicalProjectile,
  AutoMovieGravity,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  IAutoMovieMotionPropLaunch,
  IAutoMovieProjectile,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";

/*
 * Construct the flight state from the displayed prop origin at release. An
 * opt-in sphere flies by its centre. A time-constrained world aim is inverted
 * from the same gravity equation the engine samples.
 * Parameter launch: The published release request.
 * Parameter origin: The prop's displayed origin in world metres.
 * Parameter rotation: The prop's displayed rotation.
 * Parameter drag: The body's optional quadratic drag data.
 * Returns: The admitted engine projectile with world initial position and
 * velocity.
 * For invalid sphere data or an invalid drag-free aim.
 */
export function launchPropProjectile(
  launch: IAutoMovieMotionPropLaunch,
  origin: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  drag: IAutoMovieProjectile.IDrag | undefined,
): IAutoMovieProjectile {
  const sphere: IAutoMovieMotionPropLaunch["sphere"] = launch.sphere;
  if (
    sphere !== undefined &&
    (!(sphere.radius > 0) ||
      (sphere.tangentialFriction !== undefined &&
        !(sphere.tangentialFriction >= 0)) ||
      (launch.attitude !== undefined && launch.attitude.kind !== "fixed"))
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "sphere",
      value: sphere,
      reason:
        "a spherical launch needs a finite local centre, positive radius, fixed attitude and finite nonnegative optional friction",
      fix: "declare the ball's spherical collider and a valid release attitude and friction",
    });
  const aim: IAutoMovieMotionPropLaunch["aim"] = launch.aim;
  if (aim !== undefined && (drag !== undefined || !(aim.seconds > 0)))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "aim",
      value: aim,
      reason:
        "an aimed launch needs a drag-free prop, a finite world point, and a positive finite flight time",
      fix: "fix the flight time and target or give an explicit release velocity",
    });

  const centre: IAutoMovieVector3 =
    sphere === undefined
      ? origin
      : Vector3.add(origin, Quaternion.rotateVector(rotation, sphere.centre));
  const projectile: IAutoMovieProjectile = {
    origin: centre,
    velocity:
      aim === undefined
        ? launch.velocity
        : Vector3.subtract(
            Vector3.scale(Vector3.subtract(aim.point, centre), 1 / aim.seconds),
            Vector3.scale(AutoMovieGravity.DOWN, aim.seconds / 2),
          ),
    gravity: AutoMovieGravity.DOWN,
    ...(drag === undefined ? {} : { drag }),
    attitude:
      launch.attitude === undefined
        ? { kind: "fixed", rotation }
        : launch.attitude.kind === "velocity"
          ? launch.attitude
          : { ...launch.attitude, rotation },
  };
  return drag === undefined
    ? projectile
    : { ...projectile, flight: AutoMoviePhysicalProjectile.dragFlight(projectile) };
}
