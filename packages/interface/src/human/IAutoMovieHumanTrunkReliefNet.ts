import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * A trunk-chart base surface and bounded station/phase footprints for local
 * reliefs.
 *
 * The interface package owns these declarations; AutoMovieHumanTrunkReliefNet
 * in Human supplies their runtime values.
 */
export namespace IAutoMovieHumanTrunkReliefNet {
  /** An increasing station range on the trunk chart, mm. */
  export interface IStationRange {
    start: number;
    end: number;
  }

  /** An increasing phase range on the trunk chart, radians. */
  export interface IPhaseRange {
    start: number;
    end: number;
  }

  /** The apex place as fractions of the station and phase ranges. */
  export interface IApexPlace {
    station: number;
    phase: number;
  }

  /** The lowest and highest station a window may reach, mm. */
  export interface IStationBounds {
    minimum: number;
    maximum: number;
  }

  /**
   * The chart's base surface: the body point at a station and a phase, with the
   * stations its windows stay within, the chart's two shared ends.
   */
  export type Base = ((
    station: number,
    phase: number,
  ) => AutoMovieVector3Tuple) & {
    /** The lowest and highest station a window may reach, mm. */
    bounds?: IStationBounds;
  };

  /** Where the feature lies on the chart. */
  export interface IWindow {
    /** The footprint's station range, mm. */
    stations: IStationRange;

    /** The footprint's phase range, radians, increasing. */
    phases: IPhaseRange;

    /** The apex's place in the footprint as fractions of each range. */
    apex: IApexPlace;
  }
}
