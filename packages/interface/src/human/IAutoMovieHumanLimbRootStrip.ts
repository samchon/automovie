import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * Endpoint jets and strip-ring readers connecting a trunk opening to a limb's
 * own sections.
 *
 * The interface package owns these declarations; AutoMovieHumanLimbRootStrip in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanLimbRootStrip {
  /**
   * One end of a column: its point and its derivatives along the strip's run,
   * the run counted from the trunk's ring into the limb.
   */
  export interface IJet {
    /** The point, mm. */
    point: AutoMovieVector3Tuple;

    /** First derivative along the run, mm per mm. */
    first: AutoMovieVector3Tuple;

    /** Second derivative along the run, per mm. */
    second: AutoMovieVector3Tuple;
  }

  /** What the strip is built from. */
  export interface IInputs {
    /** The trunk's ring at the limb's phases with its jet down across the ring. */
    start: IJet[];

    /**
     * The limb's own section at the strip's far end with its law's jet, one per
     * phase.
     */
    end: IJet[];
  }

  /** The strip. */
  export interface IStrip {
    /**
     * Points at a share of the run, one per phase: 0 the ring, 1 the limb's own
     * section. A share outside `[0, 1]` reads the columns' polynomials past
     * their ends, as the chains' station differences do.
     */
    ring(w: number): AutoMovieVector3Tuple[];
  }

  /**
   * The at argument of AutoMovieHumanLimbRootStrip.jet. The jet of a smooth
   * curve along its run, read by central differences of its points a step
   * either side.
   *
   * @param at The curve's point at a run, mm.
   * @param run Where the jet is read, mm.
   * @param step Half the span the differences are read over, mm.
   * @returns The point and its first and second derivatives per mm.
   */
  export type JetAt = (run: number) => AutoMovieVector3Tuple;

  /**
   * The at argument of AutoMovieHumanLimbRootStrip.edge. The jet of a smooth
   * curve at its end, read by one-sided differences of third order into it,
   * since nothing exists past the end.
   *
   * @param at The curve's point at a run, mm.
   * @param run Where the jet is read, mm: the curve's end.
   * @param step Step of the differences, mm, signed into the curve.
   * @returns The point and its first and second derivatives per mm.
   */
  export type EdgeAt = (run: number) => AutoMovieVector3Tuple;
}
