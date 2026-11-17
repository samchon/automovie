import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/** Type contracts exchanged by AutoMovieHumanLimbRootStrip; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanLimbRootStrip {
  /**
   * One end of a column: its point and its derivatives along the strip's run,
   * the run counted from the trunk's ring into the limb.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One end of a column: its point and its derivatives along the strip's run, the run counted from the trunk's ring into the limb.
   * @evidence contracts/development/design.md#principled-representation `point`: The point, mm. `first`: First derivative along the run, mm per mm. `second`: Second derivative along the run, per mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLimbRootStrip.under, AutoMovieHumanLimbRootStrip.jet, AutoMovieHumanLimbRootStrip.edge. Read by AutoMovieHumanLimbRootStrip.under. Also types AutoMovieHumanLimbRootStrip.columns, AutoMovieHumanLimbRootStrip.a.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `point`, `first`, `second`; callers supply the complete record.
   */
  export interface IJet {
    /** The point, mm. */
    point: AutoMovieVector3Tuple;

    /** First derivative along the run, mm per mm. */
    first: AutoMovieVector3Tuple;

    /** Second derivative along the run, per mm. */
    second: AutoMovieVector3Tuple;
  }

  /** What the strip is built from.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the strip is built from.
   * @evidence contracts/development/design.md#principled-representation `start`: The trunk's ring at the limb's phases with its jet down across the ring. `end`: The limb's own section at the strip's far end with its law's jet, one per phase.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanLimbRootStrip.strip. Also types AutoMovieHumanLimbRootStrip.{ start, end }.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `start`, `end`; callers supply the complete record.
   */
  export interface IInputs {
    /** The trunk's ring at the limb's phases with its jet down across the ring. */
    start: IJet[];

    /** The limb's own section at the strip's far end with its law's jet, one per phase. */
    end: IJet[];
  }

  /** The strip.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The strip.
   * @evidence contracts/development/design.md#principled-representation The strip.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLimbRootStrip.strip. Also types AutoMovieHumanArmLaw.strip, AutoMovieHumanLegChain.strip.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanArmLaw.strip, AutoMovieHumanLimbRootStrip.strip, AutoMovieHumanLegChain.strip, AutoMovieHumanLegChain.ankle for the strip.
   */
  export interface IStrip {
    /**
     * Points at a share of the run, one per phase: 0 the ring, 1 the limb's
     * own section. A share outside `[0, 1]` reads the columns' polynomials
     * past their ends, as the chains' station differences do.
     */
    ring(w: number): AutoMovieVector3Tuple[];
  }

  /** The at argument of AutoMovieHumanLimbRootStrip.jet. The jet of a smooth curve along its run, read by central differences of
  its points a step either side.
  @param at The curve's point at a run, mm.
  @param run Where the jet is read, mm.
  @param step Half the span the differences are read over, mm.
  @returns The point and its first and second derivatives per mm.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The jet of a smooth curve along its run, read by central differences of its points a step either side.
 * @evidence contracts/development/design.md#principled-representation The jet of a smooth curve along its run, read by central differences of its points a step either side. The callable takes run and returns AutoMovieVector3Tuple.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLimbRootStrip.JetAt is the canonical exchange used by AutoMovieHumanLimbRootStrip.jet.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLimbRootStrip.jet for the jet of a smooth curve along its run, read by central differences of its points a step either side.
 */
  export type JetAt = (run: number) => AutoMovieVector3Tuple;

  /** The at argument of AutoMovieHumanLimbRootStrip.edge. The jet of a smooth curve at its end, read by one-sided differences of
  third order into it, since nothing exists past the end.
  @param at The curve's point at a run, mm.
  @param run Where the jet is read, mm: the curve's end.
  @param step Step of the differences, mm, signed into the curve.
  @returns The point and its first and second derivatives per mm.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The jet of a smooth curve at its end, read by one-sided differences of third order into it, since nothing exists past the end.
 * @evidence contracts/development/design.md#principled-representation The jet of a smooth curve at its end, read by one-sided differences of third order into it, since nothing exists past the end. The callable takes run and returns AutoMovieVector3Tuple.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLimbRootStrip.EdgeAt is the canonical exchange used by AutoMovieHumanLimbRootStrip.edge.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLimbRootStrip.edge for the jet of a smooth curve at its end, read by one-sided differences of third order into it, since nothing exists past the end.
 */
  export type EdgeAt = (run: number) => AutoMovieVector3Tuple;
}
