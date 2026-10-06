import type { AutoMovieHumanoidBone, IAutoMovieQuaternion } from "@automovie/interface";

/** One source bone/site supplies a public humanoid frame; no duplicate rig is solved. */
export interface IAutoMovieHumanBodySourceProjection {
  /** Sole public goal/skin identity supplied by this source projection. */
  bone: AutoMovieHumanoidBone;

  /** Named source site supplying the public frame's origin; absence uses the bone-local origin. */
  site?: string;

  /** Source-owned rest-local orientation convention of the public frame. */
  rotation: IAutoMovieQuaternion;
}
