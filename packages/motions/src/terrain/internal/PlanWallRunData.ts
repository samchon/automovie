import type { IAutoMovieMotionHumanLieDown } from "@automovie/interface";
import { HumanHand } from "../../posture/internal/HumanHand";

export namespace PlanWallRunData {
  /*
   * How far from the wall's face the take-off foot plants, hip heights
   * (provisional: a step in, under half a leg).
   */
  export const STEP_IN: number = 0.45;

  /*
   * The first wall step's toe height, hip heights (provisional: a running step
   * planted about knee high).
   */
  export const FIRST: number = 0.55;

  /*
   * The second wall step's toe height, hip heights (provisional).
   */
  export const SECOND: number = 1.05;

  /*
   * The toe joint's distance off the face, metres (provisional: the sole's
   * thickness ahead of the joint).
   */
  export const SOLE: number = 0.03;

  /*
   * The toes' depth below the hands that grip the top in a hang on the face,
   * statures (provisional: the body near straight along the wall, its arms
   * bent).
   */
  export const HANG: number = 0.95;

  /*
   * Stepping in and onto the wall: the arms carried forward and out from the
   * hips, clear of the thigh the stepping leg raises and of each other
   * (provisional angles, degrees).
   */
  export const STEPPING: IAutoMovieMotionHumanLieDown.IPose = {
    pitch: 0,
    roll: 0,
    joints: {
      leftUpperArm: [30, 25, 0],
      rightUpperArm: [30, 25, 0],
      leftLowerArm: [40, 0, 0],
      rightLowerArm: [40, 0, 0],
    },
  };

  /*
   * Hanging from the top: the arms up and out over the head, the elbows a little
   * bent and clear of it, the fists closed on the edge and the legs hanging
   * (provisional angles, degrees).
   */
  export const HANGING: IAutoMovieMotionHumanLieDown.IPose = {
    pitch: 0,
    roll: 0,
    joints: {
      ...HumanHand.shape("left", "fist"),
      ...HumanHand.shape("right", "fist"),
      leftUpperArm: [160, 30, 0],
      rightUpperArm: [160, 30, 0],
      leftLowerArm: [20, 0, 0],
      rightLowerArm: [20, 0, 0],
      leftUpperLeg: [15, 5, 0],
      rightUpperLeg: [15, 5, 0],
      leftLowerLeg: [20, 0, 0],
      rightLowerLeg: [20, 0, 0],
    },
  };

  /*
   * The cat hang: hanging from the top with both feet drawn up onto the face
   * (provisional angles, degrees).
   */
  export const CAT: IAutoMovieMotionHumanLieDown.IPose = {
    ...HANGING,
    joints: {
      ...HANGING.joints,
      leftUpperLeg: [70, 10, 0],
      rightUpperLeg: [70, 10, 0],
      leftLowerLeg: [90, 0, 0],
      rightLowerLeg: [90, 0, 0],
    },
  };

  /*
   * Static friction of a shoe sole on a wall, dimensionless (provisional: rubber
   * on concrete).
   */
  export const FRICTION: number = 0.8;

  /*
   * Seconds per support change (provisional: a running wall step).
   */
  export const BEAT: number = 0.35;

  /*
   * Seconds the opening stance holds both feet where they stand (provisional: the
   * edge rescue's own opening stance).
   */
  export const SET: number = 0.3;
}
