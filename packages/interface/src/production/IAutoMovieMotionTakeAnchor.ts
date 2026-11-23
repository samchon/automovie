/**
 * A source occurrence at one edited instant, resolved by the engine from an
 * admitted cut.
 */
export interface IAutoMovieMotionTakeAnchor {
  /** Id of the edited sequence. */
  sequence: string;

  /** Zero-based index into the edited sequence, including repeated shots. */
  entry: number;

  /** Id of this occurrence's source shot. */
  shot: string;

  /** Finite, nonnegative seconds on the edited output clock. */
  outputSeconds: number;

  /** Finite, nonnegative seconds on the selected shot's authored clock. */
  sourceSeconds: number;

  /**
   * Select the outgoing (`before`) or incoming (`after`) side of a hard cut.
   * Interior samples use `after`.
   */
  side: "before" | "after";
}
