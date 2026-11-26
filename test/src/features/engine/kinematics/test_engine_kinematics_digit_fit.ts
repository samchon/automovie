import { AutoMovieEngineKinematics, HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME, Quaternion, Vector3, curlChainUntilContact } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieFitDigitToTarget,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { throwsError } from "../../internal/throwsError";

/**
 * Digit kinematics on the humanoid hand: `fitDigitToTarget` puts a point of the
 * distal phalanx on a world point with the digit's own joints, and
 * `curlChainUntilContact` closes a chain proximal first until a phalanx touches
 * a collider or its range stops it.
 *
 * Fixture: the average adult's left index finger (proximal, intermediate,
 * distal), read with the humanoid axes and rest frames; the effector is the
 * distal joint; the target T is where the finger flexed (30, 20, 10) puts it.
 *
 * Scenarios:
 *
 * 1. From rest, the fit reaches T within 1e-5 m and reports that residual.
 * 2. No joints and a zero rate are refused.
 * 3. With no collider the curl flexes every joint, the gap positive.
 * 4. A 0.2 m sphere on the finger's base keeps the chain where it is, the gap not
 *    positive; a zero step is refused.
 */
export async function test_engine_kinematics_digit_fit(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const skeleton = body.skeleton;
  const jointAxes = AutoMovieEngineKinematics.skeletonJointAxes(skeleton, HUMANOID_JOINT_AXES);
  const bones: AutoMovieHumanoidBone[] = [
    "leftIndexProximal",
    "leftIndexIntermediate",
    "leftIndexDistal",
  ];
  const rest: IAutoMoviePose = {
    skeleton: skeleton.id,
    root: null,
    joints: [],
  };
  const world = (
    pose: IAutoMoviePose,
    name: AutoMovieHumanoidBone,
  ): IAutoMovieResolvedBone =>
    AutoMovieEngineKinematics.resolvePose(pose, skeleton, jointAxes, HUMANOID_REST_FRAME).find(
      (b: IAutoMovieResolvedBone): boolean => b.bone === name,
    )!;
  const flexed: IAutoMoviePose = {
    ...rest,
    joints: bones.map((bone: AutoMovieHumanoidBone, i: number) => ({
      bone,
      flexion: [30, 20, 10][i]!,
      abduction: null,
      twist: null,
    })),
  };
  const T: IAutoMovieVector3 = world(flexed, "leftIndexDistal").worldPosition;
  const input: IAutoMovieFitDigitToTarget.IInput = {
    skeleton,
    pose: rest,
    bones,
    effector: {
      bone: "leftIndexDistal",
      point: { x: 0, y: 0, z: 0 },
      normal: { x: 0, y: 1, z: 0 },
    },
    target: T,
    jointAxes,
    restFrames: HUMANOID_REST_FRAME,
  };

  // 1.
  const fitted = AutoMovieEngineKinematics.fitDigitToTarget(input);
  TestValidator.predicate(
    "reached",
    fitted.residual <= 1e-5 &&
      Math.abs(Vector3.distance(fitted.point, T) - fitted.residual) <= 1e-12,
  );

  // 2.
  TestValidator.predicate(
    "no joints",
    throwsError(
      (): unknown => AutoMovieEngineKinematics.fitDigitToTarget({ ...input, bones: [] }),
      "needs the digit's joints",
    ),
  );
  TestValidator.predicate(
    "rate",
    throwsError(
      (): unknown => AutoMovieEngineKinematics.fitDigitToTarget({ ...input, rate: 0 }),
      "rate must be finite and positive",
    ),
  );

  // 3.
  const chain = { bones, tip: { x: 0, y: 0, z: 0 }, radius: 0.008 };
  const free = curlChainUntilContact({
    skeleton,
    pose: rest,
    chains: [chain],
    colliders: [],
    jointAxes,
    restFrames: HUMANOID_REST_FRAME,
  });
  TestValidator.predicate(
    "free curl",
    free.chains[0]!.flexion.every((f: number): boolean => f > 0) &&
      free.chains[0]!.gap > 0,
  );

  // 4.
  const base: IAutoMovieVector3 = world(
    rest,
    "leftIndexProximal",
  ).worldPosition;
  const blocked = curlChainUntilContact({
    skeleton,
    pose: rest,
    chains: [chain],
    colliders: [
      {
        shape: {
          id: "ball",
          material: "default",
          transform: {
            position: { x: 0, y: 0, z: 0 },
            rotation: Quaternion.identity(),
          },
          kind: "sphere",
          radius: 0.2,
        },
        frame: { position: base, rotation: Quaternion.identity() },
      },
    ],
    jointAxes,
    restFrames: HUMANOID_REST_FRAME,
  });
  TestValidator.predicate(
    "blocked",
    blocked.chains[0]!.flexion.every((f: number): boolean => f === 0) &&
      blocked.chains[0]!.gap <= 0,
  );
  TestValidator.predicate(
    "step",
    throwsError(
      (): unknown =>
        curlChainUntilContact({
          skeleton,
          pose: rest,
          chains: [chain],
          colliders: [],
          step: 0,
        }),
      "curl step must be positive",
    ),
  );
}
