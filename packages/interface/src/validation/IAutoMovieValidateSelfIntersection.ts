import type { IAutoMovieMotion } from "../motion/IAutoMovieMotion";
import type { IAutoMovieRestFrame } from "../pose/IAutoMovieRestFrame";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieCapsuleProxyPair } from "./IAutoMovieCapsuleProxyPair";

/**
 * Data and callback contracts shared by the ValidateSelfIntersection operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Sample valid capsule pairs through FK and warn when segment distance is less than summed radii. Member documentation states the supplied records, units and absence meanings used by validateSelfIntersection.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Capsule distance is a sampled proxy warning rather than mesh intersection proof; authored physicsIntent records deliberate overlap without rewriting poses.
 * @evidence contracts/development/design.md#principled-representation motion and skeleton supply FK, pairs identify nonadjacent capsule proxies, and sampleRate is hertz; optional clinical maps preserve the rig's interpretation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateSelfIntersection, used by validateSelfIntersection. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieValidateSelfIntersection {
  /**
   * Sample valid capsule pairs through FK and warn when segment distance is less than summed radii.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Sample valid capsule pairs through FK and warn when segment distance is less than summed radii. Member documentation states the supplied records, units and absence meanings used by validateSelfIntersection.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Capsule distance is a sampled proxy warning rather than mesh intersection proof; authored physicsIntent records deliberate overlap without rewriting poses.
   * @evidence contracts/development/design.md#principled-representation motion and skeleton supply FK, pairs identify nonadjacent capsule proxies, and sampleRate is hertz; optional clinical maps preserve the rig's interpretation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateSelfIntersection.IProps, used by validateSelfIntersection. Its motion, skeleton, pairs, sampleRate, path, jointAxes, restFrames, physicsIntent members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** Motion clip to sample. */
    motion: IAutoMovieMotion;

    /** Skeleton used for forward kinematics. */
    skeleton: IAutoMovieSkeleton;

    /** Declared non-adjacent capsule pairs to test. */
    pairs: readonly IAutoMovieCapsuleProxyPair[];

    /** Samples per second used by the validator. Defaults to `24`. */
    sampleRate?: number;

    /** JSON path of the proxy annotation being checked. Defaults to `$input`. */
    path?: string;

    /** Optional clinical-axis remap for rigs authored in semantic axes. */
    jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

    /** Optional rest-frame remap for clinical authoring. */
    restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;

    /**
     * Marker that opts the pair out of the overlap expectation: close
     * choreography (a grapple, an embrace) sets this and the matching warnings
     * are suppressed.
     */
    physicsIntent?: string;
  };
}
