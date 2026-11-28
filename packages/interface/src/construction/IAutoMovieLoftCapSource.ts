import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/** Data and callback contracts shared by the LoftCapSource operations. */
export namespace IAutoMovieLoftCapSource {
  /**
   * Original closed end retained from a loft's prepared view source. Retention
   * binds the pole, nearest principal row, scalar source and actual axis before
   * readers reuse the record. Keep the original source, retained data and the
   * corresponding layer unchanged while the cap remains attached.
   */
  export interface ISource {
    /** Closed endpoint of the original scalar domain, in station millimetres. */
    station: number;

    /** Station of the nearest principal layer on this end, in millimetres. */
    adjacent: number;

    /**
     * Actual view axis used at cap stations. Its value callback supports
     * position reads. Its optional jet callback supplies physical-station
     * derivatives when available.
     */
    axis: IAutoMovieViewPart["axis"];

    /**
     * Independent [x, y, z] copy of the original closed pole, in world
     * millimetres.
     */
    point: [number, number, number];

    /**
     * JSON snapshot of the adjacent layer's station, coefficient, frame, lift
     * and section-source binding data. Retain the cap again after changing the
     * bound layer.
     */
    boundary: string;

    /**
     * JSON snapshot of the prepared scalar view source used to establish
     * original cap ownership.
     */
    scalar: string;
  }
}
