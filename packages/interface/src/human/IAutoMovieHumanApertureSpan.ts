/**
 * Aperture rim points and per-chain trim loops in station-millimetre and
 * phase-radian charts. Runtime construction and admission remain with
 * AutoMovieHumanApertureSpan in Human.
 */
export namespace IAutoMovieHumanApertureSpan {
  /**
   * A rim point on its chain, with its chart on the neighbour where it lies on
   * their shared ring.
   */
  export interface IPoint {
    /** The chain the point is evaluated on. */
    chain: string;

    /** Station, mm. */
    s: number;

    /** Phase, radians, on the branch the loop runs on. */
    t: number;

    /** The same point in the neighbour's chart, for a point on the shared ring. */
    also?: IPointAlso;
  }

  /** The also object of {@link IPoint}. */
  export type IPointAlso = {
    /** Skin chain whose surface carries this aperture point. */
    chain: string;
    /** Physical station along that chain, calibration millimetres. */
    s: number;
    /**
     * Section phase in radians, increasing according to the source curve's
     * orientation.
     */
    t: number;
  };

  /** An opening's trim on one or two chains. */
  export interface ISpan {
    /** The chains, the one holding the most points first. */
    chains: string[];

    /** The rim: the feet of the kept margin points, in margin order. */
    points: IPoint[];

    /**
     * Each chain's polygon `[station, phase]` for the cells it leaves out,
     * closed past the shared ring.
     */
    loops: Map<string, [number, number][]>;
  }
}
