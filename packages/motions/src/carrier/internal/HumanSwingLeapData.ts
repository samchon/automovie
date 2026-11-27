import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * The step that reads the seat's velocity at release, seconds.
 */
export const RATE: number = 1e-3;

/*
 * The landing's knee give: the pelvis lands this share of its standing height
 * (provisional staging).
 */
export const LAND: number = 0.8;

/*
 * Seconds from touchdown to standing still (provisional staging).
 */
export const SETTLE: number = 0.4;

/*
 * How far each upper arm abducts for the landing, degrees (provisional
 * staging).
 */
export const OPEN: number = 35;

/*
 * World vertical.
 */
export const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/*
 * The bones of an arm and its hand, either side.
 */
export const ARM: RegExp =
  /^(left|right)(Shoulder|UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Little)/;
