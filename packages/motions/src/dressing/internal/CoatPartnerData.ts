import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * The wearer's collar below and before the shoulder line, metres: the
 * `wardrobe` jacket's own collar offset.
 */
export const COLLAR: IAutoMovieVector3 = { x: 0, y: -0.085, z: 0.1 };

/*
 * How long the hand stays on the jacket once it rests on the shoulders,
 * seconds: a beat to settle it.
 */
export const SETTLE: number = 0.28;
