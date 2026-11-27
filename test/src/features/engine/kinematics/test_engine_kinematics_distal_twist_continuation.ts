import { AutoMovieEngineQuaternion, AutoMovieEngineMotionDistalTwist } from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * A wrist held at identity leaves its lower joint to turn about Z. For the
 * demand Rz(a) Ry(b) and lower twist t, the residual angle is
 * 2 acos(cos((a - t) / 2) cos(b / 2)). Projecting the prior twist of zero into
 * the residual band therefore gives max(0, a - d), where d yields a residual
 * of b + 1e-6 radians.
 *
 * Scenarios:
 *
 * 1. A demand just inside the band keeps the prior twist.
 * 2. A demand just outside moves to the admitted side of the crossing within
 *    the bracket width. The residual derivative is bounded by
 *    sin(a / 2) / sin(b / 2) in radians, which converts the bracket width to
 *    a residual allowance. Near d the derivative is at least
 *    sin(d / 4) cos(b / 2), which converts residual roundoff back to twist.
 * 3. The paired demand is Rz(a - t) Ry(b) and the projected wrist is identity.
 *    The two quaternion products and angle reads allow 64 binary64 rounding
 *    units in radians.
 */
export function test_engine_kinematics_distal_twist_continuation(): void {
  const degrees: number = 180 / Math.PI;
  const tilt: number = 0.277;
  const error: number = 1e-6;
  const d: number =
    4 *
    Math.asin(
      Math.sqrt(
        (Math.sin(tilt / 2 + error / 4) * Math.sin(error / 4)) /
          Math.cos(tilt / 2),
      ),
    ) *
    degrees;
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const axes: IAutoMovieJointAxes = {
    flexion: { x: 1, y: 0, z: 0 },
    abduction: { x: 0, y: 1, z: 0 },
    twist: { x: 0, y: 0, z: 1 },
  };
  const hand: IAutoMovieJointPose = {
    bone: "rightHand",
    flexion: 0,
    abduction: 0,
    twist: 0,
  };
  const fit = (a: number): AutoMovieEngineMotionDistalTwist.IResult =>
    AutoMovieEngineMotionDistalTwist.withProjection({
      joint: { ...hand, bone: "rightLowerArm" },
      effector: hand,
      above: identity,
      lowerBasis: { ...axes, twistPlacement: "distal" },
      lowerFrame: undefined,
      effectorRest: identity,
      effectorBasis: axes,
      effectorFrame: undefined,
      rotation: AutoMovieEngineQuaternion.multiply(
        AutoMovieEngineQuaternion.fromAxisAngle(axes.twist, a),
        AutoMovieEngineQuaternion.fromAxisAngle(axes.abduction, tilt * degrees),
      ),
      skeleton: { id: "fixed-wrist", bones: [] },
      reference: 0,
      clamps: {
        lower: (joint: IAutoMovieJointPose): IAutoMovieJointPose => ({
          ...joint,
          twist: Math.max(-90, Math.min(90, joint.twist ?? 0)),
        }),
        effector: (): IAutoMovieJointPose => hand,
      },
      projectEffector: (): IAutoMovieJointPose => hand,
    });
  const excess: number = 0.001;
  const outsideTurn: number = d + excess;
  const bracketDegrees: number = error * degrees;
  const angleRoundoff: number = 64 * Number.EPSILON;
  const slopeFloor: number =
    Math.sin(d / (4 * degrees)) * Math.cos(tilt / 2);
  const twistRoundoff: number = (angleRoundoff * degrees) / slopeFloor;
  const residualSlope: number =
    Math.sin(outsideTurn / (2 * degrees)) / Math.sin(tilt / 2);
  const residualTolerance: number = residualSlope * error + angleRoundoff;
  const inside: AutoMovieEngineMotionDistalTwist.IResult = fit(d - excess);
  const outside: AutoMovieEngineMotionDistalTwist.IResult = fit(outsideTurn);
  const selected: number = outside.joint.twist ?? 0;
  const demand: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
    AutoMovieEngineQuaternion.fromAxisAngle(axes.twist, outsideTurn - selected),
    AutoMovieEngineQuaternion.fromAxisAngle(axes.abduction, tilt * degrees),
  );

  TestValidator.predicate(
    "keep the prior twist within the band",
    inside.joint.twist === 0,
  );
  TestValidator.predicate(
    "move only to the feasible edge",
    selected >= excess - twistRoundoff &&
      selected <= excess + bracketDegrees + twistRoundoff &&
      nclose(
        AutoMovieEngineQuaternion.angleAfterNormalize(
          outside.projection.local,
          outside.projection.quaternion,
        ),
        tilt + error,
        residualTolerance,
      ),
  );
  TestValidator.predicate(
    "pair the selected lower twist with its actual wrist demand",
    nclose(
      AutoMovieEngineQuaternion.angleAfterNormalize(outside.projection.local, demand),
      0,
      angleRoundoff,
    ) &&
      nclose(
        AutoMovieEngineQuaternion.angleAfterNormalize(outside.projection.quaternion, identity),
        0,
        angleRoundoff,
      ),
  );
}
