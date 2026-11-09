import type { IAutoMovieConstructionOutline } from "./IAutoMovieConstructionOutline";

/**
 * Fullness owned by a stated law: the common conic shoulder per station, plus each quarter's departure from it.
 *
 * A station whose shoulders fall outside `(0, 1)` or give no valid section (a radius not above zero, a turn against convexity, a point past its box) is left out of the chain with one diagnostic.
 *
 * @evidence contracts/development/design.md#principled-representation A fullness law in shoulder share is the conic lofting quantity itself, so a sourced law enters without a girth.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One shoulder curve and optional departures mirror the girth owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An invalid station is left out and reported, never clamped to a valid shoulder.
 * @evidence contracts/development/common.md#meaningful-documentation States the owner, the validity rules and their failure effect, and the departures' meaning and null.
 */
export interface IAutoMovieConstructionShoulder {
  /** Discriminator. */
  type: "shoulder";

  /** The common shoulder share per station, inside `(0, 1)`, `sqrt(2) - 1` the ellipse. */
  shoulder: IAutoMovieConstructionOutline;

  /** Each quarter's departure from the common shoulder, by increasing angle; null for none. */
  departures:
    | [
        IAutoMovieConstructionOutline,
        IAutoMovieConstructionOutline,
        IAutoMovieConstructionOutline,
        IAutoMovieConstructionOutline,
      ]
    | null;
}
