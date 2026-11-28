import { AutoMovieEngineSchedule } from "@automovie/engine";
import type {
  IAutoMovieEvaluateSchedule,
  IAutoMovieSchedule,
  IAutoMovieScheduleEntry,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `evaluateSchedule` reads one instant: the entries running at it,
 * each with its local time and phase over the half-open span [start, end), and
 * each subject's state from its latest ended entry, where of two ending
 * together the later-indexed one wins.
 *
 * Schedule: `a` reaches 0–1 then turns 1–1.5 and nods 1.25–1.5; `b` dodges
 * 0.5–0.75 then walks 0.75–1 without a state.
 *
 * Scenarios:
 *
 * 1. At 1 s the reach has just ended (its end is exclusive) and the turn has just
 *    begun at local 0, phase 0; `a` reads the reach's state and `b` the
 *    dodge's, since the stateless walk leaves it.
 * 2. At 1.25 s the turn is halfway (local 0.25, phase 0.5) and the nod starts.
 * 3. At 2 s nothing runs, and `a` reads the nod, which ends with the turn but is
 *    indexed after it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Shows schedule reads at an exclusive end, in an overlap and after all actions, with state persistence and a same-end index tie.
 * @evidence contracts/development/testing.md#behavioral-verification Calls Schedule.evaluate at three authored seconds on five entries with overlapping spans and an entry without a state.
 * @evidence contracts/development/testing.md#independent-expectations At 1.25 s the 0.5 s turn has local time 0.25 and phase 0.5, while the nod is new. Later-indexed nod and last stateful dodge independently determine the final states.
 */
export function test_engine_composition_evaluate_schedule(): void {
  const entry = (
    index: number,
    subject: string,
    capability: string,
    start: number,
    end: number,
    state?: string,
  ): IAutoMovieScheduleEntry => ({
    index,
    subject,
    intent: { subject, capability },
    start,
    end,
    ...(state === undefined ? {} : { state }),
  });
  const reach: IAutoMovieScheduleEntry = entry(0, "a", "reach", 0, 1, "reach");
  const dodge: IAutoMovieScheduleEntry = entry(
    1,
    "b",
    "dodge",
    0.5,
    0.75,
    "dodge",
  );
  const walk: IAutoMovieScheduleEntry = entry(2, "b", "walk", 0.75, 1);
  const turn: IAutoMovieScheduleEntry = entry(3, "a", "turn", 1, 1.5, "turn");
  const nod: IAutoMovieScheduleEntry = entry(4, "a", "nod", 1.25, 1.5, "nod");
  const schedule: IAutoMovieSchedule = {
    entries: [reach, dodge, walk, turn, nod],
    duration: 1.5,
  };
  const expected = (
    seconds: number,
    active: IAutoMovieEvaluateSchedule.IActive[],
    states: Record<string, unknown>,
  ): IAutoMovieEvaluateSchedule.IInstant => ({ seconds, active, states });

  TestValidator.equals(
    "at an end the next entry begins",
    AutoMovieEngineSchedule.evaluate(schedule, 1),
    expected(1, [{ entry: turn, local: 0, phase: 0 }], {
      a: "reach",
      b: "dodge",
    }),
  );
  TestValidator.equals(
    "halfway through the turn the nod starts",
    AutoMovieEngineSchedule.evaluate(schedule, 1.25),
    expected(
      1.25,
      [
        { entry: turn, local: 0.25, phase: 0.5 },
        { entry: nod, local: 0, phase: 0 },
      ],
      { a: "reach", b: "dodge" },
    ),
  );
  TestValidator.equals(
    "after everything the later index wins a shared end",
    AutoMovieEngineSchedule.evaluate(schedule, 2),
    expected(2, [], { a: "nod", b: "dodge" }),
  );
}
