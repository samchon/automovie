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
   */
  evaluate(t: number): Readonly<AutoMovieVector2Tuple>;

  /** Evaluate mm/parameter^order. At a nonsmooth break, left/right requests
   * select the exact incident chart's endpoint derivative; omission selects
   * the caller's ordinary point value and makes no one-sided promise.
   */
  derivative(
    t: number,
    order: 1 | 2 | 3 | 4 | 5,
    side?: "left" | "right",
  ): Readonly<AutoMovieVector2Tuple>;
}
