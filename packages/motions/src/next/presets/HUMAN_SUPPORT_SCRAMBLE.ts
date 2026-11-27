import type { IAutoMovieMotionHumanSupport } from "@automovie/interface";

import { getUp } from "../../floor/internal/getUp";
import "./HumanSupportContacts";
import { HumanSupportScrambleData } from "./internal/HumanSupportScrambleData";


/*
 * The scramble preset: up onto a ledge, the palms on its top half a forearm and
 * hand's length in from the edge, a knee up onto the edge, the other foot up
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
        HumanSupportScrambleData.on("rightKnee"),
      ],
      prefer: HumanSupportScrambleData.HALF_KNEEL,
    },
    {
      contacts: [
        HumanSupportScrambleData.on("leftHand", 0.5),
        HumanSupportScrambleData.on("rightHand", 0.5),
        HumanSupportScrambleData.on("rightKnee"),
        HumanSupportScrambleData.on("leftFoot", 0.5),
      ],
      prefer: HumanSupportScrambleData.HALF_KNEEL,
    },
    {
      contacts: [HumanSupportScrambleData.on("rightKnee"), HumanSupportScrambleData.on("leftFoot", 0.5)],
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
