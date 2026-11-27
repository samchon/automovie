import type { IAutoMovieMotionHumanStrikingHeld } from "@automovie/interface";

/**
 * A swing's path held where its arm would pass into the trunk or out of reach:
 * the backswing (progress 0 to 1) and the follow-through (progress 1 to 2, the
 * clock's passage overshoot) go on only while `clear` stays positive, and hold
 * at the edge where it would turn, found by bisection between the contact
 * (progress 1, which must be clear) and the swing's end.
 *
 * @param path The swing's hand frame by progress.
 * @param clear How far the arm is clear at a progress, metres: positive where
 *   clear.
 * @returns The held path.
 */
export function holdPrecisionSwing(
  path: (progress: number) => IAutoMovieMotionHumanStrikingHeld.IHandFrame,
  clear: (progress: number) => number,
): (progress: number) => IAutoMovieMotionHumanStrikingHeld.IHandFrame {
  const edge = (open: number, blocked: number): number => {
    for (let i: number = 0; i < ROUNDS; i++) {
      const middle: number = (open + blocked) / 2;
      if (clear(middle) > 0) open = middle;
      else blocked = middle;
    }
    return open;
  };
  const contact: boolean = clear(1) > 0;
  const cap: number = contact && !(clear(2) > 0) ? edge(1, 2) : 2;
  const floor: number = contact && !(clear(0) > 0) ? edge(1, 0) : 0;
  return (progress: number): IAutoMovieMotionHumanStrikingHeld.IHandFrame =>
    path(Math.min(Math.max(progress, floor), cap));
}

/**
 * The bisection rounds that find where a swing's arm meets the trunk or its
 * reach.
 */
const ROUNDS: number = 40;
