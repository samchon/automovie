import type { IAutoMovieConstructionOutline } from "./IAutoMovieConstructionOutline";

/**
 * Fullness owned by a stated law: the common conic shoulder per station, plus
 * each quarter's departure from it.
 *
 * A station whose shoulders fall outside `(0, 1)` or give no valid section (a
 * radius not above zero, a turn against convexity, a point past its box) is
 * left out of the chain with one diagnostic.
 */
export interface IAutoMovieConstructionShoulder {
  /** Discriminator. */
  type: "shoulder";

  /**
   * The common shoulder share per station, inside `(0, 1)`, `sqrt(2) - 1` the
   * ellipse.
   */
  shoulder: IAutoMovieConstructionOutline;

  /**
   * Each quarter's departure from the common shoulder, by increasing angle;
   * null for none.
   */
  departures:
    | [
        IAutoMovieConstructionOutline,
        IAutoMovieConstructionOutline,
        IAutoMovieConstructionOutline,
        IAutoMovieConstructionOutline,
      ]
    | null;
}
