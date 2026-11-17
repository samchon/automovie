import type { IAutoMovieLoftSectionJet } from "./IAutoMovieLoftSectionJet";


/**
 * Original-cap station preparation shared by the cap reader and loft jet cache.
 *
 * @evidence contracts/development/design.md#principled-representation The nullable station plan separates ordinary principal rows from an admitted original cap with local and frame derivatives in physical millimetres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieLoftCapRead.jet publishes exactly the native reader and frame rows consumed by AutoMovieLoftJet's station preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An unavailable cap derivative throws from its producer instead of becoming the null ordinary-row case.
 * @evidence contracts/development/common.md#meaningful-documentation The result specifies phase units, row layout, ownership and the distinction between absence and failed admission.
 */
export namespace IAutoMovieLoftCapRead {
  /**
   * Prepared local and frame derivatives at one positive original-cap station.
   *
   * Null means that no retained original cap owns this station. A collapsed tip or unavailable physical derivatives cause AutoMovieLoftCapRead.jet to throw AutoMovieLoftAdmissionError; axis callback and stale-binding errors propagate. Finite point evaluation alone does not qualify a station for this result. The receiving loft jet cache retains the closure and copied rows under its immutable chain key.
   *
   * @evidence contracts/development/design.md#principled-representation Local total-order-two partials and three frame rows use the same physical station, allowing AutoMovieLoftWorldJet to apply the frame product rule.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The plan supplies the two preparations consumed by the existing loft station cache without duplicating a world evaluator.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The array type does not encode three rows of nine finite entries; the cap producer admits and constructs that layout before publishing it.
   * @evidence contracts/development/common.md#meaningful-documentation States null and thrown cases, derivative coordinates, frame ordering and cache lifetime.
   */
  export type IJetResult = {
      /** Evaluate local [u,v] position and partials at finite polar phase phi in radians; the closure retains its prepared scalar geometry and returns fresh mutable vectors. Numeric admission failures throw. */
      native: ((phi: number) => IAutoMovieLoftSectionJet);

      /** Three copied rows in value, first-station and second-station order, each [origin.xyz, u.xyz, v.xyz]. Origin units are mm, unitless and 1/mm; axis units are unitless, 1/mm and 1/mm². Consumers preserve these mutable rows while the station plan is cached. */
      f: number[][];
    } | null;
}
