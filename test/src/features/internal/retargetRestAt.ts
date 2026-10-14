import type { IAutoMovieTransform } from "@automovie/interface";

/** Create the original identity rotation and scale at a local translation, shared by existing rig construction and zero-length-bone mutations. */
export const retargetRestAt: (x: number, y: number, z: number) => IAutoMovieTransform = (x: number, y: number, z: number): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});
