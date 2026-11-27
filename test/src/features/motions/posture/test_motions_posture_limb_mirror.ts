import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import {
  HumanLimbMirror
} from "../../../../../packages/motions/src/posture/internal/HumanLimbMirror";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/** Rounding of a reflected rotation. */
const ROUNDING: number = 1e-12;

/**
 * `HumanLimbMirror` is a limb's fit seen in the median plane's mirror, so a
 * left limb is solved as the right limb of its mirror image: a goal's points
 * and contact have their lateral component negated, its rotation reflected and
 * the bone it rides taken to the other side; a joint record on a side is
 * renamed to the other side with its clinical angles as they are, a midline one
 * has its lateral bend and twist negated; a pose's mirror is its own inverse; a
 * limb and a side swap.
 *
 * Scenarios:
 *
 * 1. A goal at (0.3, 1, 0.2) bent at (0.4, 1, −0.3) on the left forearm, turned 30
 *    degrees about +Y: mirrored to (−0.3, 1, 0.2) and (−0.4, 1, −0.3) on the
 *    right forearm, turned −30 about +Y.
 * 2. The left forearm's record becomes the right's with its angles; the spine's
 *    has its abduction and twist negated.
 * 3. A pose mirrored twice is the pose.
 * 4. The left arm and the right side swap.
 */
export function test_motions_posture_limb_mirror(): void {
  // 1. A goal.
  const goal: IAutoMovieHumanLimbGoal = {
    point: { x: 0.3, y: 1, z: 0.2 },
    bend: { x: 0.4, y: 1, z: -0.3 },
    rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 30),
    on: "leftLowerArm",
  };
  const mirrored: IAutoMovieHumanLimbGoal = HumanLimbMirror.goal(goal);
  const back: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    -30,
  );
  TestValidator.predicate(
    "the goal across the median plane",
    vclose(mirrored.point, { x: -0.3, y: 1, z: 0.2 }, 0) &&
      vclose(mirrored.bend, { x: -0.4, y: 1, z: -0.3 }, 0) &&
      mirrored.on === "rightLowerArm" &&
      Math.abs(
        Math.abs(
          mirrored.rotation!.x * back.x +
            mirrored.rotation!.y * back.y +
            mirrored.rotation!.z * back.z +
            mirrored.rotation!.w * back.w,
        ) - 1,
      ) <= ROUNDING,
  );

  // 2. Joint records.
  const forearm: IAutoMovieJointPose = HumanLimbMirror.joint({
    bone: "leftLowerArm",
    flexion: 40,
    abduction: 5,
    twist: -20,
  });
  const spine: IAutoMovieJointPose = HumanLimbMirror.joint({
    bone: "spine",
    flexion: 10,
    abduction: 6,
    twist: -8,
  });
  TestValidator.equals(
    "a side's record renamed, a midline one's lateral angles negated",
    [forearm, spine],
    [
      { bone: "rightLowerArm", flexion: 40, abduction: 5, twist: -20 },
      { bone: "spine", flexion: 10, abduction: -6, twist: 8 },
    ],
  );

  // 3. Its own inverse.
  const pose: IAutoMoviePose = {
    skeleton: "s",
    root: null,
    joints: [
      { bone: "leftUpperArm", flexion: 30, abduction: 20, twist: 10 },
      { bone: "chest", flexion: 5, abduction: 3, twist: 2 },
    ],
  };
  TestValidator.equals(
    "mirrored twice, the pose",
    HumanLimbMirror.pose(HumanLimbMirror.pose(pose)).joints,
    pose.joints,
  );

  // 4. Limbs and sides.
  TestValidator.equals(
    "the other limb and side",
    [
      HumanLimbMirror.limb("leftArm"),
      HumanLimbMirror.limb("rightLeg"),
      HumanLimbMirror.side("right"),
    ],
    ["rightArm", "leftLeg", "left"],
  );
}
