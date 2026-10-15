import {
  type IAutoMovieMotionSample,
  type IAutoMovieResolvedBone,
  Quaternion,
  resolveLookAt,
  resolvePose,
  validatePose,
} from "@automovie/engine";
import {
  AutoMovieExpressionPreset,
  AutoMovieHumanoidBone,
  IAutoMovieBlendshapeChannel,
  IAutoMovieBone,
  IAutoMovieExpression,
  IAutoMovieJointPose,
  IAutoMovieLookAt,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint, makePose } from "../internal/fixtures";
import { nclose } from "../internal/nclose";

const LOOK_AT: IAutoMovieLookAt.IBone = {
  type: "bone",
  horizontalInner: 20,
  horizontalOuter: 30,
  verticalDown: 25,
  verticalUp: 15,
};

const DEGREE: number = Math.PI / 180;

/**
 * Pins how a bone gaze turns the eye joints: which channels move which eye,
 * along which clinical axis and sign, by how much, and what is left on the
 * expression.
 *
 * The rig is synthetic: a head with two eye bones at identity rest, declaring
 * no axes, so the default basis applies (flexion about X, twist about Y) and
 * each eye looks along +Z. The ranges are test inputs.
 *
 * Scenarios:
 *
 * 1. `lookLeft` at full intensity turns the left eye 30 degrees outward and the
 *    right eye 20 degrees inward, both toward +X, the model's left.
 * 2. `lookRight` at half intensity turns the left eye 10 degrees inward and the
 *    right eye 15 degrees outward, both toward −X.
 * 3. `lookDown` turns both eyes 25 degrees down (−Y), `lookUp` 15 up.
 * 4. A listed `eyeLookOutLeft` 0.5 replaces the preset's left-eye weight while
 *    the right eye keeps it; the gaze preset becomes `neutral`, the eye
 *    channels leave the list and `jawOpen` stays.
 * 5. A gaze adds to the angles the pose authors on an eye and keeps its
 *    abduction.
 * 6. The sample is returned unchanged for no lookAt, an expression lookAt, a
 *    null expression and an expression without gaze; a zero-weight gaze adds
 *    no eye joint.
 * 7. The default range of motion admits a horizontal gaze on the eyes' twist
 *    and refuses an eye roll on their abduction.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs resolveLookAt on sampled poses and resolves them, asserting eye joint angles, world gaze directions, the stripped expression and identity returns, plus validatePose on the default eye rows; a swapped eye, axis, sign or inner/outer range, a lost blendshape override or a gaze left on the morphs fails.
 * @evidence contracts/testing.md#independent-expectations Expected angles are the declared ranges times the channel weights, and directions follow from right-hand turns of +Z about +X (down) and +Y (toward +X); ROM expectations come from the default eye row's twist and null abduction. The ranges are arbitrary test inputs, not anatomy.
 * @evidence contracts/testing.md#distinguishing-cases Covers all four directions on both eyes, partial intensity, blendshape override, authored eye angles, every identity return and the zero-weight boundary, and ROM admission positive and negative; morph application and lookAt admission belong to the viewer and model-validation entries.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous kinematics unit entry over an in-memory rig, calling engine source without a viewer, GPU or installed asset.
 */
export function test_kinematics_look_at(): void {
  // 1. look left: left eye outward 30, right eye inward 20, both to +X
  const left: IAutoMovieMotionSample = gaze("lookLeft", 1);
  TestValidator.equals("look left turns", turns(left), {
    leftEye: [0, 30],
    rightEye: [0, 20],
  });
  TestValidator.predicate(
    "look left points both eyes to +X by their turns",
    nclose(yaw(left, "leftEye"), 30, 1e-9) &&
      nclose(yaw(left, "rightEye"), 20, 1e-9),
  );

  // 2. look right at half intensity: left eye inward 10, right eye outward 15
  const right: IAutoMovieMotionSample = gaze("lookRight", 0.5);
  TestValidator.equals("look right turns", turns(right), {
    leftEye: [0, -10],
    rightEye: [0, -15],
  });
  TestValidator.predicate(
    "look right points both eyes to −X",
    nclose(yaw(right, "leftEye"), -10, 1e-9) &&
      nclose(yaw(right, "rightEye"), -15, 1e-9),
  );

  // 3. down and up
  const down: IAutoMovieMotionSample = gaze("lookDown", 1);
  const up: IAutoMovieMotionSample = gaze("lookUp", 1);
  TestValidator.equals(
    "look down and up turns",
    [turns(down), turns(up)],
    [
      { leftEye: [25, 0], rightEye: [25, 0] },
      { leftEye: [-15, 0], rightEye: [-15, 0] },
    ],
  );
  TestValidator.predicate(
    "look down points below, look up above",
    nclose(pitch(down, "leftEye"), -25, 1e-9) &&
      nclose(pitch(down, "rightEye"), -25, 1e-9) &&
      nclose(pitch(up, "leftEye"), 15, 1e-9) &&
      nclose(pitch(up, "rightEye"), 15, 1e-9),
  );

  // 4. a listed channel overrides the preset; gaze leaves the expression
  const overridden: IAutoMovieMotionSample = gaze("lookLeft", 1, [
    { channel: "eyeLookOutLeft", weight: 0.5 },
    { channel: "jawOpen", weight: 0.3 },
  ]);
  TestValidator.equals("override turns", turns(overridden), {
    leftEye: [0, 15],
    rightEye: [0, 20],
  });
  TestValidator.equals("gaze leaves the expression", overridden.expression, {
    preset: "neutral",
    intensity: 1,
    blendshapes: [{ channel: "jawOpen", weight: 0.3 }],
  });

  // 5. adds to authored eye angles
  const authored: IAutoMovieMotionSample = resolveLookAt(
    {
      pose: makePose([joint("leftEye", { flexion: 5, abduction: 2 })]),
      expression: expression("lookDown", 1),
    },
    LOOK_AT,
  );
  TestValidator.equals(
    "authored eye angles carry the gaze",
    authored.pose.joints.find(
      (j: IAutoMovieJointPose): boolean => j.bone === "leftEye",
    ),
    { bone: "leftEye", flexion: 30, abduction: 2, twist: null },
  );

  // 6. identity returns and the zero-weight boundary
  const plain: IAutoMovieMotionSample = {
    pose: makePose([]),
    expression: expression("lookLeft", 1),
  };
  const happy: IAutoMovieMotionSample = {
    pose: makePose([]),
    expression: expression("happy", 1),
  };
  const silent: IAutoMovieMotionSample = {
    pose: makePose([]),
    expression: null,
  };
  TestValidator.equals(
    "no bone gaze returns the sample itself",
    [
      resolveLookAt(plain, undefined) === plain,
      resolveLookAt(plain, { type: "expression" }) === plain,
      resolveLookAt(silent, LOOK_AT) === silent,
      resolveLookAt(happy, LOOK_AT) === happy,
    ],
    [true, true, true, true],
  );
  TestValidator.equals(
    "a zero-weight gaze adds no eye joint",
    gaze("lookLeft", 0).pose.joints,
    [],
  );

  // 7. the default eye rows hold a horizontal gaze and refuse a roll
  TestValidator.equals(
    "default ROM admits the gaze and refuses an eye roll",
    [
      validatePose({ pose: left.pose, skeleton: RIG }).items.length,
      validatePose({
        pose: makePose([joint("leftEye", { abduction: 5 })]),
        skeleton: RIG,
      }).items.length > 0,
    ],
    [0, true],
  );
}

