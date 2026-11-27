import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionHumanClimbLadder,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";

/*
 * The beat schedule of a rung-ladder climb: both hands reach their first rungs
 * in one beat, then each rung takes four beats, one limb moving up one rung at
 * a time in the climb's limb order. `climbLadder` owns the poses.
 */
export namespace climbLadderBeats {
  /*
   * One limb's move up one rung.
   */
  export interface IMove {
    /*
     * The rung the move reaches, 1 the first above the start.
     */
    n: number;

    /*
     * When the limb leaves, seconds.
     */
    from: number;

    /*
     * When it arrives, seconds.
     */
    to: number;
  }

  /*
   * Where a limb is at an instant.
   */
  export interface IReading {
    /*
     * The rung index the limb holds or moves to.
     */
    index: number;

    /*
     * The move's minimum-jerk progress, 1 when holding.
     */
    u: number;

    /*
     * Whether the limb is between rungs.
     */
    moving: boolean;
  }

  /*
   * The prepared schedule.
   */
  export interface IBeats {
    /*
     * Seconds per beat.
     */
    beat: number;

    /*
     * Each limb's moves in order.
     */
    moves: Record<IAutoMovieMotionHumanClimbLadder.Limb, IMove[]>;

    /*
     * The climb's events, in schedule order.
     */
    instants: readonly IAutoMovieMotionClockInstant[];

    /*
     * The climb's seconds.
     */
    duration: number;

    /*
     * The clock with its events.
     */
    clock: IAutoMovieMotionClock;

    /*
     * The hands' reach progress to their first rungs, 0 to 1.
     */
    reaching: (seconds: number) => number;

    /*
     * The index of a limb's first move that has not landed by an instant.
     */
    nextMove(
      limb: IAutoMovieMotionHumanClimbLadder.Limb,
      seconds: number,
    ): number;

    /*
     * A limb's reading at an instant given its next move.
     */
    rung(
      limb: IAutoMovieMotionHumanClimbLadder.Limb,
      seconds: number,
      next: number,
    ): IReading;

    /*
     * A limb's reading at an instant.
     */
    level(
      limb: IAutoMovieMotionHumanClimbLadder.Limb,
      seconds: number,
    ): IReading;
  }

  /*
   * Prepare the schedule.
   * Parameter beat: Seconds per beat.
   * Parameter count: How many rungs the feet climb.
   * Parameter reach: The hands' first rung index.
   * Parameter order: The limb order of each rung's four beats.
   * Returns: The schedule.
   */
  export function prepare(
    beat: number,
    count: number,
    reach: number,
    order: readonly IAutoMovieMotionHumanClimbLadder.Limb[],
  ): IBeats {
    const instants: IAutoMovieMotionClockInstant[] = [
      { name: "handsOn", seconds: beat },
    ];
    const moves: Record<IAutoMovieMotionHumanClimbLadder.Limb, IMove[]> = {
      leftHand: [],
      rightHand: [],
      leftFoot: [],
      rightFoot: [],
    };
    for (let k: number = 1; k <= count; k++)
      order.forEach(
        (limb: IAutoMovieMotionHumanClimbLadder.Limb, i: number): void => {
          const from: number = beat * (1 + (k - 1) * 4 + i);
          moves[limb].push({ n: k, from, to: from + beat });
          instants.push(
            { name: `${limb}Release${k}`, seconds: from },
            { name: `${limb}Contact${k}`, seconds: from + beat },
          );
        },
      );
    const duration: number = beat * (2 + count * 4);
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock(
      duration,
      instants,
    );
    const reaching: (seconds: number) => number = AutoMovieMotionClock.prepare(
      clock,
      "start",
      "handsOn",
    ).progress;

    /*
     * Find the first interval whose landing has yet to happen.
     */
    const nextMove = (
      limb: IAutoMovieMotionHumanClimbLadder.Limb,
      seconds: number,
    ): number => {
      const own: IMove[] = moves[limb];
      let low: number = 0;
      let high: number = own.length;
      while (low < high) {
        const middle: number = (low + high) >>> 1;
        if (seconds >= own[middle]!.to) low = middle + 1;
        else high = middle;
      }
      return low;
    };

    /*
     * Evaluate the known interval without retaining the sampled limb state.
     */
    const rung = (
      limb: IAutoMovieMotionHumanClimbLadder.Limb,
      seconds: number,
      next: number,
    ): IReading => {
      const base: number = limb.endsWith("Hand") ? reach : 0;
      const own: IMove[] = moves[limb];
      const move: IMove | undefined = own[next];
      if (move !== undefined && seconds > move.from)
        return {
          index: base + move.n,
          u: AutoMovieEngineMotionSampling.minimumJerkShare((seconds - move.from) / (move.to - move.from)),
          moving: true,
        };
      return { index: base + (own[next - 1]?.n ?? 0), u: 1, moving: false };
    };

    return {
      beat,
      moves,
      instants,
      duration,
      clock,
      reaching,
      nextMove,
      rung,
      level: (
        limb: IAutoMovieMotionHumanClimbLadder.Limb,
        seconds: number,
      ): IReading => rung(limb, seconds, nextMove(limb, seconds)),
    };
  }
}
