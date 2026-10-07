import type { IAutoMovieTransform } from "@automovie/interface";

/** Preserve the facade model placement and caller-owned rotation. */
export const createFilmFacadeTransform = (
  x: number,
  y: number,
  z: number,
  rotation: IAutoMovieTransform["rotation"] = { x: 0, y: 0, z: 0, w: 1 },
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation,
  scale: { x: 1, y: 1, z: 1 },
});
