import { AutoMovieEngineSchedule } from "@automovie/engine";
import type {
  IAutoMovieCheckLegality,
  IAutoMovieSchedule,
  IAutoMovieScheduleEntry,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `checkLegality` asks every rule about every entry and reports each
 * non-null answer with the rule id and the entry's index, entry by entry and
 * rule by rule in their declared order.
 *
 * Scenarios, three entries over 3 s:
 *
 * 1. A rule refusing turns and a rule refusing entries that end with the schedule
 *    both fire on the last entry, in rule order, after the turn's own finding
 *    on the middle entry.
 * 2. No rule, or rules that always answer null, report nothing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies entry-major then rule-major findings and the silence of absent rules or null answers.
 * @evidence contracts/development/testing.md#behavioral-verification Supplies Schedule.checkLegality with three entries and rule callbacks depending on both an individual entry and the whole schedule.
 * @evidence contracts/development/testing.md#independent-expectations The middle and final entries are turns. Only the final entry ends at duration 3. Their ordered intersection predicts the three exact rule, entry and detail records.
 */
export function test_engine_composition_check_legality(): void {
  const entry = (
    index: number,
    capability: string,
    start: number,
    end: number,
  ): IAutoMovieScheduleEntry => ({
    index,
    subject: "a",
    intent: { subject: "a", capability },
    start,
    end,
  });
  const schedule: IAutoMovieSchedule = {
    entries: [
      entry(0, "reach", 0, 1),
      entry(1, "turn", 1, 2),
      entry(2, "turn", 2, 3),
    ],
    duration: 3,
  };
  const rules: IAutoMovieCheckLegality.IRule[] = [
    {
      id: "no-turn",
      check: (e: IAutoMovieScheduleEntry): string | null =>
        e.intent.capability === "turn" ? "turned" : null,
    },
    {
      id: "no-last",
      check: (
        e: IAutoMovieScheduleEntry,
        whole: IAutoMovieSchedule,
      ): string | null =>
        e.end === whole.duration
          ? `ends at ${e.end} of ${whole.duration}`
          : null,
    },
  ];
  TestValidator.equals(
    "every finding, entry by entry and rule by rule",
    AutoMovieEngineSchedule.checkLegality(schedule, rules),
    [
      { rule: "no-turn", entry: 1, detail: "turned" },
      { rule: "no-turn", entry: 2, detail: "turned" },
      { rule: "no-last", entry: 2, detail: "ends at 3 of 3" },
    ],
  );
  TestValidator.equals(
    "no rule, or a silent rule, reports nothing",
    [
      AutoMovieEngineSchedule.checkLegality(schedule, []),
      AutoMovieEngineSchedule.checkLegality(schedule, [
        { id: "silent", check: (): string | null => null },
      ]),
    ],
    [[], []],
  );
}
