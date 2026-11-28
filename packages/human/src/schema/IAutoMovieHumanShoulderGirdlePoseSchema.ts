import type { IAutoMovieHumanShoulderGirdlePose } from "@automovie/interface";
import type { tags } from "typia";

/**
 * Clavicle elevation and protraction and scapular upward rotation, in degrees
 * from neutral. Positive values lift the lateral clavicle, move it forward and
 * turn the glenoid upward, respectively.
 */
export type IAutoMovieHumanShoulderGirdlePoseSchema =
  IAutoMovieHumanShoulderGirdlePose & {
    /** Clavicle elevation of the lateral end 45, depression 10. */
    elevation?: number & tags.Minimum<-10> & tags.Maximum<45>;

    /** Scapular upward rotation (glenoid turned up) 60, downward rotation 10: about a third of full arm elevation. */
    upwardRotation?: number & tags.Minimum<-10> & tags.Maximum<60>;

    /** Clavicle protraction (lateral end forward) 15, retraction 15. */
    protraction?: number & tags.Minimum<-15> & tags.Maximum<15>;
  };
