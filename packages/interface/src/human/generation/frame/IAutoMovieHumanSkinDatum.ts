import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * Public contracts for a section datum.
 */
export namespace IAutoMovieHumanSkinDatum {
  /**
   * A section frame of a wall's course: origin and the section plane's unit `u` and `v`, figure frame.
   */
  export interface IFrame {
    /** The course point, mm. */
    origin: readonly number[];
    /** The section plane's first axis. */
    u: readonly number[];
    /** The section plane's second axis. */
    v: readonly number[];
  }

  /**
   * A wall: its course frame by station, a point's station on it, and its directional tissue ratio by station.
   */
  export interface IWall {
    /** The course frame at a station, mm. */
    at: (station: number) => IFrame;
    /** The course station of a point, mm. */
    station: (point: AutoMovieVector3Tuple) => number;
    /** The wall's depth and breadth ratios, along `u` and `v`, at a station. */
    ratio: (station: number) => readonly [number, number];
  }
}
