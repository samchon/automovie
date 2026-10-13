import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieJointTwistPlacement } from "./AutoMovieJointTwistPlacement";

/**
 * The bone-local axes the three clinical angles rotate about. Lets a rig whose
 * bone frames are not aligned to the default clinical planes (e.g. a T-pose arm
 * pointing along its local X) declare which local axis flexion / abduction /
 * twist each swing, so "flexion" stays anatomically sagittal instead of rolling
 * the bone along its length.
 */
export interface IAutoMovieJointAxes {
  /** Axis `flexion` rotates about (sagittal). */
  flexion: IAutoMovieVector3;

  /** Axis `abduction` rotates about (frontal). */
  abduction: IAutoMovieVector3;

  /** Axis `twist` rotates about (the bone's long axis). */
  twist: IAutoMovieVector3;

  /**
   * Where the axial rotation sits relative to the swing, which fixes the
   * composition order; omitted, `"proximal"`.
   */
  twistPlacement?: AutoMovieJointTwistPlacement;
}
