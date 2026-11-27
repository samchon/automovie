/** Data and callback contracts shared by the ScheduleCut operations. */
export namespace IAutoMovieScheduleCut {
  /** A cut: its share of the duration and the event it was found at. */
  export interface ICut {
    /** The share of the duration, in [0, 1]. */
    share: number;

    /** The event the cut was found at, `of.event` for another anchor's. */
    event?: string;
  }
}
