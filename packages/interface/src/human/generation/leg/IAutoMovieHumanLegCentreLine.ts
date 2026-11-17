import type { IAutoMovieHumanLegAxis } from "./IAutoMovieHumanLegAxis";

/** Type contracts exchanged by AutoMovieHumanLegCentreLine; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanLegCentreLine {
  /** A centroid the line passes through.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A centroid the line passes through.
   * @evidence contracts/development/design.md#principled-representation `at`: Station, mm. `point`: The centroid in the canonical body frame, `[x, z]` mm (the ring's plane is horizontal).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanLegCentreLine.offset.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `at`, `point`; callers supply the complete record.
   */
  export interface IAnchor {
    /** Station, mm. */
    at: number;

    /** The centroid in the canonical body frame, `[x, z]` mm (the ring's plane is horizontal). */
    point: readonly [number, number];
  }

  /** What the line is placed from.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the line is placed from.
   * @evidence contracts/development/design.md#principled-representation `frames`: The leg's frames. `ankle`: The ankle ring's centroid at the leg's first station. `crotch`: The crotch arc's centroid at the leg's last station.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanLegCentreLine.of.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `frames`, `ankle`, `crotch`, `knee`, `mass`; callers supply the complete record.
   */
  export interface IInput {
    /** The leg's frames. */
    frames: IAutoMovieHumanLegAxis.IFrames;

    /** The ankle ring's centroid at the leg's first station. */
    ankle: IAnchor;

    /** The crotch arc's centroid at the leg's last station. */
    crotch: IAnchor;

    /** Station of the knee centre, mm. */
    knee: number;

    /**
     * The sections' centres ahead of the bone where the leg's own law stands,
     * by the limb's mass prior (`AutoMovieHumanLegMassPrior`): station and
     * forward offset, mm.
     */
    mass: readonly {
      /** Bone-relative station of this centre-line control, in the containing line's declared coordinate. */
      at: number;
      /** Lateral displacement of the centre line at this station, millimetres. */
      offset: number;
    }[];
  }

  /** Result of AutoMovieHumanLegCentreLine.of. The centre line.
  @param input The frames and the three places.
  @returns The chart origin's offset from the frame origin at a station, `[along u, along v]` mm.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The centre line.
 * @evidence contracts/development/design.md#principled-representation The centre line. The callable takes s and returns [number, number].
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLegCentreLine.OfResult is the canonical exchange used by AutoMovieHumanLegCentreLine.of.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLegCentreLine.of for the centre line.
 */
  export type OfResult = (s: number) => [number, number];
}
