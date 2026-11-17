import type { AutoMovieVector2Tuple } from "../index";

/** Borrowed parametric planar source, with source-span and singularity breaks.
 * Derivatives are with respect to the original parameter, not normalized arc
 * length. At a declared break the derivative callback must supply the exact
 * requested one-sided limit; no epsilon displacement approximates a corner.
 * Smooth callbacks may ignore side. Callbacks must be deterministic and leave
 * their input unchanged; algorithms snapshot returned coordinate tuples.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents callback parameterization, exact one-sided derivatives at breaks, domain, breaks and coordinate snapshot ownership.
 * @evidence contracts/development/design.md#principled-representation The ordered domain and derivatives through order five support the Ahn and Ghosh conic methods and compact fitting; regularity is checked numerically by the selected algorithm.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Recovery accepts a pure evaluator so source basis and artifact I/O remain with existing owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The interface accepts arbitrary planar source charts without a Human or polynomial-degree dependency.
 */
export interface IAutoMoviePlanarCurveSource {
  /** Inclusive source parameter interval, strictly increasing. */
  domain: readonly [number, number];

  /** Ordered or unordered interior parameter boundaries that may not be crossed. */
  breaks: readonly number[];

  /** Whether the source identifies its two domain endpoints. */
  closed: boolean;

  /** Evaluate in millimetres; nonfinite coordinates refuse the affected arc.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit of the returned point and what a nonfinite coordinate does to the arc that reads it; the interface comment states determinism and input ownership.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation The point evaluator is a callback the caller supplies: this declaration has no body whose method could be judged.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The point evaluator is a callback the caller supplies: no structure is implemented here.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The point evaluator is a callback the caller supplies: no implementation exists here to take a shortcut.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The point evaluator is a callback the caller supplies: its cost belongs to the supplied source.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The point evaluator is a callback the caller supplies: the algorithms that call it own their caching.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The point evaluator is a callback the caller supplies: it declares no state or resource.
   */
  evaluate(t: number): Readonly<AutoMovieVector2Tuple>;

  /** Evaluate mm/parameter^order. At a nonsmooth break, left/right requests
   * select the exact incident chart's endpoint derivative; omission selects
   * the caller's ordinary point value and makes no one-sided promise.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the derivative's unit per order, the one-sided selection at a break and what omitting the side promises.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation The derivative evaluator is a callback the caller supplies: no method is implemented under this signature.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The derivative evaluator is a callback the caller supplies: its structure is the source chart's own.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The derivative evaluator is a callback the caller supplies: exactness at breaks is demanded of it, not implemented here.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The derivative evaluator is a callback the caller supplies: the cost of each order is the source chart's.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The derivative evaluator is a callback the caller supplies: Ahn and Ghosh cache its jets themselves.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The derivative evaluator is a callback the caller supplies: the signature holds no state between orders or sides.
   */
  derivative(
    t: number,
    order: 1 | 2 | 3 | 4 | 5,
    side?: "left" | "right",
  ): Readonly<AutoMovieVector2Tuple>;
}
