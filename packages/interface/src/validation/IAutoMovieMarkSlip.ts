import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Per-contact displacement measurements converted to world inspection marks. */
export namespace IAutoMovieMarkSlip {
  /**
   * Borrowed contacts at one instant for markAutoMovieSlip. Horizontal XZ
   * displacement above zero yields one unanchored steel-blue (0x4682b4) segment
   * mark in entry order, with kind/label "slip" and path ending "/slip".
   * Displacement strictly greater than limit is flagged; purely vertical motion
   * yields no mark.
   *
   * Every point component must be finite and each limit finite and nonnegative
   * or the producer throws. Coordinates are copied into fresh numeric segment
   * arrays, so successful output retains no point records and inputs stay
   * unchanged. Finite endpoints do not independently guarantee finite
   * subtraction at extreme magnitudes.
   */
  export type IEntries = readonly {
    /**
     * Contact's diagnostic identity; "/slip" is appended literally, without
     * validation or normalization.
     */
    path: string;

    /**
     * World point in metres where the contact was planted, copied into the
     * segment start.
     */
    planted: IAutoMovieVector3;

    /** Current world point in metres, copied into the segment end. */
    at: IAutoMovieVector3;

    /**
     * Finite nonnegative allowed XZ displacement in metres; equality remains
     * unflagged.
     */
    limit: number;
  }[];
}
