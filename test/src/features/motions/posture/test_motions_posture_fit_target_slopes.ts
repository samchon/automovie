import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanFitTargetSlopes
} from "../../../../../packages/motions/src/posture/internal/HumanFitTargetSlopes";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/** Central differences' step, radians. */
const STEP: number = 1e-5;

/** Central differences' error, O(STEP²) plus rounding over STEP. */
const DIFFERENCE: number = 1e-8;

/** A rotation vector's quaternion, `Exp`. */
function exp(v: IAutoMovieVector3): IAutoMovieQuaternion {
  const angle: number = AutoMovieEngineVector3.length(v);
  if (angle === 0) return { x: 0, y: 0, z: 0, w: 1 };
  return AutoMovieEngineQuaternion.fromAxisAngle(
    AutoMovieEngineVector3.scale(v, 1 / angle),
    (angle * 180) / Math.PI,
  );
}

/** A quaternion's rotation vector, `Log`, on the short arc. */
function log(q: IAutoMovieQuaternion): IAutoMovieVector3 {
  const s: number = q.w < 0 ? -1 : 1;
  const v: IAutoMovieVector3 = { x: s * q.x, y: s * q.y, z: s * q.z };
  const sine: number = AutoMovieEngineVector3.length(v);
  return sine === 0
    ? v
    : AutoMovieEngineVector3.scale(v, (2 * Math.atan2(sine, s * q.w)) / sine);
}

/** A twist with an angular part only. */
function twist(
  angular: IAutoMovieVector3,
): IAutoMovieMotionHumanJacobian.ITwist {
  return { angular, linear: { x: 0, y: 0, z: 0 } };
}

/**
 * `HumanFitTargetSlopes` differentiates a body fit's angular targets.
 * `rotation` is the inverse right Jacobian of SO(3) applied to each motion
 * (Sola et al. 2018, equation 146), `I + ½[e]× + (1/θ² − 1/(2θ
 * tan(θ/2)))[e]×²`, so `Log(Exp(e) Exp(h ω)) ≈ e + h J_r⁻¹(e) ω`, with the
 * series `1/12 + θ²/720` near zero; `normal` is the derivative of the least
 * turn `θ · (w × n)/|w × n|` from the goal normal `w` to the effector's `n` as
 * `n` turns by `ω × n`, the component of `ω` across `w` where the normals
 * agree, and refused where they are opposite.
 *
 * Scenarios:
 *
 * 1. At e = (0.3, −0.5, 0.8) the slopes of two motions match central differences
 *    of `Log(Exp(e) Exp(h ω))`; at e = (1e-5, 0, 0) on the series too.
 * 2. A motion along e is returned as it is.
 * 3. The goal normal +Y and the effector's local +Y turned 40 degrees about +Z:
 *    the slopes match central differences of the least turn.
 * 4. Agreeing normals give ω less its part along w; opposite normals are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the derivative of angular residuals for target rotation and normal, including agreeing and opposite directions.
 * @evidence contracts/development/testing.md#behavioral-verification Compares direct rotational and normal slopes with small central perturbations for compound and near-zero inputs.
 * @evidence contracts/development/testing.md#independent-expectations Lie-group log/exp differences independently predict each derivative. On the desired normal the parallel angular component vanishes and opposite normals refuse.
 */
export function test_motions_posture_fit_target_slopes(): void {
  const motions: IAutoMovieMotionHumanJacobian.ITwist[] = [
    twist({ x: 1, y: 0.2, z: -0.4 }),
    twist({ x: -0.3, y: 0.9, z: 0.5 }),
  ];

  // 1 and 2. The inverse right Jacobian.
  const matches = (e: IAutoMovieVector3): boolean =>
    HumanFitTargetSlopes.rotation(e, motions).every(
      (slope: IAutoMovieVector3, k: number): boolean => {
        const omega: IAutoMovieVector3 = motions[k]!.angular;
        const at = (h: number): IAutoMovieVector3 =>
          log(AutoMovieEngineQuaternion.multiply(exp(e), exp(AutoMovieEngineVector3.scale(omega, h))));
        return vclose(
          slope,
          AutoMovieEngineVector3.scale(AutoMovieEngineVector3.subtract(at(STEP), at(-STEP)), 1 / (2 * STEP)),
          DIFFERENCE,
        );
      },
    );
  const e: IAutoMovieVector3 = { x: 0.3, y: -0.5, z: 0.8 };
  TestValidator.predicate(
    "the inverse right Jacobian",
    matches(e) &&
      matches({ x: 1e-5, y: 0, z: 0 }) &&
      vclose(HumanFitTargetSlopes.rotation(e, [twist(e)])[0]!, e, 1e-15) &&
      HumanFitTargetSlopes.rotation(e, []).length === 0,
  );

  // 3. The least turn.
  const goal: NonNullable<IAutoMovieMotionHumanBodyFitTypes.ITarget["normal"]> =
    {
      world: { x: 0, y: 1, z: 0 },
      local: { x: 0, y: 1, z: 0 },
    };
  const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
    { x: 0, y: 0, z: 1 },
    40,
  );
  const turn = (q: IAutoMovieQuaternion): IAutoMovieVector3 => {
    const n: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(q, goal.local);
    const c: IAutoMovieVector3 = AutoMovieEngineVector3.cross(goal.world, n);
    const sine: number = AutoMovieEngineVector3.length(c);
    return AutoMovieEngineVector3.scale(
      c,
      Math.atan2(sine, AutoMovieEngineVector3.dot(goal.world, n)) / sine,
    );
  };
  TestValidator.predicate(
    "the least turn's slopes",
    HumanFitTargetSlopes.normal(goal, rotation, motions).every(
      (slope: IAutoMovieVector3, k: number): boolean => {
        const omega: IAutoMovieVector3 = motions[k]!.angular;
        const at = (h: number): IAutoMovieVector3 =>
          turn(AutoMovieEngineQuaternion.multiply(exp(AutoMovieEngineVector3.scale(omega, h)), rotation));
        return vclose(
          slope,
          AutoMovieEngineVector3.scale(AutoMovieEngineVector3.subtract(at(STEP), at(-STEP)), 1 / (2 * STEP)),
          DIFFERENCE,
        );
      },
    ),
  );

  // 4. Agreeing and opposite normals.
  const flat: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  TestValidator.predicate(
    "agreeing normals, and opposite ones refused",
    vclose(
      HumanFitTargetSlopes.normal(goal, flat, motions)[0]!,
      { x: 1, y: 0, z: -0.4 },
      1e-15,
    ) &&
      throwsError(
        (): unknown =>
          HumanFitTargetSlopes.normal(
            goal,
            AutoMovieEngineQuaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 180),
            motions,
          ),
        "non-antiparallel",
      ),
  );
}
