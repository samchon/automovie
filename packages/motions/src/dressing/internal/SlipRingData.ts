import type { IAutoMovieVector3 } from "@automovie/interface";
import type { IAutoMovieMotionHumanSlipRing } from "@automovie/interface";

/*
 * Where along the proximal phalanx a ring rests, as a share from its base joint
 * (provisional: a ring sits on the phalanx's proximal third).
 */
export const SEAT: number = 0.35;

/*
 * How far beyond the fingertip the ring lines up before it slides on, metres
 * (provisional: clear of the fingertip by a ring's width).
 */
export const LINE_UP: number = 0.015;

/*
 * The step the band's free roll about the finger is searched by, degrees.
 */
export const ROLL: number = 15;

/*
 * World up.
 */
export const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/*
 * Capitalized digit names used in the canonical rig's phalanx identifiers.
 */
export const PHALANX_NAME: Readonly<
  Record<
    IAutoMovieMotionHumanSlipRing.Finger,
    Capitalize<IAutoMovieMotionHumanSlipRing.Finger>
  >
> = { index: "Index", middle: "Middle", ring: "Ring", little: "Little" };
