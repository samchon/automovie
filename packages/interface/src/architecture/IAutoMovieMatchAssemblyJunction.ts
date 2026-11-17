import type { IAutoMovieResolvedAssembly } from "./IAutoMovieResolvedAssembly";

/**
 * Data and callback contracts shared by the MatchAssemblyJunction operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Report which construction roles survive a junction between two build-ups. Member documentation states the supplied records, units and absence meanings used by matchAutoMovieAssemblyJunction.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The caller must establish the same axis and origin for both resolved assemblies; matchAssemblyJunction cannot establish that relationship from host-local axes alone.
 * @evidence contracts/development/design.md#principled-representation left and right are resolved build-ups on one shared measuring line; tolerance is the finite nonnegative metre gap accepted between matching role spans.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieMatchAssemblyJunction, used by matchAutoMovieAssemblyJunction. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieMatchAssemblyJunction {
  /**
   * Report which construction roles survive a junction between two build-ups.
   *
   * Two walls meeting at a corner are two build-ups on one measuring line, and
   * the question a junction asks is not whether they look alike but whether each
   * role reaches across. A role both sides declare is continuous, and the signed
   * spans say whether it actually lines up or merely exists on both sides: an
   * insulation layer that ends where the next one begins is a thermal bridge, and
   * a barrier that stops at a corner is a leak.
   *
   * Roles are matched as declared: the caller decides what a role name means, and
   * a build-up that spends the same role over several layers has those layers
   * summed and spanned together rather than silently reduced to the first one.
   *
   * Spans are compared as numbers on one measuring line, so both build-ups must
   * have been resolved against the same axis and origin; nothing here checks
   * that, because a resolved assembly's axis is host-local and cannot prove two
   * hosts share a line. `overlap` is negative when the spans are apart, and a
   * role is `aligned` when the gap is no larger than `tolerance`. Continuous
   * roles follow the left side's first-appearance order; broken roles list the
   * left side's first, then the right side's. A negative or non-finite tolerance
   * throws an `Error`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Report which construction roles survive a junction between two build-ups. Member documentation states the supplied records, units and absence meanings used by matchAutoMovieAssemblyJunction.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The caller must establish the same axis and origin for both resolved assemblies; matchAssemblyJunction cannot establish that relationship from host-local axes alone.
   * @evidence contracts/development/design.md#principled-representation left and right are resolved build-ups on one shared measuring line; tolerance is the finite nonnegative metre gap accepted between matching role spans.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieMatchAssemblyJunction.IProps, used by matchAutoMovieAssemblyJunction. Its left, right, tolerance members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** Build-up on one side of the junction, resolved on the shared line. */
    left: IAutoMovieResolvedAssembly;

    /** Build-up on the other side, resolved on the same line as `left`. */
    right: IAutoMovieResolvedAssembly;

    /** Greatest metre gap between two spans still counted as aligned. */
    tolerance: number;
  };
}
