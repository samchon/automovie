import type { IAutoMovieMotion } from "../motion/IAutoMovieMotion";
import type { IAutoMovieRestFrame } from "../pose/IAutoMovieRestFrame";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieCapsuleProxy } from "./IAutoMovieCapsuleProxy";

/**
 * Data and callback contracts shared by the ValidateGroundContact operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Sample FK and compare configured foot points and valid capsule endpoints to scalar/height-source ground minus tolerance. Member documentation states the supplied records, units and absence meanings used by validateGroundContact.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional capsule proxies extend foot-point coverage without pretending to measure the whole mesh; missing/detached capsule bones remain errors and physicsIntent only changes plausibility expectations.
 * @evidence contracts/development/design.md#principled-representation motion and skeleton provide FK in a shared metre frame; groundY is a constant height or x/z-to-y source, tolerance is penetration metres and sampleRate is hertz.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateGroundContact, used by validateGroundContact. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieValidateGroundContact {
  /**
   * Sample FK and compare configured foot points and valid capsule endpoints to scalar/height-source ground minus tolerance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Sample FK and compare configured foot points and valid capsule endpoints to scalar/height-source ground minus tolerance. Member documentation states the supplied records, units and absence meanings used by validateGroundContact.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional capsule proxies extend foot-point coverage without pretending to measure the whole mesh; missing/detached capsule bones remain errors and physicsIntent only changes plausibility expectations.
   * @evidence contracts/development/design.md#principled-representation motion and skeleton provide FK in a shared metre frame; groundY is a constant height or x/z-to-y source, tolerance is penetration metres and sampleRate is hertz.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateGroundContact.IProps, used by validateGroundContact. Its motion, skeleton, footBones, capsules, groundY, tolerance, sampleRate, path, jointAxes, restFrames, physicsIntent members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
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
     * (`min(from.y, to.y) − radius`, sampled per endpoint against a heightfield)
     * must stay above the ground, so a hand, hip, elbow, or prop clipping through
     * the floor is no longer invisible the way the foot-point check leaves it. A
     * capsule on a missing or detached bone is a `type` error, not a silent skip
     * (the totality contract the point check does not carry). Omit to check only
     * `footBones`.
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
