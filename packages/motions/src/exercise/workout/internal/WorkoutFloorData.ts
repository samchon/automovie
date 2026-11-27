import type { AutoMovieHumanoidBone } from "@automovie/interface";
import type { IAutoMovieMotionHumanWorkoutKind } from "@automovie/interface";

/*
 * Only shoulder and toe positions determine the pitch residual.
 */
export const PITCHED: ReadonlySet<AutoMovieHumanoidBone> = new Set([
  "leftUpperArm",
  "rightUpperArm",
  "leftToes",
  "rightToes",
]);

/*
 * The hands and the toes bear.
 */
export const PRONE: readonly IAutoMovieMotionHumanWorkoutKind.ISupport[] = [
  { part: "leftHand", kind: "plant" },
  { part: "rightHand", kind: "plant" },
  { part: "leftFoot", kind: "plant" },
  { part: "rightFoot", kind: "plant" },
];
