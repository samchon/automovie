import { HumanSupportContacts } from "../HumanSupportContacts";
import type { IAutoMovieMotionHumanSupport } from "@automovie/interface";

export namespace HumanSupportSlideOffData {
  export const { FEET, on } = HumanSupportContacts;

  /*
   * Seated upright on a surface: the hip and the knee at a right angle, the
   * seated reference posture (ANSI/HFES 100-2007), the arms left to hang as the
   * body's relaxed arms, which the support planner lays under every stated
   * posture.
   */
  export const SEATED: IAutoMovieMotionHumanSupport.IStance["prefer"] = {
    pitch: 0,
    roll: 0,
    joints: {
      leftUpperLeg: [90, 0, 0],
      rightUpperLeg: [90, 0, 0],
      leftLowerLeg: [90, 0, 0],
      rightLowerLeg: [90, 0, 0],
    },
  };
}
