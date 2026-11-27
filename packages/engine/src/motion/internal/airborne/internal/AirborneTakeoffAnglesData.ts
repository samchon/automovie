import type { IAutoMovieVector3 } from "@automovie/interface";

export namespace AirborneTakeoffAnglesData {
  /*
   * The lateral unit axis, read without mutation by quaternion operations.
   */
  export const LATERAL: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };

  /*
   * The longitudinal unit axis in the shooting attitude convention.
   */
  export const LONGITUDINAL: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

  /*
   * The forward unit axis in the shooting attitude convention.
   */
  export const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
}
