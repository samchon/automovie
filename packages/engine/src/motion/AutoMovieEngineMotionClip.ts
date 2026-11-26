import { type IAutoMovieMotionClipBridge, type IAutoMovieMotionToClip } from "@automovie/interface";
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
}
