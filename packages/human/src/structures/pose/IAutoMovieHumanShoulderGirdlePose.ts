import { tags } from "typia";

/**
 * Clavicle at the sternoclavicular joint and scapula on the thorax, degrees (recalled, Neumann 2017). The acromioclavicular joint's small motions are folded into the scapula's upward rotation.
 */
export interface IAutoMovieHumanShoulderGirdlePose {
  /** Clavicle elevation of the lateral end 45, depression 10. */
  elevation?: number & tags.Minimum<-10> & tags.Maximum<45>;

  /** Scapular upward rotation (glenoid turned up) 60, downward rotation 10: about a third of full arm elevation. */
  upwardRotation?: number & tags.Minimum<-10> & tags.Maximum<60>;

  /** Clavicle protraction (lateral end forward) 15, retraction 15. */
  protraction?: number & tags.Minimum<-15> & tags.Maximum<15>;
}
