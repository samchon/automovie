import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * From the pelvis towards the deck, in the material axes.
 */
export const DOWN: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };

/*
 * The seat's longitudinal translation axis in the material axes.
 */
export const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/*
 * Box face normals, one for each pair of parallel opposing faces.
 */
export const BOX_AXES: readonly IAutoMovieVector3[] = [
  { x: 1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  FORWARD,
];

/*
 * Roundoff for frame transforms, their support-plane witnesses, and their
 * pairwise differences. It scales with the deck and pelvis coordinates.
 */
export const FRAME_ROUNDOFF: number = 64 * Number.EPSILON;
