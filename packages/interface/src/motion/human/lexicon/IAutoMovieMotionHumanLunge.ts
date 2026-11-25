import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Lunging a horse from the ground: the handler stands at the circle's centre,
 * turning on the spot to face the horse as it circles, with the lunge line in
 * one hand and the whip in the other.
 *
 * The horse prop owns the circle and the line: its ride lays the line from the
 * halter to the handler's line hand at every film second, and the action holds
 * that line where the horse has it, so the scene stages the horse's lunge and
 * the handler together. The action owns the handler's feet, which pivot on the
 * spot in small steps whenever the horse's bearing has moved a step's worth
 * from them, and both arms; the whip, already in the other hand, is held low
 * and pointed at the horse's quarters. At a change of rein the hands change
 * over, the line passing to the other hand and the whip to the first, timed
 * with the line's own change on the horse's ride. It refuses a sample whose
 * line hand misses the line, and a horse that circles faster than pivot steps
 * can follow.
 */
export interface IAutoMovieMotionHumanLunge {
  /** The horse prop's subject id in the performance. */
  on: string;

  /** The hand that holds the lunge line; the other carries the whip. */
  line: AutoMovieHumanSide;

  /**
   * The horse's affordance id for the held run of the lunge line; `lead` when
   * absent.
   */
  point?: string;

  /**
   * The whip prop the other hand already holds; that hand hangs by the side
   * when absent.
   */
  whip?: string;

  /**
   * Seconds into the action the hands change over for a change of rein, over
   * three `transition`s: the line hand brings the line in to the middle as the
   * whip hand comes to it, the whip hand closes on the line beside it, the
   * first hand takes the whip from it, and each goes out to its new side. The
   * line hand starts on its own side and the whip on the other; the hands keep
   * them when absent. At least one `transition` after the start and four before
   * the end.
   */
  change?: number;

  /**
   * Seconds the action lasts, taking up and letting go the line included, more
   * than twice `transition`. Pivot steps follow the horse's bearing: one step
   * is two foot swings of the stance step's period, 0.7 s at the reference hip
   * (`step.PERIOD` 0.35 s), taken whenever the bearing has moved a third of the
   * hip's twist from the feet (`HumanLungePivot.TRIGGER`).
   */
  duration: number;

  /**
   * Seconds the hands take to take up the line and aim the whip, and again to
   * let them go, positive; also the time the pelvis takes to turn from the
   * entry heading to the horse. A change of rein takes three of these
   * (`change`).
   */
  transition: number;
}
