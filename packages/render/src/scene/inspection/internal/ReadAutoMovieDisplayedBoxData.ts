import { createDualQuaternionSkinningShaderPatch } from "../../dualQuaternionSkinning/internal/createDualQuaternionSkinningShaderPatch";
import type { IAutoMoviePreparePhysicalGeometry as Geometry } from "@automovie/interface";

export namespace ReadAutoMovieDisplayedBoxData {
  /*
   * Program identity from the owned dual-quaternion shader builder.
   */
  export const DUAL_QUATERNION_KEY: string =
    createDualQuaternionSkinningShaderPatch().key;

  /*
   * The three local coordinates of every box corner.
   */
  export const AXES = ["x", "y", "z"] as const;

  export const IDENTITY = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  } satisfies Geometry.ICollider["pose"];
}
