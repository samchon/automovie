import type { IAutoMovieSwivelSeed } from "./IAutoMovieSwivelSeed";

/**
 * A hinged chain's fit continued from a nearby one: the seed's branch, and its
 * swivel refined within one sweep step either way to `tolerance`, in place of
 * the sweep over every swivel (`hingedArmArticulation`).
 *
 * This is an explicit local-basin policy, not evidence that the current target
 * is nearby, its score is unimodal, or the cold global winner stays within a
 * degree. A deterministic curve owner must establish its phase anchors and
 * current endpoint/orientation/ROM/contact/branch checks, then subdivide or
 * fall back at unsupported events. The seed itself carries no such certificate.
 * Query arrival order must not choose a curve's anchors.
 */
export interface IAutoMovieSwivelNear extends IAutoMovieSwivelSeed {
  /**
   * The width of the swivel bracket the refinement stops at, degrees, finite
   * and positive. This sets the ideal contraction's target width; binary64
   * probes can coincide before a smaller width is representable. An arbitrary
   * score has no global objective-error or global-minimum bound.
   */
  tolerance: number;

  /**
   * Whether the seed is prescribed rather than continued: the chain is placed
   * at the seed's swivel and branch exactly, in closed form
   * (`fitHingedChainAt`), with no refinement or search. For a course that
   * already chose the limb's swivel at this instant (a displayed limb read
   * between the knots its course fitted), so the branch cannot change and no
   * read sweeps. Absent, the seed is refined to `tolerance`.
   */
  prescribed?: boolean;
}
