import type { IAutoMovieVector3 } from "@automovie/interface";
import type { IAutoMovieMotionHumanActionLaw } from "@automovie/interface";

/*
 * The axis a handle is wrapped about: its affordance frame's local +X.
 */
export const HANDLE: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };

/*
 * Seconds over which a riding hand reaches its grip on the support (provisional
 * staging).
 */
export const REACH: number = 0.4;

/*
 * Hand subsequent actions a settled stance after the board transfer.
 */
export const END: IAutoMovieMotionHumanActionLaw["interrupts"] = {
  any: [{ window: { start: 1, end: 1 }, kind: "inertialize", entry: 0 }],
};
