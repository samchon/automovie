/** Data and callback contracts shared by the ScheduleCut operations. */
export namespace IAutoMovieScheduleCut {
  /**
   * A cut: its share of the duration and the event it was found at.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's meaning and range.
   * @evidence contracts/development/design.md#principled-representation A cut is a share in [0, 1] of the duration, with the event it was found at when it was found at one.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both written onto the schedule's entry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No intent or law is named; the event is optional because a share needs none.
   */
  export interface ICut {
    /** The share of the duration, in [0, 1]. */
    share: number;

    /** The event the cut was found at, `of.event` for another anchor's. */
    event?: string;
  }
}
