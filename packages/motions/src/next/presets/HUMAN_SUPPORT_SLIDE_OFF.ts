import type { IAutoMovieMotionHumanSupport } from "@automovie/interface";

import { getUp } from "../../floor/internal/getUp";
import "./HumanSupportContacts";
import { HumanSupportSlideOffData } from "./internal/HumanSupportSlideOffData";


/*
 * The slide-off preset: seated upright on a table's edge with the seat and the
 * hands beside it half a forearm and hand's length back from the edge, the feet
 * down to the floor, standing. Each of its 3 stances takes the planner's
 * `SECONDS`, 1 s, so about 3 s (provisional: no timing study). Passed as
 * `support`'s `stances`; the `slideOff` row of `HumanSupportRows` reads it.
 */
export const HUMAN_SUPPORT_SLIDE_OFF: IAutoMovieMotionHumanSupport.IPreset = {
  stances: [
    {
      contacts: [HumanSupportSlideOffData.on("seat", -0.5), HumanSupportSlideOffData.on("leftHand", -0.5), HumanSupportSlideOffData.on("rightHand", -0.5)],
      prefer: HumanSupportSlideOffData.SEATED,
    },
    {
      contacts: [
        HumanSupportSlideOffData.on("seat", -0.5),
        HumanSupportSlideOffData.on("leftHand", -0.5),
        HumanSupportSlideOffData.on("rightHand", -0.5),
        ...HumanSupportSlideOffData.FEET,
      ],
      prefer: HumanSupportSlideOffData.SEATED,
    },
    { contacts: HumanSupportSlideOffData.FEET, prefer: getUp.POSES.stood },
  ],
};
