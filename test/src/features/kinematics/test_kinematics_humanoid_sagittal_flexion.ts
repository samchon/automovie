import { createAutoMovieStickman } from "@automovie/archetypes";
import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Quaternion,
  resolvePose,
} from "@automovie/engine";
import {
  type AutoMovieHumanoidBone,
  type IAutoMovieBone,
  type IAutoMovieJointPose,
  type IAutoMovieSkeleton,
  type IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint } from "../internal/joint";
import { material } from "../internal/material";
import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/** Metre height of the shipped figure; its rest offsets are fractions of it. */
const HEIGHT: number = 2;

/** The shipped stickman, whose rest pose is the canonical humanoid one. */
const STICKMAN: IAutoMovieSkeleton = createAutoMovieStickman({
  id: "figure",
  height: HEIGHT,
  headRadius: 0.2,
  limbRadius: 0.1,
  material: material("body"),
}).skeleton!;

/**
 * The stickman has no feet, so the ankle and toe cases add a foot at the end
 * of each shank and toes ahead of it along +Z, the canonical forward.
 */
const FOOTED: IAutoMovieSkeleton = {
  id: "figure",
  bones: [
    ...STICKMAN.bones,
    rested("leftFoot", "leftLowerLeg", { x: 0, y: -0.2 * HEIGHT, z: 0 }),
    rested("leftToes", "leftFoot", { x: 0, y: -0.03, z: 0.15 }),
    rested("rightFoot", "rightLowerLeg", { x: 0, y: -0.2 * HEIGHT, z: 0 }),
    rested("rightToes", "rightFoot", { x: 0, y: -0.03, z: 0.15 }),
  ],
};

/** The stickman's thigh length, from its knee's rest offset below the hip. */
const THIGH: number = 0.22 * HEIGHT;

const DOWN: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/**
 * Positive clinical flexion moves every sagittal joint of the canonical
 * humanoid the anatomical way under `HUMANOID_JOINT_AXES`: the figure faces +Z
 * (`HUMANOID_REST_FRAME`), so hip flexion carries the knee forward, knee
 * flexion folds the shank backward, ankle and toe dorsiflexion lift what lies
 * ahead of the joint, and spine flexion bends the trunk forward. A right-handed
 * turn of a −Y thigh about +X carries the knee toward −Z, so the hip, ankle
 * and toes need flexion about −X while the knee and spine keep +X.
 *
 * Scenarios:
 *
 * 1. Hip flexion +45 on either side puts the knee one thigh length × sin 45°
 *    ahead of the hip and × cos 45° below it; extension −20 puts it behind;
 *    flexion 0 leaves it straight below.
 * 2. Knee flexion +45 with the hip at rest points the shank backward and down.
 * 3. A seated pose, hips and knees at +90, holds the thigh forward and the
 *    shank straight down.
 * 4. Ankle dorsiflexion +15 raises the toes above their rest height and
 *    plantarflexion −30 lowers them; toe flexion +30 points the toes up.
 * 5. Spine flexion +30 carries the head forward, extension −20 back.
 * 6. Hip abduction +20 still swings the left knee toward +X, its outside, so
 *    the flexion fix leaves the frontal axis alone.
 *
 * @evidence contracts/testing.md#behavioral-verification Resolves poses on the shipped stickman, and on it with feet added, through `resolvePose` with the humanoid table and rest frames, and asserts world knee, shank, toe and head positions; a hip, ankle or toe flexion about +X, or a knee or spine flexion about −X, fails a direction check.
 * @evidence contracts/testing.md#independent-expectations Expected directions follow from the documented canonical rest frame (faces +Z, legs along −Y) and anatomy (hip flexion raises the thigh forward, the knee folds backward, dorsiflexion lifts the toes, spine flexion bends forward); the knee distances are the thigh length times sin and cos of the angle, from the rig's own rest offsets.
 * @evidence contracts/testing.md#distinguishing-cases Pairs each positive angle with its negative or zero twin, covers both legs because the sides share one axis, a combined seated pose at the ROM-legal 90 degrees, and an abduction case that must not change; arm signs are owned by the arm rest-frame tests and gait and gesture content by the motion tests.
 * @evidence contracts/testing.md#execution-ownership A unit test reached as `test_kinematics_humanoid_sagittal_flexion`, calling the archetype producer and engine forward kinematics in-process with no renderer, GPU or browser.
 */
