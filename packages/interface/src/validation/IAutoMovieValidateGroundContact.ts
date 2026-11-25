import type { IAutoMovieMotion } from "../motion/IAutoMovieMotion";
import type { IAutoMovieRestFrame } from "../pose/IAutoMovieRestFrame";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieCapsuleProxy } from "./IAutoMovieCapsuleProxy";

/** Data and callback contracts shared by the ValidateGroundContact operations. */
export namespace IAutoMovieValidateGroundContact {
  /**
   * Sample FK and compare configured foot points and valid capsule endpoints to
   * scalar/height-source ground minus tolerance.
   */
  export type IProps = {
    /** Motion clip to sample. */
    motion: IAutoMovieMotion;

    /** Skeleton used for forward kinematics. */
    skeleton: IAutoMovieSkeleton;

    /** Bones treated as ground-contact points. Defaults to both humanoid feet. */
    footBones?: readonly AutoMovieHumanoidBone[];

    /**
     * Whole-body capsule proxies swept against the ground (#1185): each is a
     * `from → to` bone segment with a radius, and its lowest surface point
     * (`min(from.y, to.y) − radius`, sampled per endpoint against a
     * heightfield) must stay above the ground, so a hand, hip, elbow, or prop
     * clipping through the floor is no longer invisible the way the foot-point
     * check leaves it. A capsule on a missing or detached bone is a `type`
     * error, not a silent skip (the totality contract the point check does not
     * carry). Omit to check only `footBones`.
     */
    capsules?: readonly IAutoMovieCapsuleProxy[];

    /** Ground height: plane scalar or `(x, z) → y` source. Defaults to `0`. */
    groundY?: number | ((x: number, z: number) => number);

    /** Allowed penetration depth before violation. Defaults to `0`. */
    tolerance?: number;

    /** Samples per second used by the validator. Defaults to `24`. */
    sampleRate?: number;

    /** JSON path of the motion being checked. Defaults to `$input`. */
    path?: string;

    /** Optional clinical-axis remap for rigs authored in semantic axes. */
    jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

    /** Optional rest-frame remap for clinical authoring. */
    restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;

    /**
     * Marker that opts the clip out of the ground-contact expectation: a
     * deliberate pass-through (a phasing ghost, a stylized float) sets this and
     * the matching warnings are suppressed.
     */
    physicsIntent?: string;
  };
}
