import { sequenceMotion as sequenceMotionImplementation } from "./internal/sequenceMotion";

import { importedNodeClipToAutoMovieMotion as importedNodeClipToAutoMovieMotionImplementation } from "./internal/importedNodeClipToAutoMovieMotion";

import { type IAutoMovieMotionClipBridge, type IAutoMovieMotionToClip, type IAutoMovieMotion, type IAutoMovieImportedNodeMotionProps } from "@automovie/interface";
import { motionToClip as motionToClipImplementation } from "./internal/motionToClip";

/** Public operations for Auto Movie Engine Motion Clip. */
export namespace AutoMovieEngineMotionClip {
  /**
   * Bake admitted clinical motion into general node tracks at a positive sample
   * rate, default24Hz, with matching rig clinical tables. Full local bone
   * rotations and rigid root translation/rotation reproduce FK at bake times;
   * bone/root scale is ignored as in resolvePose, expressions are omitted, and
   * inter-sample quaternion interpolation approximates clinical easing rather
   * than preserving it exactly.
   */
  export function motionToClip(props: IAutoMovieMotionToClip.IProps): IAutoMovieMotionClipBridge {
    return motionToClipImplementation(props);
  }

  /**
   * Lower admitted imported node tracks into clinical keyframes at the sorted
   * union of source key times. Every mapped node needs a rotation track; only
   * hips translation is supported, all tracks share step or linear interpolation,
   * and unsupported/missing/duplicate/nonfinite content throws. Key orientations
   * are retained within clinical inversion tolerance; inter-key linear clinical
   * interpolation generally differs from quaternion slerp.
   */
  export function importedNodeClipToAutoMovieMotion(props: IAutoMovieImportedNodeMotionProps): IAutoMovieMotion {
    return importedNodeClipToAutoMovieMotionImplementation(props);
  }

  /**
   * Concatenate nonempty admitted same-skeleton clips in seconds. Durations must
   * be finite and positive; later time-zero seam frames transfer their easing to
   * the retained previous endpoint. Pose and expression values remain borrowed.
   */
  export function sequenceMotion(id: string, parts: IAutoMovieMotion[], loop?: boolean): IAutoMovieMotion {
    return sequenceMotionImplementation(id, parts, loop);
  }
}
