import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * The carried shaft's direction in the seat frame: along the travel, the point
 * a little down and in, so the butt behind the grip rises clear of the horse's
 * croup and passes outside the rider's arm (provisional).
 */
export const LEVEL: Readonly<IAutoMovieVector3> = { x: 0.05, y: -0.2, z: 1 };

/*
 * The step the strike is first sought at, seconds: a film frame at 60 per
 * second.
 */
export const FRAME: number = 1 / 60;

/*
 * Seconds the arms take from the entry to the couch and the bridle
 * (provisional).
 */
export const REACH: number = 0.5;
