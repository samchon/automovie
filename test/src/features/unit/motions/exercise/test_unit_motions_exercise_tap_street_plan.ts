import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";
import { streetDance, tapDance } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/** A plan's events as name and second, in order. */
const timed = (plan: IAutoMovieMotionHumanActionPlan): [string, number][] =>
  plan.events.map((e: IAutoMovieMotionEvent): [string, number] => [
    e.name,
    e.share * plan.duration,
  ]);

/** Whether two event lists agree to a rounding. */
const same = (
  a: readonly [string, number][],
  b: readonly [string, number][],
): boolean =>
  a.length === b.length &&
  a.every(
    ([name, t]: [string, number], i: number): boolean =>
      name === b[i]![0] && nclose(t, b[i]![1], 1e-9),
  );

/**
 * The beat-locked dances: `tapDance.plan` sounds each step's strikes at their
 * quarter beats from its first beat, and `streetDance.plan` hits the rock's
 * pops on the subdivisions asked, every instant offset by one draw within
 * `vary`.
 *
 * The average man stands at the origin facing +Z; at 120 bpm beat `k` falls at
 * `k / 2` seconds and a quarter beat is 0.125 s.
 *
 * Scenarios:
 *
 * 1. A right shuffle sounds the right ball on the "and" before the beat (0.25 s)
 *    and on the beat (0.5 s), and lasts a beat after it, 1 s.
 * 2. Repeated, the second shuffle leads with the left foot a beat later; a repeat
 *    count that is not whole is refused.
 * 3. A rock of four beats with no stray hits on each "and", 0.75 to 2.25 s, and
 *    ends at 2.5 s; with the default stray each beat and hit moves by one
 *    offset within 0.02 s.
 */
export async function test_unit_motions_exercise_tap_street_plan(): Promise<void> {
  // Whole body: the feet are set on the body's own soles and the hips ride
  // over them.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const shuffle: IAutoMovieMotionHumanActionPlan = tapDance.plan(
    motionActionContext(body, { step: "shuffle" }),
  );
  TestValidator.predicate(
    "a shuffle",
    nclose(shuffle.duration, 1, 1e-12) &&
      same(
        timed(shuffle).filter(([n]: [string, number]): boolean =>
          n.startsWith("strike"),
        ),
        [
          ["strike1RightBall", 0.25],
          ["strike2RightBall", 0.5],
        ],
      ),
  );
  const twice: IAutoMovieMotionHumanActionPlan = tapDance.plan(
    motionActionContext(body, { step: "shuffle", repeats: 2 }),
  );
  throw new Error(JSON.stringify([twice.duration, timed(twice), throwsError(() => tapDance.plan(motionActionContext(body, { step: "shuffle", repeats: 1.5 })))]));
  TestValidator.predicate(
    "repeated",
    nclose(twice.duration, 1.5, 1e-12) &&
      same(
        timed(twice).filter(([n]: [string, number]): boolean =>
          n.startsWith("strike"),
        ),
        [
          ["strike1RightBall", 0.25],
          ["strike2RightBall", 0.5],
          ["strike3LeftBall", 0.75],
          ["strike4LeftBall", 1],
        ],
      ) &&
      throwsError(() =>
        tapDance.plan(
          motionActionContext(body, { step: "shuffle", repeats: 1.5 }),
        ),
      ),
  );

  const rock: IAutoMovieMotionHumanActionPlan = streetDance.plan(
    motionActionContext(body, { groove: "rock", count: 4, vary: 0 }),
  );
  const hits: [string, number][] = timed(rock).filter(
    ([n]: [string, number]): boolean => n.startsWith("hit"),
  );
  TestValidator.predicate(
    "the rock's hits",
    nclose(rock.duration, 2.5, 1e-12) &&
      same(hits, [
        ["hit1", 0.75],
        ["hit2", 1.25],
        ["hit3", 1.75],
        ["hit4", 2.25],
      ]),
  );
  const strayed: IAutoMovieMotionHumanActionPlan = streetDance.plan(
    motionActionContext(body, { groove: "rock", count: 4 }),
  );
  const beat1: number = timed(strayed).find(
    ([n]: [string, number]): boolean => n === "beat1",
  )![1];
  const hit1: number = timed(strayed).find(
    ([n]: [string, number]): boolean => n === "hit1",
  )![1];
  TestValidator.predicate(
    "one stray",
    Math.abs(beat1 - 0.5) <= 0.02 && nclose(hit1 - beat1, 0.25, 1e-9),
  );
}
