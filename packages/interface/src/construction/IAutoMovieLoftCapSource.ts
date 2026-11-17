import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/** Data and callback contracts shared by the LoftCapSource operations. */
export namespace IAutoMovieLoftCapSource {
  /**
   * Immutable source capability for one actual retained closed end.
   *
   * @evidence contracts/development/design.md#principled-representation Stores actual generating ownership separately from principal projection data and physical-jet availability.
   * @evidence contracts/development/design.md#minimal-and-owned-surface End station, adjacent station and independent bindings define precisely the retained interval.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Value copies preserve numeric bindings; callable axes must be retained or rebuilt, never restored from JSON as a hidden registration.
   * @evidence contracts/development/common.md#meaningful-documentation Coordinates are physical station mm, point is world mm, and callback dependencies must remain immutable for reader lifetime.
   */
  export interface ISource {
    /** Original closed station in mm. */
    station: number;

    /** Unchanged nearest principal row, in mm. */
    adjacent: number;

    /** Actual original axis; value-only axes remain value-only. */
    axis: IAutoMovieViewPart["axis"];

    /** Independent original world pole value. */
    point: [number, number, number];

    /** Exact numeric boundary snapshot; changed producers must re-express it. */
    boundary: string;

    /** Exact plain scalar snapshot, independent of its retained source record. */
    scalar: string;
  }
}