/** A head with two eyes at identity rest, declaring no axes. */
const RIG: IAutoMovieSkeleton = {
  id: "skeleton-1",
  bones: (
    [
      ["hips", null, { x: 0, y: 1, z: 0 }],
      ["head", "hips", { x: 0, y: 0.6, z: 0 }],
      ["leftEye", "head", { x: 0.03, y: 0.1, z: 0.05 }],
      ["rightEye", "head", { x: -0.03, y: 0.1, z: 0.05 }],
    ] as const
  ).map(
    ([bone, parent, translation]: readonly [
      AutoMovieHumanoidBone,
      AutoMovieHumanoidBone | null,
      IAutoMovieVector3,
    ]): IAutoMovieBone => ({
      bone,
      parent,
      rest: {
        translation,
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
      constraint: null,
    }),
  ),
};

function expression(
  preset: AutoMovieExpressionPreset,
  intensity: number,
  blendshapes: IAutoMovieBlendshapeChannel[] | null = null,
): IAutoMovieExpression {
  return { preset, intensity, blendshapes };
}

/** Resolve a gaze preset on an empty pose through {@link LOOK_AT}. */
function gaze(
  preset: AutoMovieExpressionPreset,
  intensity: number,
  blendshapes: IAutoMovieBlendshapeChannel[] | null = null,
): IAutoMovieMotionSample {
  return resolveLookAt(
    {
      pose: makePose([]),
      expression: expression(preset, intensity, blendshapes),
    },
    LOOK_AT,
  );
}

/** Each eye's `[flexion, twist]` in the resolved sample, `0` for null. */
function turns(
  sample: IAutoMovieMotionSample,
): Record<"leftEye" | "rightEye", [number, number]> {
  const of: (bone: AutoMovieHumanoidBone) => [number, number] = (
    bone: AutoMovieHumanoidBone,
  ): [number, number] => {
    const found: IAutoMovieJointPose | undefined = sample.pose.joints.find(
      (j: IAutoMovieJointPose): boolean => j.bone === bone,
    );
    return [found?.flexion ?? 0, found?.twist ?? 0];
  };
  return { leftEye: of("leftEye"), rightEye: of("rightEye") };
}

/** The eye's world gaze direction, its rest +Z turned by the resolved pose. */
function look(
  sample: IAutoMovieMotionSample,
  bone: AutoMovieHumanoidBone,
): IAutoMovieVector3 {
  const resolved: IAutoMovieResolvedBone = resolvePose(sample.pose, RIG).find(
    (b: IAutoMovieResolvedBone): boolean => b.bone === bone,
  )!;
  return Quaternion.rotateVector(resolved.worldRotation, { x: 0, y: 0, z: 1 });
}

/** Degrees the gaze turns toward +X from +Z. */
function yaw(
  sample: IAutoMovieMotionSample,
  bone: AutoMovieHumanoidBone,
): number {
  const v: IAutoMovieVector3 = look(sample, bone);
  return Math.atan2(v.x, v.z) / DEGREE;
}

/** Degrees the gaze rises toward +Y from +Z. */
function pitch(
  sample: IAutoMovieMotionSample,
  bone: AutoMovieHumanoidBone,
): number {
  const v: IAutoMovieVector3 = look(sample, bone);
  return Math.atan2(v.y, v.z) / DEGREE;
}
