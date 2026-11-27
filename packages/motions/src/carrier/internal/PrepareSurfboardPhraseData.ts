import type { AutoMovieHumanSide } from "@automovie/interface";

/*
 * The two sides are fitted independently.
 */
export const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

// The staging coefficients below are provisional. The cited study orders
// the palm and foot supports but measures no posture angles or heights, so
// each value is an authored staging choice that the board-sport test
// bounds through its support and clearance checks, not a measurement.

/*
 * Least entry pitch, degrees, that reads as lying prone in the water
 * (provisional).
 */
export const PRONE_ENTRY_PITCH: number = 50;

/*
 * Greatest entry hip distance from the waterline, in leg lengths (provisional).
 */
export const PRONE_ENTRY_DEPTH: number = 0.4;

/*
 * Highest deck above the water at the mount, in leg lengths, that a prone
 * paddler climbs onto (provisional).
 */
export const MOUNT_REACH: number = 1 / 3;

/*
 * Pitch of the prone paddling posture, degrees from upright (provisional).
 */
export const PRONE_PITCH: number = 86;
