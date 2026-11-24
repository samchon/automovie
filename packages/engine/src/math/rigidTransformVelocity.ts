import type {
  IAutoMovieQuaternion,
  IAutoMovieRigidTransformVelocity,
  IAutoMovieTransform,
  IAutoMovieVector3,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { Quaternion } from "./Quaternion";
import { Vector3 } from "./Vector3";
import { overflowsBinary64 } from "./overflowsBinary64";

/**
 * Finite WORLD rigid-frame velocities over a positive interval: translation
 * secant in metres/second and shortest-arc rotation secant in radians/second.
 * Both frames must describe the same rigid identity in WORLD coordinates. The
 * caller owns deterministic actual sampling and selects one continuous branch;
 * these two frames cannot reveal intervening turns, constraints or impacts.
 * This is not an instantaneous derivative or a momentum estimate.
 *
 * Rotation admission uses the engine's existing 1e-6 unit-norm rule. Admitted
 * rotations are normalized into private copies for the logarithm. A computed
 * relative quaternion with exactly zero scalar component refuses because its
 * half-turn has two equally short axes. Nonpositive/nonfinite time, invalid
 * components or unrepresentable arithmetic throw RangeError without changing
 * either input. Scale is outside this rigid frame observation; a deforming
 * point needs its own actual point samples.
 */
export function rigidTransformVelocity(
  previous: Readonly<Pick<IAutoMovieTransform, "translation" | "rotation">>,
  current: Readonly<Pick<IAutoMovieTransform, "translation" | "rotation">>,
  elapsedSeconds: number,
): IAutoMovieRigidTransformVelocity.IResult {
  if (elapsedSeconds <= 0)
    throw new RangeError("Rigid velocity requires positive finite seconds");

  const admission: IAutoMovieViolationCollector = new ViolationCollector();
  for (const frame of [previous, current]) {
    admission.unitQuaternion("rotation", frame.rotation, "WORLD rotation");
  }
  if (admission.items.length !== 0)
    throw new RangeError(
      "Rigid velocity requires finite translations and unit rotations",
    );

  // Left composition expresses the logarithm about WORLD axes, not old local axes.
  const relative: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(
      current.rotation,
      Quaternion.inverse(previous.rotation),
    ),
  );
  if (relative.w === 0)
    throw new RangeError(
      "Rigid velocity cannot choose an exact half-turn branch",
    );
  const sign: number = relative.w < 0 ? -1 : 1;
  const imaginary: IAutoMovieVector3 = {
    x: relative.x * sign,
    y: relative.y * sign,
    z: relative.z * sign,
  };
  const sine: number = Math.hypot(imaginary.x, imaginary.y, imaginary.z);
  const angle: number = 2 * Math.atan2(sine, relative.w * sign);
  const displacement: IAutoMovieVector3 = Vector3.subtract(
    current.translation,
    previous.translation,
  );

  // Divide components last so stationary frames also support subnormal intervals.
  const linear: IAutoMovieVector3 = {
    x: displacement.x / elapsedSeconds,
    y: displacement.y / elapsedSeconds,
    z: displacement.z / elapsedSeconds,
  };
  const angular: IAutoMovieVector3 =
    sine === 0
      ? { x: 0, y: 0, z: 0 }
      : {
          x: ((imaginary.x / sine) * angle) / elapsedSeconds,
          y: ((imaginary.y / sine) * angle) / elapsedSeconds,
          z: ((imaginary.z / sine) * angle) / elapsedSeconds,
        };
  // The displacement and the quotients by a subnormal interval can overflow.
  if (
    [...Object.values(linear), ...Object.values(angular)].some(
      overflowsBinary64,
    )
  )
    throw new RangeError("Rigid velocity arithmetic is not representable");
  return { linear, angular };
}
