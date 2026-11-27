import type { IAutoMovieRigidTransform } from "@automovie/interface";
import { Quaternion } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * The model's unplaced frame.
 */
export const MODEL: IAutoMovieRigidTransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: Quaternion.identity(),
};

/*
 * The seat's outward normal in its declared frame.
 */
export const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
