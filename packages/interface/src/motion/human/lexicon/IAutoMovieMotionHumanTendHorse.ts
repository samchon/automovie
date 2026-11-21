import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * A handler caring for a horse from the ground: one hand goes to a named place on the horse, holds there through a care task, and lets go, while the handler stands.
 *
 * The horse prop owns where every place is at every film second: its brush points on the barrel, its poll, a hoof it lifts, its lead and its saddle's pommel and cantle, each one of its contacts. A brushing hand strokes along the contact's line. The action refuses a sample whose displayed hand cannot reach the place.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the support, the hand, the contact, the task, the film-second duration, the acquire and release intervals and the stroke.
 * @evidence contracts/development/design.md#principled-representation One named contact on one prop for one hand over a finite interval, with the task as a closed union; timing is checked when the action is planned and reach at each sample.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The handler's stance is the entry's and the horse prop owns the contact's world frame; this record names only what the hand does.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No horse pose, course or response is supplied here; the horse's responses are authored on the horse.
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

  /** Seconds the action lasts, acquiring and releasing included, more than twice `transition`. */
  seconds: number;

  /** Seconds the hand takes to reach the place, and again to let go, positive. */
  transition: number;

  /** For a brush, the stroke's length along the contact's line, metres, nonnegative; zero when absent. */
  stroke?: number;
}

/** Companion types of {@link IAutoMovieMotionHumanTendHorse}. */
export namespace IAutoMovieMotionHumanTendHorse {
  /**
   * The care tasks: brushing the coat, handling the headgear at the poll, holding the lead, settling the saddle and holding a lifted hoof.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each task.
   * @evidence contracts/development/design.md#principled-representation Closed literals.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The task decides the contact's kind and whether the hand strokes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Closed literals, not free text.
   */
  export type Task = "brush" | "headgear" | "lead" | "saddle" | "hoof";
}
