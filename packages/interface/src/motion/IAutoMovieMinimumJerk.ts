/** Data and callback contracts shared by the MinimumJerk operations. */
export namespace IAutoMovieMinimumJerk {
  /** The profile at one instant. */
  export interface IProfile {
    /** Share of the movement done, in [0, 1]. */
    s: number;

    /** Rate of the share per unit normalized time. */
    ds: number;

    /** Acceleration of the share per unit normalized time squared. */
    dds: number;
  }
}
