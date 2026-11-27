import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLieDown,
} from "@automovie/interface";

import { HumanHand } from "../../posture/internal/HumanHand";

/*
 * The tree climb's beat, limb groups and the holds and stances its route is
 * built from.
 */
export namespace treeClimbRouteForms {
  /*
   * Seconds per single hand or foot move (provisional).
   */
  export const BEAT: number = 0.6;

  /*
   * The names of the change groups a step expands into, by rank: holds taken,
   * feet moved, hands moved, holds let go.
   */
  export const GROUPS: readonly string[] = ["Take", "Feet", "Hands", "Release"];

  /*
   * The near and far hold on a branch, metres out from the trunk face
   * (provisional: two hands' widths apart, near the strong root).
   */
  export const HOLDS: readonly [number, number] = [0.15, 0.45];

  /*
   * The near and far foot on a branch's top, metres out from the trunk face
   * (provisional).
   */
  export const STEPS: readonly [number, number] = [0.25, 0.5];

  /*
   * The feet's heights walking up the bole, metres above its foot: a knee-high
   * and a hip-high step, at the body's own knee (the ankle's height and the
   * shank) and hip heights, so a small body's steps are its own.
   * Parameter measure: The body's measure.
   * Returns: The two heights, lower first.
   */
  export function walkHeights(
    measure: IAutoMovieMotionHumanBody["measure"],
  ): readonly [number, number] {
    return [measure.ankleHeight + measure.shank, measure.hipHeight];
  }

  /*
   * A foot's slide either side of the line facing the bole, metres
   * (provisional: the feet hip width apart).
   */
  export const SPLAY: number = 0.12;

  /*
   * A hand's slide either side on the bole when no branch is above, metres
   * (provisional: a hug's span).
   */
  export const HUG: number = 0.2;

  /*
   * The heel hook: hanging from the branch, the left leg drawn up to hook its
   * heel over it, the right foot on the bole (provisional angles, degrees).
   */
  export const HOOK: IAutoMovieMotionHumanLieDown.IPose = {
    pitch: -10,
    roll: 0,
    joints: {
      ...HumanHand.shape("left", "fist"),
      ...HumanHand.shape("right", "fist"),
      leftUpperLeg: [120, 10, 0],
      rightUpperLeg: [60, 5, 0],
      leftLowerLeg: [110, 0, 0],
      rightLowerLeg: [80, 0, 0],
      leftUpperArm: [160, 15, 0],
      rightUpperArm: [160, 15, 0],
      leftLowerArm: [40, 0, 0],
      rightLowerArm: [40, 0, 0],
    },
  };

  /*
   * The astride sitting pose: the thighs spread over the branch, the shins
   * hanging, the hands forward on it (provisional).
   */
  export const ASTRIDE: IAutoMovieMotionHumanLieDown.IPose = {
    pitch: 10,
    roll: 0,
    joints: {
      ...HumanHand.shape("left", "fist"),
      ...HumanHand.shape("right", "fist"),
      leftUpperLeg: [70, 30, 0],
      rightUpperLeg: [70, 30, 0],
      leftLowerLeg: [80, 0, 0],
      rightLowerLeg: [80, 0, 0],
      leftUpperArm: [60, 10, 0],
      rightUpperArm: [60, 10, 0],
      leftLowerArm: [20, 0, 0],
      rightLowerArm: [20, 0, 0],
    },
  };
}
