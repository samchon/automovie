import type { IAutoMovieTransform } from "@automovie/interface";

/** One shared identity rotation for the existing visual-read inputs. */
const IDENTITY_Q = { x: 0, y: 0, z: 0, w: 1 };

/** Construct the original world translation while retaining its shared identity rotation. */
export const createFilmVisualReadTransform = (
  x: number,
  y: number,
  z: number,
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: IDENTITY_Q,
  scale: { x: 1, y: 1, z: 1 },
});
