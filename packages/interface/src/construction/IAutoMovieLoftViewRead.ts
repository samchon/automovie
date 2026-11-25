import type { IAutoMovieViewSectionField } from "./IAutoMovieViewSectionField";

/** Data and callback contracts shared by the LoftViewRead operations. */
export namespace IAutoMovieLoftViewRead {
  /** Finite original values, before native shape admission. */
  export interface IValues {
    /** Four extent values, mm; native section admission still checks positivity. */
    extents: number[];

    /** Four effective shoulder values after their existing cap law. */
    shoulders: number[];

    /** Four touch offsets, mm, when the source declares them. */
    touch?: number[];

    /** Four splits `[u, v, angle, shoulder]`, when the source declares them. */
    splits?: number[][];

    /**
     * Each quarter's ordered split points `[u, v, angle, shoulder]`, when the
     * source declares them.
     */
    pieces?: number[][][];
  }

  /** Actual finite physical-station source2 inputs of the shared native field. */
  export interface IJets {
    /** Four extent source2 tuples in physical station. */
    extents: IAutoMovieViewSectionField.IStationJet[];

    /** Four effective shoulder source2 tuples in that same station. */
    shoulders: IAutoMovieViewSectionField.IStationJet[];

    /** Four touch-offset source2 tuples, when the source declares them. */
    touch?: IAutoMovieViewSectionField.IStationJet[];

    /**
     * Four splits of four source2 tuples each, `[u, v, angle, shoulder]`, when
     * the source declares them.
     */
    splits?: IAutoMovieViewSectionField.IStationJet[][];

    /**
     * Each quarter's ordered split points, four source2 tuples each, when the
     * source declares them.
     */
    pieces?: IAutoMovieViewSectionField.IStationJet[][][];
  }
}
