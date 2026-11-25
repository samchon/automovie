import type { IAutoMovieRestFrame } from "../pose/IAutoMovieRestFrame";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieMotion } from "./IAutoMovieMotion";

/** Data and callback contracts shared by the MotionToClip operations. */
export namespace IAutoMovieMotionToClip {
  /**
   * Bake admitted clinical motion into general node tracks at a positive sample
   * rate, default 24 Hz, with matching rig clinical tables. Full local bone
   * rotations and rigid root translation/rotation reproduce FK at bake times;
   * bone/root scale is ignored as in resolvePose, expressions are omitted, and
   * inter-sample quaternion interpolation approximates clinical easing rather
   * than preserving it exactly.
   */
  export type IProps = {
    /** The humanoid motion to lower. */
    motion: IAutoMovieMotion;

    /** The rig the motion articulates; lowered to the returned nodes. */
    skeleton: IAutoMovieSkeleton;

    /**
     * Optional per-bone clinical-axis remap, as {@link resolvePose} takes; a
     * bone's own declared axes take precedence.
     */
    jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

    /** Optional per-bone rest-frame remap, as {@link resolvePose} takes. */
    restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;

    /** Bake samples per second. Defaults to `24`. */
    sampleRate?: number;

    /**
     * Node-id prefix applied to every lowered node AND every clip channel ref
     * (root and bones alike). Defaults to `""`: the bare single-actor naming. A
     * multi-actor graph (see `sceneToNodes`) passes the placement prefix (e.g.
     * `"figureA/"`) so each actor's channels drive its own subtree.
     */
    nodePrefix?: string;
  };
}
