import type { IAutoMovieMotionHumanTurnOver } from "./IAutoMovieMotionHumanTurnOver";

/**
 * Lie together with a partner (#4012): from lying beside them, settle
 * against them and stay, carried by their body as it breathes and shifts,
 * either spooning (on the side behind a partner lying on the same side,
 * the chest against their back) or with the head on their chest (on the
 * side facing a partner lying on the back, the lower cheek on their chest).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two ways, what touches what and every member's meaning.
 * @evidence contracts/development/design.md#principled-representation The partner, the way and the span; every place follows from the two lying bodies.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members `lieTogether` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A performer or partner not lying, partners lying apart and a chest the head cannot reach are refused at runtime.
 */
export interface IAutoMovieMotionHumanLieTogether {
  /** The partner lain against, already lying. */
  partner: string;

  /** The way the two lie together. */
  way: IAutoMovieMotionHumanLieTogether.Way;

  /** How long they lie together, seconds; positive. Required: no natural value is defined, so the author sets it (provisional: no timing study was read). */
  seconds: number;

  /** The bed or sofa surface both lie on; the floor when absent. */
  on?: IAutoMovieMotionHumanTurnOver.IOn;
}

/**
 * Companion types of {@link IAutoMovieMotionHumanLieTogether}.
 */
export namespace IAutoMovieMotionHumanLieTogether {
  /** Spooning behind the partner, or the head on the partner's chest. */
  export type Way = "spoon" | "chest";
}
