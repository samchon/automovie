/**
 * One nonnegative film time authored as a frame index or frame-grid second.
 *
 * Each value selects one representation. Engine film-time measurement resolves
 * it against the current timeline's clock and rejects mixed representations,
 * off-grid seconds, out-of-range frames and frames with no segment owner.
 */
export type IAutoMovieFilmTime =
  | IAutoMovieFilmTime.IFrame
  | IAutoMovieFilmTime.ISeconds;

export namespace IAutoMovieFilmTime {
  /** One exact zero-based frame index on the production clock. */
  export interface IFrame {
    /** Select a production frame directly. */
    readonly type: "frame";

    /** Zero-based production frame. */
    readonly frame: number;

    /** A frame selector supplies no independent second value. */
    readonly seconds?: never;
  }

  /** One instant in seconds on the production clock. */
  export interface ISeconds {
    /** Select a frame through the production clock's frames per second. */
    readonly type: "seconds";

    /** Seconds that must land on the production frame grid. */
    readonly seconds: number;

    /** A second selector supplies no independent frame index. */
    readonly frame?: never;
  }
}
