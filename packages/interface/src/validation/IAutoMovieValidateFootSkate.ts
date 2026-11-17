import type { IAutoMovieMotion } from "../motion/IAutoMovieMotion";
import type { IAutoMovieRestFrame } from "../pose/IAutoMovieRestFrame";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieFootContactWindow } from "./IAutoMovieFootContactWindow";

/**
 * Data and callback contracts shared by the ValidateFootSkate operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Sample admitted contact windows, resolve FK and warn when adjacent foot XZ displacement divided by elapsed seconds exceeds the declared speed. Member documentation states the supplied records, units and absence meanings used by validateFootSkate.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Adjacent sampled XZ displacement gives a speed warning, not continuous contact proof; physicsIntent suppresses plausibility advice while malformed annotations stay errors.
 * @evidence contracts/development/design.md#principled-representation motion, skeleton and contact windows share clip seconds; sampleRate is hertz and optional joint/rest maps preserve clinical FK conventions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateFootSkate, used by validateFootSkate. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieValidateFootSkate {
  /**
   * Sample admitted contact windows, resolve FK and warn when adjacent foot XZ displacement divided by elapsed seconds exceeds the declared speed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Sample admitted contact windows, resolve FK and warn when adjacent foot XZ displacement divided by elapsed seconds exceeds the declared speed. Member documentation states the supplied records, units and absence meanings used by validateFootSkate.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Adjacent sampled XZ displacement gives a speed warning, not continuous contact proof; physicsIntent suppresses plausibility advice while malformed annotations stay errors.
   * @evidence contracts/development/design.md#principled-representation motion, skeleton and contact windows share clip seconds; sampleRate is hertz and optional joint/rest maps preserve clinical FK conventions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateFootSkate.IProps, used by validateFootSkate. Its motion, skeleton, contacts, sampleRate, path, jointAxes, restFrames, physicsIntent members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** Motion clip to sample. */
    motion: IAutoMovieMotion;

    /** Skeleton used for forward kinematics. */
    skeleton: IAutoMovieSkeleton;

    /** Declared planted-foot windows to test. */
    contacts: readonly IAutoMovieFootContactWindow[];

    /** Samples per second used by the validator. Defaults to `24`. */
    sampleRate?: number;

    /** JSON path of the contact annotation being checked. Defaults to `$input`. */
    path?: string;

    /** Optional clinical-axis remap for rigs authored in semantic axes. */
    jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

    /** Optional rest-frame remap for clinical authoring. */
    restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;

    /**
     * Marker that opts the clip out of the foot-plant expectation. Foot skate is
     * a physical-plausibility warning, not a gate: a deliberate slide (a
     * moonwalk, a skate, a comedic scoot) sets this and the matching warnings are
     * suppressed. Malformed annotations (bad bone, window, rate) stay errors.
     */
    physicsIntent?: string;
  };
}
