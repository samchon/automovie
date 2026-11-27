import type { AutoMovieHumanSide } from "@automovie/interface";
import type { AutoMovieHumanLimb } from "@automovie/interface";
import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * The two feet.
 */
export const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/*
 * Goals carried by either the individual foot's support or by the body.
 */
export const LIMBS: readonly AutoMovieHumanLimb[] = [
  "leftArm",
  "rightArm",
  "leftLeg",
  "rightLeg",
];

/*
 * Seconds over which a foot's share of the body eases from its plant into its
 * swing (provisional staging).
 */
export const EASE: number = 0.1;

/*
 * World vertical.
 */
export const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
