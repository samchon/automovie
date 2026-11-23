import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/**
 * A trunk-chart base surface and bounded station/phase footprints for local
 * reliefs.
 *
 * The interface package owns these declarations; AutoMovieHumanTrunkReliefNet
 * in Human supplies their runtime values.
 */
export namespace IAutoMovieHumanTrunkReliefNet {
  /**
   * The chart's base surface: the body point at a station and a phase, with the
   * stations its windows stay within, the chart's two shared ends.
   */
  export type Base = ((
    station: number,
    phase: number,
  ) => AutoMovieVector3Tuple) & {
    /** The lowest and highest station a window may reach, mm. */
    bounds?: [number, number];
  };

  /** Where the feature lies on the chart. */
  export interface IWindow {
    /** The footprint's station range, mm. */
    stations: [number, number];

    /** The footprint's phase range, radians, increasing. */
    phases: [number, number];

    /** The apex's place in the footprint as fractions of each range. */
    apex: [number, number];
  }
}
