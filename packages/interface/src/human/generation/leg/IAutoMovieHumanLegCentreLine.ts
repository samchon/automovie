import type { IAutoMovieHumanLegAxis } from "./IAutoMovieHumanLegAxis";

/**
 * Neighbouring ring centroids and forward mass offsets used to place the leg's
 * section chart origins.
 *
 * The interface package owns these declarations; AutoMovieHumanLegCentreLine in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanLegCentreLine {
  /** A centroid the line passes through. */
  export interface IAnchor {
    /** Station, mm. */
    at: number;

    /**
     * The centroid in the canonical body frame, `[x, z]` mm (the ring's plane
     * is horizontal).
     */
    point: readonly [number, number];
  }

  /** What the line is placed from. */
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
      /**
       * Bone-relative station of this centre-line control, in the containing
       * line's declared coordinate.
       */
      at: number;
      /**
       * Forward displacement along the section frame's u axis at this station,
       * millimetres.
       */
      offset: number;
    }[];
  }

  /**
   * Result of AutoMovieHumanLegCentreLine.of. The centre line.
   *
   * @param input The frames and the three places.
   * @returns The chart origin's offset from the frame origin at a station,
   *   `[along u, along v]` mm.
   */
  export type OfResult = (s: number) => [number, number];
}
