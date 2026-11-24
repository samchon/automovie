import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  resolvePose,
} from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMoviePose,
  type IAutoMovieResolvedBone,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../../../internal/namedFacts";
import { nclose } from "../../../internal/nclose";

/**
 * The engine's named clinical-angle convention on a code-authored T-pose rig.
 * Its lengths and identity rest rotations are conventional test inputs, not
 * primary anatomical measurements or observations of a rendered Human figure.
 *
 * The stickman arm rests in a T-pose: the upper arm carries an **identity**
 * rest rotation and points down its parent's +x (a horizontal arm), the forearm
 * and hand continue along +x. Under that geometry the humanoid abduction axis
 * swings the +x arm through the vertical plane, so rig `+90` lifts the **left**
 * hand overhead while rig `−90` drops it, and the mirror holds on the right.
 * The whole point of {@link HUMANOID_REST_FRAME} (left `sign +1 neutral 90`,
 * right `sign −1 neutral 90`) is to erase that per-side sign: in **clinical**
 * space a single `abduction 180` raises _either_ arm overhead, `0` lets it
 * hang.
 *
 * Scenarios:
 *
 * 1. At rest each hand sits at shoulder height (the arm is horizontal).
 * 2. Read as clinical through the rest frames, `abduction 180` lifts **both**
 *    hands above the shoulders with the _same_ value (no left/right mirror),
 *    and `abduction 0` drops both below: the semantic the flip promises.
 * 3. A clinical pose resolved with the frames equals the pre-converted rig pose
 *    resolved without them (left clinical 180 ≡ rig 90; right clinical 180 ≡
 *    rig −90), tying the semantics back to the raw rig articulation.
 */
export function test_unit_engine_kinematics_arm_raise_clinical(): void {
  // A minimal T-pose-arm rig matching the stickman's arm geometry: identity rest
  // rotations, the shoulder raised off the chest, each arm reaching out along ±x.
  const bone: (
    b: AutoMovieHumanoidBone,
    parent: AutoMovieHumanoidBone | null,
    t: [number, number, number],
  ) => IAutoMovieBone = (
    b: AutoMovieHumanoidBone,
    parent: AutoMovieHumanoidBone | null,
    t: [number, number, number],
  ): IAutoMovieBone => ({
    bone: b,
    parent,
    rest: {
      translation: { x: t[0], y: t[1], z: t[2] },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    constraint: null,
  });
  const skeleton: IAutoMovieSkeleton = {
    id: "tpose-arms",
    bones: [
      bone("hips", null, [0, 0.92, 0]),
      bone("spine", "hips", [0, 0.2, 0]),
      bone("chest", "spine", [0, 0.22, 0]),
      bone("leftUpperArm", "chest", [0.17, 0.14, 0]),
      bone("leftLowerArm", "leftUpperArm", [0.29, 0, 0]),
      bone("leftHand", "leftLowerArm", [0.26, 0, 0]),
      bone("rightUpperArm", "chest", [-0.17, 0.14, 0]),
      bone("rightLowerArm", "rightUpperArm", [-0.29, 0, 0]),
      bone("rightHand", "rightLowerArm", [-0.26, 0, 0]),
    ],
  };

  const pose: (joints: IAutoMoviePose["joints"]) => IAutoMoviePose = (
    joints: IAutoMoviePose["joints"],
  ): IAutoMoviePose => ({
    skeleton: skeleton.id,
    root: null,
    joints,
  });
  const arm: (
    bone: "leftUpperArm" | "rightUpperArm",
    abduction: number,
  ) => IAutoMoviePose["joints"][number] = (
    bone: "leftUpperArm" | "rightUpperArm",
    abduction: number,
  ): IAutoMoviePose["joints"][number] => ({
    bone,
    flexion: null,
    abduction,
    twist: null,
  });
  const yOf: (
    p: IAutoMoviePose,
    b: AutoMovieHumanoidBone,
    frames?: boolean,
  ) => number = (
    p: IAutoMoviePose,
    b: AutoMovieHumanoidBone,
    frames: boolean = false,
  ): number =>
    resolvePose(
      p,
      skeleton,
      HUMANOID_JOINT_AXES,
      frames ? HUMANOID_REST_FRAME : undefined,
    ).find((r: IAutoMovieResolvedBone): boolean => r.bone === b)!.worldPosition
      .y;

  const shoulderL: number = yOf(pose([]), "leftUpperArm");
  const shoulderR: number = yOf(pose([]), "rightUpperArm");

  // 1. at rest the hands hang level with the shoulders (a horizontal T-pose arm)
  TestValidator.equals(
    "at rest each hand sits at shoulder height",
    namedFacts([
      [
        "ncloseYOfPose",
        (): boolean => nclose(yOf(pose([]), "leftHand"), shoulderL, 1e-9),
      ],
      [
        "ncloseYOfPose2",
        (): boolean => nclose(yOf(pose([]), "rightHand"), shoulderR, 1e-9),
      ],
    ]),
    { ncloseYOfPose: true, ncloseYOfPose2: true },
  );

  // 2. clinical abduction 180 raises BOTH arms overhead with the same value; 0
  //    drops both: the no-mirror semantic the flip delivers.
  const up: IAutoMoviePose = pose([
    arm("leftUpperArm", 180),
    arm("rightUpperArm", 180),
  ]);
  TestValidator.equals(
    "clinical abduction 180 lifts both hands overhead (same value, no mirror)",
    namedFacts([
      [
        "yOfUpLeftHand",
        (): boolean => yOf(up, "leftHand", true) > shoulderL + 0.3,
      ],
      [
        "yOfUpRightHand",
        (): boolean => yOf(up, "rightHand", true) > shoulderR + 0.3,
      ],
    ]),
    { yOfUpLeftHand: true, yOfUpRightHand: true },
  );
  const down: IAutoMoviePose = pose([
    arm("leftUpperArm", 0),
    arm("rightUpperArm", 0),
  ]);
  TestValidator.equals(
    "clinical abduction 0 lets both hands hang below the shoulders",
    namedFacts([
      [
        "yOfDownLeftHand",
        (): boolean => yOf(down, "leftHand", true) < shoulderL - 0.3,
      ],
      [
        "yOfDownRightHand",
        (): boolean => yOf(down, "rightHand", true) < shoulderR - 0.3,
      ],
    ]),
    { yOfDownLeftHand: true, yOfDownRightHand: true },
  );

  // 3. the clinical read equals the pre-converted rig pose (left 180 ≡ rig 90,
  //    right 180 ≡ rig −90): the rest frame is exactly that per-side remap.
  TestValidator.predicate(
    "left clinical 180 resolves to the same height as raw rig 90",
    nclose(
      yOf(pose([arm("leftUpperArm", 180)]), "leftHand", true),
      yOf(pose([arm("leftUpperArm", 90)]), "leftHand"),
      1e-9,
    ),
  );
  TestValidator.predicate(
    "right clinical 180 resolves to the same height as raw rig −90",
    nclose(
      yOf(pose([arm("rightUpperArm", 180)]), "rightHand", true),
      yOf(pose([arm("rightUpperArm", -90)]), "rightHand"),
      1e-9,
    ),
  );
}
