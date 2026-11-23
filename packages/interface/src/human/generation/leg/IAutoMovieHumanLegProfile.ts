import type { IAutoMovieHumanLegStations } from "./IAutoMovieHumanLegStations";

/**
 * Type contracts exchanged by AutoMovieHumanLegProfile; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanLegProfile {
  /** The rings a table ends on, each optional. */
  export interface IEnds {
    /** The ring under the table's rows: the foot's ankle ring. */
    bottom?: IEnd;

    /** The ring above the table's rows: the trunk's crotch ring. */
    top?: IEnd;
  }

  /** A neighbour's ring read as a row at its own station. */
  export interface IEnd {
    /** Station of the ring, mm. */
    at: number;

    /** The row's channels, in the order of the table it ends. */
    values: readonly number[];
  }

  /** One landmark row of a table. */
  export interface IRow {
    /** The bone the row stands on. */
    segment: IAutoMovieHumanLegStations.Segment;

    /**
     * Share of that bone: the thigh from the hip centre (0) to the knee centre
     * (1), the shank from the knee centre (0) to the ankle centre (1).
     */
    share: number;

    /** The row's channels, in the order its table declares. */
    values: readonly number[];
  }

  /** A placed knot of one channel. */
  export interface IKnot {
    /** Station, mm. */
    at: number;

    /** Value. */
    value: number;
  }

  /** A channel of a table at a station. */
  export type Channel = (s: number) => number;
}
