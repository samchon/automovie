import type { IAutoMovieMotionHumanSupport } from "@automovie/interface";

import { getUp } from "../../floor/getUp";
import { HumanSupportContacts } from "./HumanSupportContacts";

const { FEET, on } = HumanSupportContacts;

/** Lead with the left foot while the right knee carries the body onto the ledge. */
const HALF_KNEEL: IAutoMovieMotionHumanSupport.IStance["prefer"] =
  getUp.halfKneeling("left");

/**
 * The scramble preset: up onto a ledge in four stances, the palms on its top
 * half a forearm and hand's length in from the edge, a knee up onto the edge,
 * the other foot up beside it while the hands still bear, then standing. Each
 * stance takes the planner's `SECONDS`, 1 s, so about 4 s (provisional: no
 * timing study). Passed as `support`'s `stances`; the `scramble` row of
 * `HumanSupportRows` reads it.
 */
export const HUMAN_SUPPORT_SCRAMBLE: IAutoMovieMotionHumanSupport.IPreset = {
  stances: [
    { contacts: [...FEET, on("leftHand", 0.5), on("rightHand", 0.5)] },
    {
      contacts: [
        FEET[0]!,
        on("leftHand", 0.5),
        on("rightHand", 0.5),
        on("rightKnee"),
      ],
      prefer: HALF_KNEEL,
    },
    {
      contacts: [
        on("leftHand", 0.5),
        on("rightHand", 0.5),
        on("rightKnee"),
        on("leftFoot", 0.5),
      ],
      prefer: HALF_KNEEL,
    },
    {
      contacts: [on("leftFoot", 0.5), on("rightFoot", 0.5)],
      prefer: getUp.POSES.stood,
    },
  ],
};
