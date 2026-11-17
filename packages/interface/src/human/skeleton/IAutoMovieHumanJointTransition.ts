import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/**
 * Angular transition half-width fields and sample-selection inputs in metres and radians. Runtime construction and admission remain with AutoMovieHumanJointTransition in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes angular transition half-width fields and sample-selection inputs in metres and radians; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Angular transition half-width fields and sample-selection inputs in metres and radians. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanJointTransition; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing JointTransition contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanJointTransition {
  /** A half width by the angle about a plane's normal.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A half width by the angle about a plane's normal.
   * @evidence contracts/development/design.md#principled-representation `u`: First axis square to the normal, where the angle is zero. `v`: Second axis square to the normal, a quarter turn on. `terms`: Mean, then cosine and sine of the angle and of twice it, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanJointTransition.measure. Read by AutoMovieHumanJointTransition.half.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `u`, `v`, `terms`, `least`, `most`; callers supply the complete record.
   */
  export interface ISectors {
    /** First axis square to the normal, where the angle is zero. */
    u: AutoMovieVector3Tuple;

    /** Second axis square to the normal, a quarter turn on. */
    v: AutoMovieVector3Tuple;

    /** Mean, then cosine and sine of the angle and of twice it, metres. */
    terms: [number, number, number, number, number];

    /** Least half width, metres. */
    least: number;

    /** Greatest half width, metres. */
    most: number;
  }

  /** What one transition is measured from.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What one transition is measured from.
   * @evidence contracts/development/design.md#principled-representation `points`: Skin samples, metres, three numbers each. `held`: Whether a sample belongs to the joint's two bones and side. `at`: The plane's point, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanJointTransition.measure.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `points`, `held`, `at`, `normal`, `turn`, `least`, `most`; callers supply the complete record.
   */
  export interface IMeasure {
    /** Skin samples, metres, three numbers each. */
    points: Float64Array;

    /**
     * Whether a sample belongs to the joint's two bones and side.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Whether a sample belongs to the joint's two bones and side.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This held signature specifies the documented callback contract without an implementation body; AutoMovieHumanJointTransition and its supplied callbacks own the numerical method and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes held at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanJointTransition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual held provider is responsible for satisfying the documented semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanJointTransition determines the work per held call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanJointTransition's runtime provider owns reuse and must preserve the documented source identity and effects.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the held provider and the caller retaining its containing record own the callback and its captured dependencies.
     */
    held: (index: number) => boolean;

    /** The plane's point, metres. */
    at: AutoMovieVector3Tuple;

    /** The plane's unit normal toward the child. */
    normal: AutoMovieVector3Tuple;

    /** The joint's largest turn from the bind, radians. */
    turn: number;

    /** Least half width, metres. */
    least: number;

    /** Greatest half width, metres. */
    most: number;
  }
}
