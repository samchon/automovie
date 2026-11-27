import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * Observed section charts and the shoulder-to-wrist walk, with millimetre
 * stations and unit headings. Runtime construction and admission remain with
 * AutoMovieHumanArmAxis in Human.
 */
export namespace IAutoMovieHumanArmAxis {
  /**
   * One physically observed absolute digit section frame in native world
   * millimetres.
   */
  export interface IFixedChart {
    /** Distance along the unchanged source course, millimetres. */
    stationMm: number;

    /** Absolute plane origin in native world millimetres. */
    originMm: AutoMovieVector3Tuple;

    /** First observed tangent to the section plane. */
    u: AutoMovieVector3Tuple;

    /** Second observed tangent in the native chart's handedness. */
    v: AutoMovieVector3Tuple;
  }

  /** The walk. */
  export interface IAxis {
    /** Point at a walk length. */
    at(s: number): AutoMovieVector3Tuple;

    /** Unit heading at a walk length, away from the shoulder. */
    heading(s: number): AutoMovieVector3Tuple;

    /** Walk length of the turn's middle, where the heading bisects the corner. */
    elbow: number;

    /**
     * Walk length of a station a distance down the forearm from the elbow
     * centre, along it; inside the turn, the share of the way from the turn's
     * middle to its end.
     */
    fore(d: number): number;

    /**
     * Walk length of a station a distance down the humerus from the shoulder
     * centre; inside the turn, the share of the way from its start to its
     * middle.
     */
    upper(d: number): number;

    /** Half the turn's length, mm. */
    soft: number;
  }
}
