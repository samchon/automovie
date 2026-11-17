import type { IAutoMovieHumanLegAxis } from "./IAutoMovieHumanLegAxis";

/**
 * Neighbouring ring centroids and forward mass offsets used to place the leg's section chart origins.
 *
 * The interface package owns these declarations; AutoMovieHumanLegCentreLine in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Neighbouring ring centroids and forward mass offsets used to place the leg's section chart origins. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IAnchor, IInput, OfResult declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IAnchor, IInput, OfResult separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanLegCentreLine exchanges the named IAnchor, IInput, OfResult contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
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
      /** Forward displacement along the section frame's u axis at this station, millimetres. */
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
