import type { IAutoMovieMotionClock } from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * An extinguisher's sweep, the last S of OSHA's PASS: the nozzle is brought
 * onto the fire's base over `AIM` seconds, swept side to side about the
 * vertical, `span` degrees in all, `sweeps` times on a `SWEEP` each, and
 * released over another `AIM`; the yaw from the aim at a second is `span / 2
 * sin(2 pi sweeps u)` over the sweeps' progress `u`. A slower tempo lengthens
 * every span.
 * Parameter sweeps: The sweeps asked, rounded; `SWEEPS` when absent.
 * Parameter span: The sweep's full angle, degrees; `SPAN` when absent.
 * Parameter tempo: The performer's tempo factor.
 * Returns: The sweep's clock and its yaw at a second.
 * When the sweeps round to none or the span is not
 * between 0 and 180 degrees.
 */
export function extinguishSweep(
  sweeps: number | undefined,
  span: number | undefined,
  tempo: number,
): extinguishSweep.ISweep {
  const count: number = Math.round(sweeps ?? extinguishSweep.SWEEPS);
  const angle: number = span ?? extinguishSweep.SPAN;
  if (!(count > 0 && angle > 0 && angle < 180))
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "sweeps",
      value: { sweeps: count, span: angle },
      feasible: null,
      reason:
        "a sweep is a positive whole count over a span between 0 and 180 degrees",
      fix: "give whole sweeps and a span under a half turn",
    });
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
    prepare: tempo * extinguishSweep.AIM,
    attack: tempo * extinguishSweep.SWEEP * count,
    retract: tempo * extinguishSweep.AIM,
  });
  const ready: number = clock.at("strokeStart");
  const done: number = clock.at("strokeEnd");
  return {
    clock,
    yaw: (seconds: number): number =>
      (angle / 2) *
      Math.sin(
        2 *
          Math.PI *
          count *
          Math.min(1, Math.max(0, (seconds - ready) / (done - ready))),
      ),
  };
}

/*
 * The extinguisher's sweep.
 */
export namespace extinguishSweep {
  /*
   * Seconds to bring the nozzle onto the fire's base: provisional.
   */
  export const AIM: number = 0.5;

  /*
   * Seconds of one full sweep, side to side and back: provisional.
   */
  export const SWEEP: number = 1.2;

  /*
   * Sweeps when none are asked.
   */
  export const SWEEPS: number = 3;

  /*
   * The sweep's full angle when none is asked, degrees.
   */
  export const SPAN: number = 40;

  /*
   * The sweep's timing and its yaw.
   */
  export interface ISweep {
    /*
     * The aim, the sweeps and the release.
     */
    clock: IAutoMovieMotionClock;

    /*
     * The sweep's yaw from the aim at a second.
     * Parameter seconds: Action seconds.
     * Returns: Degrees about +Y.
     */
    yaw(seconds: number): number;
  }
}
