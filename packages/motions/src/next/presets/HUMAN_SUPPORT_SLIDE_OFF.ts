import type { IAutoMovieMotionHumanSupport } from "@automovie/interface";

import { getUp } from "../../floor/getUp";
import { HumanSupportContacts } from "./HumanSupportContacts";

const { FEET, on } = HumanSupportContacts;

/**
 * Seated upright on a surface: the hip and the knee at a right angle, the
 * seated reference posture (ANSI/HFES 100-2007), the arms left to hang as the
 * body's relaxed arms, which the support planner lays under every stated
 * posture.
 */
const SEATED: IAutoMovieMotionHumanSupport.IStance["prefer"] = {
  pitch: 0,
  roll: 0,
  joints: {
    leftUpperLeg: [90, 0, 0],
    rightUpperLeg: [90, 0, 0],
    leftLowerLeg: [90, 0, 0],
    rightLowerLeg: [90, 0, 0],
  },
};

/**
 * The slide-off preset: seated upright on a table's edge with the seat and the
 * hands beside it half a forearm and hand's length back from the edge, the feet
 * down to the floor, standing. Each of its 3 stances takes the planner's
 * `SECONDS`, 1 s, so about 3 s (provisional: no timing study). Passed as
 * `support`'s `stances`; the `slideOff` row of `HumanSupportRows` reads it.
 */
export const HUMAN_SUPPORT_SLIDE_OFF: IAutoMovieMotionHumanSupport.IPreset = {
  stances: [
    {
      contacts: [on("seat", -0.5), on("leftHand", -0.5), on("rightHand", -0.5)],
      prefer: SEATED,
    },
    {
      contacts: [
        on("seat", -0.5),
        on("leftHand", -0.5),
        on("rightHand", -0.5),
        ...FEET,
      ],
      prefer: SEATED,
    },
    { contacts: FEET, prefer: getUp.POSES.stood },
  ],
};