export function test_kinematics_humanoid_sagittal_flexion(): void {
  // 1. hip flexion moves the knee forward on both sides
  for (const side of ["left", "right"] as const) {
    const hip: IAutoMovieVector3 = positionOf(STICKMAN, [], `${side}UpperLeg`);
    for (const [flexion, label] of [
      [45, "flexion"],
      [-20, "extension"],
      [0, "rest"],
    ] as const) {
      const knee: IAutoMovieVector3 = positionOf(
        STICKMAN,
        [joint(`${side}UpperLeg`, { flexion })],
        `${side}LowerLeg`,
      );
      const radians: number = (flexion * Math.PI) / 180;
      TestValidator.predicate(
        `${side} hip ${label} ${flexion} puts the knee at sin/cos of the thigh`,
        vclose(
          knee,
          {
            x: hip.x,
            y: hip.y - THIGH * Math.cos(radians),
            z: hip.z + THIGH * Math.sin(radians),
          },
          1e-9,
        ),
      );
    }
    TestValidator.predicate(
      `${side} hip flexion +45 moves the knee forward`,
      positionOf(
        STICKMAN,
        [joint(`${side}UpperLeg`, { flexion: 45 })],
        `${side}LowerLeg`,
      ).z > hip.z,
    );
  }

  // 2. knee flexion folds the shank backward
  const shank: IAutoMovieVector3 = directionOf(
    STICKMAN,
    [joint("leftLowerLeg", { flexion: 45 })],
    "leftLowerLeg",
    DOWN,
  );
  TestValidator.predicate(
    "knee flexion +45 points the shank back and down",
    vclose(shank, { x: 0, y: -Math.SQRT1_2, z: -Math.SQRT1_2 }, 1e-9),
  );

  // 3. seated: thigh forward, shank down
  for (const side of ["left", "right"] as const) {
    const seated: IAutoMovieJointPose[] = [
      joint(`${side}UpperLeg`, { flexion: 90 }),
      joint(`${side}LowerLeg`, { flexion: 90 }),
    ];
    TestValidator.predicate(
      `${side} seated thigh points forward`,
      vclose(
        directionOf(STICKMAN, seated, `${side}UpperLeg`, DOWN),
        FORWARD,
        1e-9,
      ),
    );
    TestValidator.predicate(
      `${side} seated shank hangs straight down`,
      vclose(
        directionOf(STICKMAN, seated, `${side}LowerLeg`, DOWN),
        DOWN,
        1e-9,
      ),
    );
  }

  // 4. ankle and toe dorsiflexion lift the toes
  for (const side of ["left", "right"] as const) {
    const rest: number = positionOf(FOOTED, [], `${side}Toes`).y;
    TestValidator.predicate(
      `${side} ankle dorsiflexion +15 lifts the toes`,
      positionOf(FOOTED, [joint(`${side}Foot`, { flexion: 15 })], `${side}Toes`)
        .y > rest,
    );
    TestValidator.predicate(
      `${side} ankle plantarflexion -30 lowers the toes`,
      positionOf(
        FOOTED,
        [joint(`${side}Foot`, { flexion: -30 })],
        `${side}Toes`,
      ).y < rest,
    );
    TestValidator.predicate(
      `${side} toe flexion +30 points the toes up`,
      directionOf(
        FOOTED,
        [joint(`${side}Toes`, { flexion: 30 })],
        `${side}Toes`,
        FORWARD,
      ).y > 0,
    );
  }

  // 5. spine flexion bends forward
  const head: IAutoMovieVector3 = positionOf(STICKMAN, [], "head");
  TestValidator.predicate(
    "spine flexion +30 carries the head forward",
    positionOf(STICKMAN, [joint("spine", { flexion: 30 })], "head").z > head.z,
  );
  TestValidator.predicate(
    "spine extension -20 carries the head back",
    positionOf(STICKMAN, [joint("spine", { flexion: -20 })], "head").z < head.z,
  );

  // 6. the frontal axis is unchanged
  const abducted: IAutoMovieVector3 = positionOf(
    STICKMAN,
    [joint("leftUpperLeg", { abduction: 20 })],
    "leftLowerLeg",
  );
  TestValidator.predicate(
    "left hip abduction +20 swings the knee outward to +X",
    abducted.x > positionOf(STICKMAN, [], "leftUpperLeg").x &&
      nclose(abducted.z, 0, 1e-9),
  );
}

/** Resolve one pose with the humanoid table and rest frames and read a bone. */
function resolvedOf(
  skeleton: IAutoMovieSkeleton,
  joints: IAutoMovieJointPose[],
  bone: AutoMovieHumanoidBone,
): IAutoMovieResolvedBone {
  return resolvePose(
    { skeleton: skeleton.id, root: null, joints },
    skeleton,
    HUMANOID_JOINT_AXES,
    HUMANOID_REST_FRAME,
  ).find((entry: IAutoMovieResolvedBone): boolean => entry.bone === bone)!;
}

/** A bone's world position, which is its joint. */
function positionOf(
  skeleton: IAutoMovieSkeleton,
  joints: IAutoMovieJointPose[],
  bone: AutoMovieHumanoidBone,
): IAutoMovieVector3 {
  return resolvedOf(skeleton, joints, bone).worldPosition;
}

/** Where a bone-local rest direction points in the world after the pose. */
function directionOf(
  skeleton: IAutoMovieSkeleton,
  joints: IAutoMovieJointPose[],
  bone: AutoMovieHumanoidBone,
  local: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    resolvedOf(skeleton, joints, bone).worldRotation,
    local,
  );
}

/** One unconstrained bone resting at an offset from its parent. */
function rested(
  bone: AutoMovieHumanoidBone,
  parent: AutoMovieHumanoidBone,
  translation: IAutoMovieVector3,
): IAutoMovieBone {
  return {
    bone,
    parent,
    rest: {
      translation,
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    constraint: null,
  };
}
