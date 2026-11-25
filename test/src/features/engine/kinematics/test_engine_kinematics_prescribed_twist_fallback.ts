import {
  Quaternion,
  fitSeededChainToTarget,
  indexSkeletonTopology,
} from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieSeededChainFit,
  IAutoMovieSkeleton,
  IAutoMovieSwivelNear,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * An obstruction sends a prescribed hinged arm to its continued orientation
 * fit. The arm starts straight on +Z, with a fixed shoulder and wrist. The
 * demand is Rz(a) Ry(b) and only the lower joint can turn about Z.
 *
 * Scenarios:
 *
 * 1. The prescribed zero twist survives obstruction. For the fixed wrist the
 *    residual at zero exceeds its minimum by at most
 *    a² / (4 sin(b / 2)), below the 1e-6 radian continuation band for
 *    a = 0.02 degrees and b = 0.277 radians. The fallback emits its orientation.
 * 2. Omitting the seed's twist takes the demand's Z share, a, from the same
 *    blocked prescription. The clinical read allows 64 binary64 rounding
 *    units in radians for the quaternion products and conversions.
 */
export function test_engine_kinematics_prescribed_twist_fallback(): void {
  const axes: IAutoMovieJointAxes = {
    flexion: { x: 1, y: 0, z: 0 },
    abduction: { x: 0, y: 1, z: 0 },
    twist: { x: 0, y: 0, z: 1 },
  };
  const fixed: IAutoMovieJointConstraint = {
    flexion: null,
    abduction: null,
    twist: null,
  };
  const rest = (z: number): IAutoMovieTransform => ({
    translation: { x: 0, y: 0, z },
    rotation: Quaternion.identity(),
    scale: { x: 1, y: 1, z: 1 },
  });
  const skeleton: IAutoMovieSkeleton = {
    id: "prescribed-twist-fallback",
    bones: [
      {
        bone: "rightUpperArm",
        parent: null,
        rest: rest(0),
        constraint: fixed,
      },
      {
        bone: "rightLowerArm",
        parent: "rightUpperArm",
        rest: rest(1),
        constraint: {
          flexion: { min: 0, max: 135 },
          abduction: null,
          twist: { min: -90, max: 90 },
        },
      },
      {
        bone: "rightHand",
        parent: "rightLowerArm",
        rest: rest(1),
        constraint: fixed,
      },
    ],
  };
  const degrees: number = 180 / Math.PI;
  const turn: number = 0.02;
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.fromAxisAngle(axes.twist, turn),
    Quaternion.fromAxisAngle(axes.abduction, 0.277 * degrees),
  );
  const fit: fitSeededChainToTarget.IWorkspace = fitSeededChainToTarget.prepare({
    skeleton,
    pose: { skeleton: skeleton.id, root: null, joints: [] },
    chain: {
      upper: "rightUpperArm",
      lower: "rightLowerArm",
      effector: "rightHand",
    },
    topology: indexSkeletonTopology(skeleton),
    jointAxes: {
      rightUpperArm: axes,
      rightLowerArm: { ...axes, twistPlacement: "distal" },
      rightHand: axes,
    },
    effectorRotation: rotation,
    obstruction: (): number => 1,
  });
  const target: IAutoMovieVector3 = { x: 0, y: 0, z: 2 };
  const placed: IAutoMovieSwivelNear = {
    swivel: 0,
    branch: 0,
    tolerance: 0.01,
    prescribed: true,
  };
  const twist = (result: IAutoMovieSeededChainFit): number | null | undefined =>
    result.pose.joints.find(
      (joint: IAutoMovieJointPose): boolean => joint.bone === "rightLowerArm",
    )?.twist;

  let reads: number = 0;
  const continued: IAutoMovieSeededChainFit = fit.fit(
    target,
    { ...placed, twist: 0 },
    undefined,
    (): void => {
      ++reads;
    },
  );
  TestValidator.predicate(
    "the obstructed prescription still orients from the zero reference",
    reads === 1 && twist(continued) === 0,
  );

  const cold: number | null | undefined = twist(fit.fit(target, placed));
  const roundoff: number = 64 * Number.EPSILON * degrees;
  TestValidator.predicate(
    "no reference takes the full axial share of the demand",
    cold !== null && cold !== undefined && nclose(cold, turn, roundoff),
  );
}
