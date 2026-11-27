import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMovieMotion } from "../motion/IAutoMovieMotion";
import type { IAutoMovieRestFrame } from "../pose/IAutoMovieRestFrame";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";

/** Data and callback contracts shared by the CompileAttach operations. */
export namespace IAutoMovieCompileAttach {
  /**
   * Bake the `attachTo` verb into the child object's follow clip, the per-frame
   * realisation of a rigid coupling to a parent's bone (a sword in a hand, a
   * prop on a saddle). The child is not a rig, so, like a projectile, it moves
   * by a node clip of translation and rotation tracks, not a pose motion.
   *
   * Each sample resolves the parent's posed skeleton at that instant through
   * {@link resolveAttachment}, which runs the parent's FK, to compose the
   * child's bone-local offset into the parent's model space, then composes that
   * onto the parent's world frame: its staged placement, or, when the parent
   * itself rides a coupling this shot, its ridden frame from
   * `parentTransformAt` (#1140):
   *
   * - `translation = parentPos + parentRot · childLocal.translation`
   * - `rotation = parentRot ∘ childLocal.rotation`
   *
   * The parent's scale is not applied, which matches the renderer for the
   * unit-scale actors staging places. Pass the same `jointAxes` the renderer
   * poses the parent with (`AutoMovieEngineHumanoidJointAxes`), plus the same `restFrames`
   * when parent clips are authored in clinical space, or the child follows a
   * bone where the renderer does not draw it. A parent with no motion holds its
   * rest pose.
   *
   * The clip is shot-local: N = max(1, round(duration × fps)) equal intervals
   * give N + 1 keys including both ends of [start, start + duration], with
   * duration set to `shotDuration`, the same convention as `cameraMotion`. Read
   * alone through `sampleClip` it clamps to the child's first frame before
   * `start`; playback reads it through `sampleClipSequence`, where it writes
   * nothing before `start` and holds its last frame after the coupling ends.
   * The clip id is `attach:<child>`; a caller baking several couplings of one
   * child suffixes repeats. Throws a `RangeError` for nonfinite/nonpositive
   * duration or fps, or an unsafe rounded interval count that cannot support an
   * advancing indexed loop. This representability gate is not a workload cap;
   * callers still own feasible memory use and representable distinct key
   * times.
   */
  export type IProps = {
    /** The coupled child's scene node: the clip's target. */
    child: string;

    /** The parent bone the child rides. */
    bone: AutoMovieHumanoidBone;

    /**
     * Child frame in the posed bone, with finite metre translation and a unit
     * rotation. Defaults to the identity.
     */
    offset?: IAutoMovieRigidTransform | undefined;

    /** The parent's staged world placement. */
    parentTransform: IAutoMovieTransform;

    /**
     * The parent's ridden world frame at shot-local second t, or null before
     * its coupling starts. The staged parentTransform applies when no ridden
     * frame exists. Omit for a parent that holds its staged placement
     * throughout. Called synchronously once per baked key, including both
     * endpoints; neither the callback nor returned frame is retained.
     * Exceptions abort baking.
     */
    parentTransformAt?: (t: number) => IAutoMovieTransform | null;

    /** The parent's rig, for the per-frame FK. */
    parentSkeleton: IAutoMovieSkeleton;

    /**
     * The parent's compiled pose motion; absent, the parent holds its rest
     * pose.
     */
    parentMotion?: IAutoMovieMotion;

    /** Shot-local second the coupling begins. */
    start: number;

    /** Length of the coupling in seconds; must be finite and positive. */
    duration: number;

    /** The shot's length in seconds, which the clip's duration spans. */
    shotDuration: number;

    /** Samples per second of the baked follow; defaults to 30. */
    fps?: number;

    /** Clinical-axis remap for the parent's FK, such as `AutoMovieEngineHumanoidJointAxes`. */
    jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

    /** Per-rig clinical rest-frame remap for the parent's FK. */
    restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
  };
}
