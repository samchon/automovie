import type {
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { Quaternion } from "./Quaternion";
import { Vector3 } from "./Vector3";

/**
 * Finite WORLD rigid-frame velocities over a positive interval: translation secant in metres/second and shortest-arc rotation secant in radians/second. Both frames must describe the same rigid identity in WORLD coordinates. The caller owns deterministic actual sampling and selects one continuous branch; these two frames cannot reveal intervening turns, constraints or impacts. This is not an instantaneous derivative or a momentum estimate.
 *
 * Rotation admission uses the engine's existing 1e-6 unit-norm rule. Admitted rotations are normalized into private copies for the logarithm. A computed relative quaternion with exactly zero scalar component refuses because its half-turn has two equally short axes. Nonpositive/nonfinite time, invalid components or unrepresentable arithmetic throw RangeError without changing either input. Scale is outside this rigid frame observation; a deforming point needs its own actual point samples.
 *
 * @evidence contracts/common.md#principled-implementation Translation is its endpoint difference divided by elapsed seconds. The principal logarithm of current times inverse(previous) gives the WORLD-axis rotation increment, invariant under either quaternion sign. The caller must supply the same actual rigid identity and one branch with less than pi intervening rotation; endpoint data cannot certify that premise or a derivative. Existing unit admission precedes private normalization; exact pi and nonrepresentable intermediates refuse.
 * @evidence contracts/common.md#clear-and-simple-design One pure function observes two existing transform projections and returns two existing vectors. Actor identity, temporal sampling, contact branches and clinical controls remain with their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No actor, renderer, technique or sampling rate is special-cased. Zero angular velocity applies only to an identity increment, and invalid or ambiguous data throws rather than supplying a fabricated velocity.
 * @evidence contracts/common.md#meaningful-documentation Gives WORLD frames, metre/second and radian/second units, shortest-arc and alias limits, actual-sampling responsibility, normalization and rejection behavior, scale exclusion and input ownership.
 * @evidence contracts/performance.md#efficient-algorithms Two fixed-size admissions, one quaternion product/logarithm and one vector difference take constant time and temporary space; no pose, geometry or history is scanned.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This stateless operation reads two supplied frames once and coordinates no work across requests; the caller owns any equivalent actual-state sampling.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned vectors own their components; temporary admissions and quaternion copies retain no caller record, history, handle or task after return.
 */
export function rigidTransformVelocity(
  previous: Readonly<Pick<IAutoMovieTransform, "translation" | "rotation">>,
  current: Readonly<Pick<IAutoMovieTransform, "translation" | "rotation">>,
  elapsedSeconds: number,
): {
  /** WORLD translation secant, metres per second. */
  linear: IAutoMovieVector3;

  /** Principal WORLD rotation increment divided by time, radians per second. */
  angular: IAutoMovieVector3;
} {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0)
    throw new RangeError("Rigid velocity requires positive finite seconds");

  const admission: ViolationCollector = new ViolationCollector();
  for (const frame of [previous, current]) {
    admission.finiteVector(
      "translation",
      frame.translation,
      "WORLD translation",
    );
    if (
      ![
        frame.rotation.x,
        frame.rotation.y,
        frame.rotation.z,
        frame.rotation.w,
      ].every(Number.isFinite)
    )
      throw new RangeError(
        "Rigid velocity requires finite quaternion components",
      );
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
  if (
    ![...Object.values(linear), ...Object.values(angular)].every(
      Number.isFinite,
    )
  )
    throw new RangeError("Rigid velocity arithmetic is not representable");
  return { linear, angular };
}
