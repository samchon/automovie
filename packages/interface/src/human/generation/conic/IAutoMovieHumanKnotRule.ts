/**
 * Public contracts for anatomical knot placement.
 */
export namespace IAutoMovieHumanKnotRule {
  /**
   * What the rule reads of one family.
   */
  export interface IInput {
    /** The run ends along the course, mm, increasing: the first station, each interior course centre, the last station. */
    runs: readonly number[];

    /** The measurement sites' stations, mm. */
    sites: readonly number[];

    /** Each outline whose extrema take a knot, as a smooth function of the station, mm. */
    outlines: readonly ((station: number) => number)[];

    /** The section's mean reach by station, mm: the scale of the form. */
    reach: (station: number) => number;

    /** The least distance between two knots as a share of the mean reach where they stand. */
    share: number;

    /** The spacing the outlines are searched at, mm: finer than the narrowest belly to be found. */
    step: number;
  }

  /**
   * One knot with why it stands.
   */
  export interface IKnot {
    /** Its station, mm. */
    station: number;

    /** What put it there. A run end and a site are kept whatever stands beside them. */
    basis: "run" | "site" | "extremum";
  }
}
