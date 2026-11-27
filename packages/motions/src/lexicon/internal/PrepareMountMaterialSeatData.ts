import type { IAutoMovieRigidTransform, IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieEngineQuaternion } from "@automovie/engine";

export namespace PrepareMountMaterialSeatData {
  /*
   * The model's unplaced frame.
   */
  export const MODEL: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: AutoMovieEngineQuaternion.identity(),
  };

  /*
   * The seat's outward normal in its declared frame.
   */
  export const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
}
