import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieBodyMeasure,
  IAutoMovieMotionHumanLogRoll,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * A log roll's advance: each half turn carries the pelvis half the chest's
 * cross-section perimeter, as a rolling log advances, and the roll takes a
 * whole number of half turns.
 */
export namespace logRollTurns {
  /*
   * The chest's cross-section perimeter, metres: Ramanujan's approximation for
   * the ellipse of its breadth and depth.
   */
  export function perimeter(
    measure: Pick<IAutoMovieBodyMeasure, "chestBreadth" | "chestDepth">,
  ): number {
    const a: number = measure.chestBreadth / 2;
    const b: number = measure.chestDepth / 2;
    return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
  }

  /*
   * The half turns: the count, or as many as bring the pelvis nearest the place,
   * rounded to the end's parity.
   */
  export function count(
    p: Pick<IAutoMovieMotionHumanLogRoll, "halfTurns" | "to" | "end">,
    turn: number,
    step: number,
    hips: IAutoMovieVector3,
    travel: IAutoMovieVector3,
  ): number {
    if (p.halfTurns !== undefined) {
      if (!(p.halfTurns >= 1))
        throw new AutoMovieMotionHumanRefusal({
          kind: "parameter",
          axis: "halfTurns",
          value: p.halfTurns,
          reason: "a log roll turns a whole number of half turns, one or more",
          fix: "give a positive whole count",
        });
      return p.halfTurns;
    }
    const along: number = Vector3.dot(Vector3.subtract(p.to!, hips), travel);
    if (!(along > step / 2))
      throw new AutoMovieMotionHumanRefusal({
        kind: "reach",
        axis: "to",
        value: p.to!,
        reason: `the place lies ${(along * 1000).toFixed(0)} mm toward the side rolled to, less than half a half turn's ${((step / 2) * 1000).toFixed(0)} mm`,
        fix: "name a place farther along the side rolled toward",
      });
    const raw: number = Math.max(1, Math.round(along / step));
    if (p.end === undefined) return raw;
    // A half turn flips the back and the front; the end's parity is set by where the roll starts.
    const supine: boolean = Math.abs(turn) < 90;
    const flips: boolean = (p.end === "supine") !== supine;
    if ((raw % 2 === 1) === flips) return raw;
    const lower: number = raw - 1;
    const upper: number = raw + 1;
    return lower >= 1 &&
      Math.abs(along - lower * step) <= Math.abs(along - upper * step)
      ? lower
      : upper;
  }
}
