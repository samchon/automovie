import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/**
 * A handler caring for a horse from the ground: one hand goes to a named place
 * on the horse, holds there through a care task, and lets go, while the handler
 * stands.
 *
 * The horse prop owns where every place is at every film second: its brush
 * points on the barrel, its poll, a hoof it lifts, its lead and its saddle's
 * pommel and cantle, each one of its contacts. A brushing hand strokes along
 * the contact's line. The action refuses a sample whose displayed hand cannot
 * reach the place.
 */
export interface IAutoMovieMotionHumanTendHorse {
  /** The horse prop's subject id in the performance. */
  on: string;

  /** The hand that does the care. */
  side: AutoMovieHumanSide;

  /** The horse's contact id the hand goes to. */
  point: string;

  /** What the hand does there. */
  task: IAutoMovieMotionHumanTendHorse.Task;

  /**
   * Seconds the action lasts, acquiring and releasing included, more than twice
   * `transition`. No natural value is defined: choose it for the beat
   * (provisional, missing).
   */
  duration: number;

  /**
   * Seconds the hand takes to reach the place, and again to let go, positive.
   * No natural value is defined: choose it for the beat (provisional,
   * missing).
   */
  transition: number;

  /**
   * For a brush, the stroke's length along the contact's line, metres,
   * nonnegative; zero when absent.
   */
  stroke?: number;

  /**
   * A prop the hand already holds and works the contact with, such as a brush;
   * the palm meets the contact itself when absent.
   */
  tool?: IAutoMovieMotionHumanTendHorse.ITool;
}

/** Companion types of {@link IAutoMovieMotionHumanTendHorse}. */
export namespace IAutoMovieMotionHumanTendHorse {
  /**
   * The care tasks: brushing the coat, handling the headgear at the poll,
   * holding the lead, settling the saddle and holding a lifted hoof.
   */
  export type Task = "brush" | "headgear" | "lead" | "saddle" | "hoof";

  /** A held tool and the contact of it that works the horse. */
  export interface ITool {
    /** The held prop's subject id. */
    prop: string;

    /** Its contact that meets the horse, such as a brush's bristle face. */
    face: string;
  }
}
