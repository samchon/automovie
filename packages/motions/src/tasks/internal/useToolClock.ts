import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionClockPhase,
  IAutoMovieMotionHumanToolWork,
  IAutoMovieMotionManner,
} from "@automovie/interface";

import { motionClock } from "../../compose/internal/motionClock";
import { motionManner } from "../../compose/internal/motionManner";
import type { HumanToolWork } from "./HumanToolWork";
import { useTool } from "./useTool";

/*
 * A tool use's clock: the reach, the cycles and the return, timed by the
 * manner. A cycle is a hammer's, a saw's or a screwdriver's own period
 * (`useTool.PERIODS`), or a stir's circle at a tool stroke's speed
 * (`useTool.STROKE_SPEED`); each cycle's first half ends at `ready` or
 * `cycle<k>` and its second at `contact<k>`.
 * Parameter prepared: The plan's prepared values.
 * Returns: The clock.
 */
export function useToolClock(
  prepared: useToolClock.IPrepared,
): IAutoMovieMotionClock {
  const { kind, work, travel, cycles, modifiers }: useToolClock.IPrepared =
    prepared;
  const period: number =
    kind === "stir"
      ? (2 * Math.PI * work.radius) / useTool.STROKE_SPEED
      : useTool.PERIODS[kind];
  const phases: IAutoMovieMotionClockPhase[] = [
    { name: "reaching", seconds: travel },
  ];
  for (let k: number = 1; k <= cycles; k++)
    phases.push(
      { name: k === 1 ? "ready" : `cycle${k}`, seconds: period / 2 },
      { name: `contact${k}`, seconds: period / 2 },
    );
  phases.push({ name: "recover", seconds: travel });
  return motionManner.time(
    motionClock.sequence(phases),
    modifiers,
    { holds: [] },
  );
}

/*
 * Companion types of useToolClock.
 */
export namespace useToolClock {
  /*
   * What `useTool.plan` prepared before its clock.
   */
  export interface IPrepared {
    /*
     * The work's kind.
     */
    kind: IAutoMovieMotionHumanToolWork.Kind;

    /*
     * The work at its point, whose radius a stir circles.
     */
    work: HumanToolWork.IWork;

    /*
     * The reach's and the return's movement time, seconds.
     */
    travel: number;

    /*
     * The cycles worked.
     */
    cycles: number;

    /*
     * The manner's modifiers.
     */
    modifiers: IAutoMovieMotionManner.IModifiers;
  }
}
