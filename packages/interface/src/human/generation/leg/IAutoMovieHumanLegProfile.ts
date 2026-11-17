import type { IAutoMovieHumanLegStations } from "./IAutoMovieHumanLegStations";

/**
 * Type contracts exchanged by AutoMovieHumanLegProfile; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanLegProfile exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IEnds, IEnd, IRow, IKnot, Channel. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanLegProfile; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IEnds, IEnd, IRow, IKnot, Channel contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanLegProfile {
  /** The rings a table ends on, each optional.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The rings a table ends on, each optional.
   * @evidence contracts/development/design.md#principled-representation `bottom`: The ring under the table's rows: the foot's ankle ring. `top`: The ring above the table's rows: the trunk's crotch ring.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanLegGuides.profile, AutoMovieHumanLegProfile.channel. Also types AutoMovieHumanLegGuides.guideEnds, AutoMovieHumanLegGuides.sectorEnds.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `bottom`: The ring under the table's rows: the foot's ankle ring. `top`: The ring above the table's rows: the trunk's crotch ring.
   */
  export interface IEnds {
    /** The ring under the table's rows: the foot's ankle ring. */
    bottom?: IEnd;

    /** The ring above the table's rows: the trunk's crotch ring. */
    top?: IEnd;
  }

  /** A neighbour's ring read as a row at its own station.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A neighbour's ring read as a row at its own station.
   * @evidence contracts/development/design.md#principled-representation `at`: Station of the ring, mm. `values`: The row's channels, in the order of the table it ends.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanLegGirth.end, AutoMovieHumanLegGuides.row.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `at`, `values`; callers supply the complete record.
   */
  export interface IEnd {
    /** Station of the ring, mm. */
    at: number;

    /** The row's channels, in the order of the table it ends. */
    values: readonly number[];
  }

  /** One landmark row of a table.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One landmark row of a table.
   * @evidence contracts/development/design.md#principled-representation `segment`: The bone the row stands on. `share`: Share of that bone: the thigh from the hip centre (0) to the knee centre (1), the shank from the knee centre (0) to the ankle centre (1). `values`: The row's channels, in the order its table declares.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanLegProfile.channel, AutoMovieHumanLegProfile.reach. Also types AutoMovieHumanLegSectionLaw.rows.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `segment`, `share`, `values`; callers supply the complete record.
   */
  export interface IRow {
    /** The bone the row stands on. */
    segment: IAutoMovieHumanLegStations.Segment;

    /** Share of that bone: the thigh from the hip centre (0) to the knee centre (1), the shank from the knee centre (0) to the ankle centre (1). */
    share: number;

    /** The row's channels, in the order its table declares. */
    values: readonly number[];
  }

  /** A placed knot of one channel.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A placed knot of one channel.
   * @evidence contracts/development/design.md#principled-representation `at`: Station, mm. `value`: Value.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLegProfile.joined. Read by AutoMovieHumanLegProfile.joined. Also types AutoMovieHumanLegGirth.end, AutoMovieHumanLegProfile.out.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `at`, `value`; callers supply the complete record.
   */
  export interface IKnot {
    /** Station, mm. */
    at: number;

    /** Value. */
    value: number;
  }

  /** A channel of a table at a station.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A channel of a table at a station.
   * @evidence contracts/development/design.md#principled-representation A channel of a table at a station. The callable takes s and returns number.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLegProfile.channel. Also types AutoMovieHumanLegGuides.fullness, AutoMovieHumanLegGuides.value.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLegGuides.fullness, AutoMovieHumanLegGuides.shape, AutoMovieHumanLegGuides.value, AutoMovieHumanLegGuides.slope for a channel of a table at a station.
   */
  export type Channel = (s: number) => number;
}
