import type { IAutoMovieQuaternion } from "@automovie/interface";
import type { AutoMovieHumanBodyToeBone } from "../../../structures/rig/AutoMovieHumanBodyToeBone";

/** The actual source phalanx supplies the existing skin-ray frame, rather than a separately posed ray skeleton. */
export interface IAutoMovieHumanBodySourceToeProjection {
  /** Existing skin-ray identity supplied by this source bone. */
  bone: AutoMovieHumanBodyToeBone;
  /** Source-local named site for the same ray's origin; omission uses the source bone origin. */
  site?: string;
  /** Registered rest-local rotation of the existing ray frame. */
  rotation: IAutoMovieQuaternion;
}
