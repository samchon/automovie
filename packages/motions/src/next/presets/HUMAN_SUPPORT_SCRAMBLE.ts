import type { IAutoMovieMotionHumanSupport } from "@automovie/interface";

import { getUp } from "../../floor/internal/getUp";
import "./HumanSupportContacts";
import { HumanSupportScrambleData } from "./internal/HumanSupportScrambleData";


/*
 * The knee pad bears inside the top rather than on its edge. All three bearing
 * phases share the same place so the knee stays down through hand release.
 */
const rightKnee: IAutoMovieMotionHumanSupport.IContact =
  HumanSupportScrambleData.on("rightKnee", 0.1);

/*
 * The scramble preset: up onto a ledge, the palms on its top half a forearm and
 * hand's length in from the edge, a knee set onto the top just inside the edge, the other foot up
 * beside it while the hands still bear. Release the hands over the supported
 * knee and foot before standing on both feet.
 */
export const HUMAN_SUPPORT_SCRAMBLE: IAutoMovieMotionHumanSupport.IPreset = {
  stances: [
    { contacts: [...HumanSupportScrambleData.FEET, HumanSupportScrambleData.on("leftHand", 0.5), HumanSupportScrambleData.on("rightHand", 0.5)] },
    {
      contacts: [
        HumanSupportScrambleData.FEET[0]!,
        HumanSupportScrambleData.on("leftHand", 0.5),
        HumanSupportScrambleData.on("rightHand", 0.5),
        rightKnee,
      ],
      prefer: HumanSupportScrambleData.HALF_KNEEL,
    },
    {
      contacts: [
        HumanSupportScrambleData.on("leftHand", 0.5),
        HumanSupportScrambleData.on("rightHand", 0.5),
        rightKnee,
        HumanSupportScrambleData.on("leftFoot", 0.5),
      ],
      prefer: HumanSupportScrambleData.HALF_KNEEL,
    },
    {
      contacts: [rightKnee, HumanSupportScrambleData.on("leftFoot", 0.5)],
      prefer: HumanSupportScrambleData.HALF_KNEEL,
      free: ["leftHand", "rightHand"],
      seconds: 0.25,
      event: "handsFree",
    },
    {
      contacts: [HumanSupportScrambleData.on("leftFoot", 0.5), HumanSupportScrambleData.on("rightFoot", 0.5)],
      prefer: getUp.POSES.stood,
      seconds: 0.75,
      event: "stance3",
    },
  ],
};
