import type { IAutoMovieMeshTransform } from "@automovie/engine";


/** Transform that leaves geometry in place. */
export const identity: IAutoMovieMeshTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};
