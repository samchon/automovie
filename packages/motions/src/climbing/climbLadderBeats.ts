import { minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionHumanClimbLadder,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";

/**
 * The beat schedule of a rung-ladder climb: both hands reach their first
 * rungs in one beat, then each rung takes four beats, one limb moving up one
 * rung at a time in the climb's limb order. `climbLadder` owns the poses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the schedule, its timebase and its owner.
 * @evidence contracts/development/design.md#principled-representation Each limb's moves are intervals in action seconds, and a rung reading is a rung index with a minimum-jerk progress.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The move, reading and schedule records and the one builder climbLadder.plan calls.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every interval follows from the beat and the order.
 */
export namespace climbLadderBeats {
  /**
   * One limb's move up one rung.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member and its timebase.
   * @evidence contracts/development/design.md#principled-representation The rung reached and its interval in action seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three fields the rung lookup reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Built only by prepare.
   */
  export interface IMove {
    /** The rung the move reaches, 1 the first above the start. */
    n: number;

    /** When the limb leaves, seconds. */
    from: number;

    /** When it arrives, seconds. */
    to: number;
  }

  /**
   * Where a limb is at an instant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation The rung index it moves to or holds, its progress, and whether it moves.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three fields climbLadder's pose writers read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Read, never stored.
   */
  export interface IReading {
    /** The rung index the limb holds or moves to. */
    index: number;

    /** The move's minimum-jerk progress, 1 when holding. */
    u: number;

    /** Whether the limb is between rungs. */
    moving: boolean;
  }

  /**
   * The prepared schedule.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation The beat, the moves per limb, the clock and its readers.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members climbLadder.plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Read-only after preparation.
   */
  export interface IBeats {
    /** Seconds per beat. */
    beat: number;

    /** Each limb's moves in order. */
    moves: Record<IAutoMovieMotionHumanClimbLadder.Limb, IMove[]>;

    /** The climb's seconds. */
    duration: number;

    /** The clock with its events. */
    clock: IAutoMovieMotionClock;

    /** The hands' reach progress to their first rungs, 0 to 1. */
    reaching: (seconds: number) => number;

    /** The index of a limb's first move that has not landed by an instant. */
    nextMove(
      limb: IAutoMovieMotionHumanClimbLadder.Limb,
      seconds: number,
    ): number;

    /** A limb's reading at an instant given its next move. */
    rung(
      limb: IAutoMovieMotionHumanClimbLadder.Limb,
      seconds: number,
      next: number,
    ): IReading;

    /** A limb's reading at an instant. */
    level(
      limb: IAutoMovieMotionHumanClimbLadder.Limb,
      seconds: number,
    ): IReading;
  }

  /**
   * Prepare the schedule.
   *
   * @param beat Seconds per beat.
   * @param count How many rungs the feet climb.
   * @param reach The hands' first rung index.
   * @param order The limb order of each rung's four beats.
   * @returns The schedule.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, units and result.
   * @evidence contracts/development/implementation.md#principled-implementation One beat for the hands' first reach, then four beats a rung, each limb moving once a rung on a minimum-jerk course.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Moves and events, the clock, then the lookups.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every move follows from the beat and the order.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear preparation in rungs; each lookup is a binary search over one limb's moves.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The moves are built once and shared by every lookup.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The moves grow with the rungs and are released with the plan.
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
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(
      duration,
      instants,
    );
    const reaching: (seconds: number) => number = AutoMovieMotionClock.prepare(
      clock,
      "start",
      "handsOn",
    ).progress;

    /** Find the first interval whose landing has yet to happen. */
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

    /** Evaluate the known interval without retaining the sampled limb state. */
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
          u: minimumJerk.share((seconds - move.from) / (move.to - move.from)),
          moving: true,
        };
      return { index: base + (own[next - 1]?.n ?? 0), u: 1, moving: false };
    };

    return {
      beat,
      moves,
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
