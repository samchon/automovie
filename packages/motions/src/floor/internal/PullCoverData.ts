import type { AutoMovieHumanSide } from "@automovie/interface";
import type { AutoMovieHumanoidRegion } from "@automovie/interface";

/*
 * How far above the skin the gripping hand's grip socket rides, metres
 * (provisional: the closed fist's half depth over a blanket's thickness).
 */
export const OVER: number = 0.05;

/*
 * Each hand's way up the body, its own side's regions from the thigh to the
 * chest.
 */
export const WAY: Readonly<
  Record<AutoMovieHumanSide, readonly AutoMovieHumanoidRegion[]>
> = {
  left: ["thighFrontLeft", "spleen", "chestLeft"],
  right: ["thighFrontRight", "liver", "chestRight"],
};
