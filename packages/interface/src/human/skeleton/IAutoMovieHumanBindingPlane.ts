import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanJointTransition } from "./IAutoMovieHumanJointTransition";

/**
 * A plane across a joint: a point's share climbs from behind it to before it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A plane across a joint: a point's share climbs from behind it to before it.
 * @evidence contracts/development/design.md#principled-representation `at`: Point on the plane, metres. `normal`: Unit normal toward the child. `half`: Half of the ramp's width, metres; the widest sector's where sectors are read.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanCrotchBinding.start. Also types AutoMovieHumanCrotchBinding.clear.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `sectors`: The half width by sector round the normal, or none for one half all round.
 */
export interface IAutoMovieHumanBindingPlane {
  /** Point on the plane, metres. */
  at: AutoMovieVector3Tuple;

  /** Unit normal toward the child. */
  normal: AutoMovieVector3Tuple;

  /** Half of the ramp's width, metres; the widest sector's where sectors are read. */
  half: number;

  /**
   * The step the share climbs on, over -1 to 1.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The step the share climbs on, over -1 to 1.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This step signature specifies the documented callback contract without an implementation body; Human's binding-plane producers and AutoMovieHumanJointTransition and its supplied callbacks own the numerical method and its premises.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes step at the containing contract boundary; decomposition of its implementation remains with Human's binding-plane producers and AutoMovieHumanJointTransition.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual step provider is responsible for satisfying the documented semantics.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by Human's binding-plane producers and AutoMovieHumanJointTransition determines the work per step call.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; Human's binding-plane producers and AutoMovieHumanJointTransition's runtime provider owns reuse and must preserve the documented source identity and effects.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the step provider and the caller retaining its containing record own the callback and its captured dependencies.
   */
  step: (x: number) => number;

  /** The half width by sector round the normal, or none for one half all round. */
  sectors?: IAutoMovieHumanJointTransition.ISectors;
}
