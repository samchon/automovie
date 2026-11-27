import type { IAutoMovieMotionHumanActionLaw } from "@automovie/interface";

/*
 * The channels a surface carrier leaves to a tool action or a gaze layer.
 */
export const YIELDS: IAutoMovieMotionHumanActionLaw["yields"] = [
  "leftArm",
  "rightArm",
  "leftHand",
  "rightHand",
  "head",
  "trunkTurn",
];

/*
 * Preserve the supported feet and inertialize free joints at an end cut.
 */
export const AT_END: IAutoMovieMotionHumanActionLaw["interrupts"] = {
  any: [{ window: { start: 1, end: 1 }, kind: "inertialize", entry: 0 }],
};
