import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";
import {
  HumanRefusal,
  gesture,
  gestureAdmit,
  gestureStrokeTables,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `gestureAdmit` admits a gesture's counts and the hands it moves: its strokes
 * (the parameter or the kind's rhythm, a whole count), its hold (none or more),
 * a bow's depth (above 0, up to `gesture.DEEPEST_BOW`), a point's target and an
 * aim's shape, and the sides its kind moves: both, the authored hand (the right
 * when unstated), or none.
 *
 * Scenarios:
 *
 * 1. A wave with no count takes its rhythm's cycles and the right hand; one with
 *    the left hand and three strokes takes those; a clap takes both hands; a
 *    nod none.
 * 2. A bow takes `gesture.BOW` unless a depth is given.
 * 3. A count of 1.5, a negative hold, a bow past the deepest, a point with no
 *    target and an aim with no shape are refused on `count`, `hold`, `depth`,
 *    `target` and `aim`.
 */
export function test_unit_motions_everyday_gesture_admit(): void {
  const admit: (
    p: IAutoMovieMotionHumanGesture.IParams,
  ) => gestureAdmit.IAdmitted = (
    p: IAutoMovieMotionHumanGesture.IParams,
  ): gestureAdmit.IAdmitted =>
    gestureAdmit(p, gestureStrokeTables.RHYTHM[p.kind]);
  TestValidator.equals(
    "the hands",
    [
      admit({ kind: "wave" }),
      admit({ kind: "wave", hand: "left", count: 3 }).sides,
      admit({ kind: "wave", hand: "left", count: 3 }).cycles,
      admit({ kind: "clap" }).sides,
      admit({ kind: "nod" }).sides,
    ],
    [
      {
        cycles: gestureStrokeTables.RHYTHM.wave.cycles,
        hold: 0,
        depth: gesture.BOW,
        sides: ["right"],
      },
      ["left"],
      3,
      ["left", "right"],
      [],
    ],
  );
  TestValidator.equals(
    "the bow",
    [admit({ kind: "bow" }).depth, admit({ kind: "bow", depth: 20 }).depth],
    [gesture.BOW, 20],
  );
  const refused: (p: IAutoMovieMotionHumanGesture.IParams) => string = (
    p: IAutoMovieMotionHumanGesture.IParams,
  ): string => {
    try {
      admit(p);
    } catch (error: unknown) {
      if (error instanceof HumanRefusal) return error.axis;
    }
    return "admitted";
  };
  TestValidator.equals(
    "refusals",
    [
      refused({ kind: "wave", count: 1.5 }),
      refused({ kind: "wave", hold: -1 }),
      refused({ kind: "bow", depth: gesture.DEEPEST_BOW + 1 }),
      refused({ kind: "point" }),
      refused({ kind: "wave", aim: { digit: "thumb", toward: "up" } }),
    ],
    ["count", "hold", "depth", "target", "aim"],
  );
}
