import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanGesture,
  IAutoMovieMotionHumanGestureStroke,
} from "@automovie/interface";

import { HumanBound } from "../../law/internal/HumanBound";
import { HumanRefusal } from "../../law/HumanRefusal";
import { gesture } from "./gesture";
import { gestureStrokeTables } from "./gestureStrokeTables";

/**
 * A gesture's admitted counts and the hands it moves: its stroke count (the
 * parameter or the kind's rhythm), its hold, its bow depth within
 * `gesture.DEEPEST_BOW`, a point's target and an aimed digit's shape, then the
 * sides its kind moves (`gestureStrokeTables.HANDS`).
 *
 * @param p The gesture's parameters.
 * @param rhythm The kind's rhythm.
 * @returns The admitted counts and the moving sides.
 * @throws {HumanRefusal} For a bad count, hold or depth, a point without a
 *   target, or an aim without a shape.
 */
export function gestureAdmit(
  p: IAutoMovieMotionHumanGesture.IParams,
  rhythm: (typeof gestureStrokeTables.RHYTHM)[IAutoMovieMotionHumanGestureStroke.Kind],
): gestureAdmit.IAdmitted {
  const cycles: number = HumanBound.whole("count", p.count ?? rhythm.cycles);
  const hold: number = p.hold ?? 0;
  HumanBound.least("hold", hold, 0, "s");
  const depth: number = p.depth ?? gesture.BOW;
  if (p.kind === "bow")
    HumanBound.within(
      "depth",
      depth,
      0,
      gesture.DEEPEST_BOW,
      "degrees",
      "minimum",
    );
  if (p.kind === "point" && p.target === undefined)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "target",
      value: undefined,
      reason: "Pointing needs a target",
      fix: "give the point gesture a target",
    });
  if (p.aim !== undefined && p.shape === undefined)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "aim",
      value: p.aim,
      reason:
        "an aim points a digit of the hand's emblem shape, and no shape is given",
      fix: "give the gesture a shape whose digit is aimed, or leave out aim",
    });
  const sides: AutoMovieHumanSide[] = ((): AutoMovieHumanSide[] => {
    const which: PlanSidesWhich = gestureStrokeTables.HANDS[p.kind];
    return which === "both"
      ? ["left", "right"]
      : which === "one"
        ? [p.hand ?? "right"]
        : [];
  })();
  return { cycles, hold, depth, sides };
}

/** The records of `gestureAdmit`. */
export namespace gestureAdmit {
  /** A gesture's admitted counts and the hands it moves. */
  export interface IAdmitted {
    /** The strokes, a whole count. */
    cycles: number;

    /** The hold at the stroke's end, seconds. */
    hold: number;

    /** A bow's depth, degrees. */
    depth: number;

    /** The sides the kind moves. */
    sides: AutoMovieHumanSide[];
  }
}

/** The alternatives of `PlanSidesWhich`'s site. */
type PlanSidesWhich = "one" | "both" | "none";
