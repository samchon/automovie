import type { IAutoMovieMotionHumanLasso } from "@automovie/interface";

import { HumanBound } from "../../law/internal/HumanBound";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * Admit a lasso's parameters: a whole number of swings from one, a flight of
 * some length (0.8 s by default), and a dally of a whole number of turns from
 * one.
 * Parameter params: The lasso's swings, flight and dally.
 * Returns: The flight's seconds.
 * When the swings or the dally's turns are fewer than
 * one, or the flight has no length.
 */
export function humanLassoAdmit(
  params: Pick<IAutoMovieMotionHumanLasso, "swings" | "flight" | "dally">,
): number {
  if (!(params.swings >= 1))
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "swings",
      value: params.swings,
      feasible: null,
      reason: "a loop swings a whole number of turns from one",
      fix: "give a whole number of swings",
    });
  const flight: number = params.flight ?? 0.8;
  HumanBound.above("flight", flight, 0, "s");
  if (params.dally !== undefined && !(params.dally.turns >= 1))
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "dally.turns",
      value: params.dally.turns,
      feasible: null,
      reason: "a dally wraps a whole number of turns from one",
      fix: "give a whole number of turns",
    });
  return flight;
}

/*
 * The lasso's admission and arm.
 */
export namespace humanLassoAdmit {
  /*
   * The elbow's flexion through the swing, degrees: the roper's raised elbow
   * bent off the straight arm's reach singularity, which sets the wrist's
   * distance from the shoulder (provisional).
   */
  export const ELBOW: number = 60;

  /*
   * The wrist's distance from the shoulder with the elbow at `ELBOW`, by the
   * law of cosines over the upper arm and the forearm: `sqrt(u² + f² + 2 u f
   * cos(ELBOW))`.
   * Parameter upper: The upper arm's length, metres.
   * Parameter fore: The forearm's length, metres.
   * Returns: Metres.
   */
  export function wristReach(upper: number, fore: number): number {
    return Math.sqrt(
      upper * upper +
        fore * fore +
        2 * upper * fore * Math.cos((ELBOW * Math.PI) / 180),
    );
  }
}
