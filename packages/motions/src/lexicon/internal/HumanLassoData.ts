import type { AutoMovieHumanoidBone } from "@automovie/interface";
import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * The swinging wrist's circle overhead, metres, the hand turning mostly at the
 * wrist; the throw's reach-out time, seconds; the dally's radius round the
 * horn, metres, and seconds per turn (provisional stage readings).
 */
export const SWING: Readonly<Record<SWINGEntryItem, number>> = {
  radius: 0.15,
  throw: 0.25,
  wrap: 0.08,
  turn: 0.5,
};

/*
 * The farthest a loop is thrown, metres (provisional).
 */
export const REACH: number = 12;

/*
 * The bone whose joint the entry holds the hand at: the right hand.
 */
export const HAND: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>(
  ["rightHand"],
);

/*
 * The world up.
 */
export const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/*
 * The alternatives of `SWINGEntryItem`'s site.
 */
export type SWINGEntryItem = "radius" | "throw" | "wrap" | "turn";
