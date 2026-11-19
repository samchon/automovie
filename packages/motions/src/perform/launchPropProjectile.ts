import { AutoMovieGravity, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionPropLaunch,
  IAutoMovieProjectile,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/**
 * Construct the flight state from the displayed prop origin at release.
 * An opt-in sphere flies by its centre. A time-constrained world aim is
 * inverted from the same gravity equation the engine samples.
 *
 * @param launch The published release request.
 * @param origin The prop's displayed origin in world metres.
 * @param rotation The prop's displayed rotation.
 * @param drag The body's optional quadratic drag data.
 * @returns The admitted engine projectile with world initial position and velocity.
 * @throws {HumanRefusal} For invalid sphere data or an invalid drag-free aim.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies request, world frame, optional controls and refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Offsets the release origin by the rotated spherical centre and solves a supplied elapsed-time aim under standard uniform gravity.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Validates optional shape and aim, then constructs the initial state.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses invalid sphere parameters, rotating sphere attitudes and aims under drag; an un-aimed release uses the authored velocity.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A fixed number of scalar and vector operations.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the engine gravity, quaternion and vector owners and returns the standard projectile consumed by the same sampler and collision resolver.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one value and retains no resources.
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
      !Number.isFinite(sphere.radius) ||
      !Number.isFinite(Vector3.length(sphere.centre)) ||
      (sphere.tangentialFriction !== undefined &&
        (!(sphere.tangentialFriction >= 0) ||
          !Number.isFinite(sphere.tangentialFriction))) ||
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
  if (
    aim !== undefined &&
    (drag !== undefined ||
      !(aim.seconds > 0) ||
      !Number.isFinite(aim.seconds) ||
      !Number.isFinite(Vector3.length(aim.point)))
  )
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
  return {
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
}
