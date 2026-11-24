import type {
  IAutoMovieCheckLegality,
  IAutoMovieMotionTarget,
  IAutoMovieSchedule,
  IAutoMovieScheduleEntry,
} from "@automovie/interface";
import { KickboxingRules } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** A schedule entry of one action. */
const entry = (
  index: number,
  subject: string,
  capability: string,
  start: number,
  end: number,
  params?: object,
): IAutoMovieScheduleEntry => ({
  index,
  subject,
  start,
  end,
  intent: {
    subject,
    capability,
    ...(params === undefined ? {} : { parameters: { params } }),
  },
});

/**
 * `KickboxingRules.rules` are the schedule checks of the GLORY Official Rules
 * V2.2 §5.07: one immediate knee in the clinch (A.11), legal targets (A.2 to
 * A.4) and no attack on a downed opponent, who is down from the start of a
 * knockdown to the start of their next action.
 *
 * Scenarios:
 *
 * 1. A knee touching another strike of the same fighter breaks the single
 *    clinch knee; a knee standing alone keeps it.
 * 2. A punch to the groin breaks the legal-target rule.
 * 3. A punch at `b` after `b`'s knockdown and before `b` stands breaks the
 *    downed rule; one after `b`'s next action starts keeps it.
 */
export function test_unit_motions_sport_kickboxing_rules_rules(): void {
  const rule = (id: string): IAutoMovieCheckLegality.IRule =>
    KickboxingRules.rules.find(
      (r: IAutoMovieCheckLegality.IRule): boolean => r.id === id,
    )!;
  const head: { at: IAutoMovieMotionTarget } = {
    at: { kind: "person", subject: "b", region: "jawLeft" },
  };

  // 1. The clinch knee.
  const knee: IAutoMovieScheduleEntry = entry(1, "a", "knee", 1, 2);
  const clinch: IAutoMovieSchedule = {
    duration: 4,
    entries: [entry(0, "a", "punch", 0, 1), knee],
  };
  const alone: IAutoMovieSchedule = { duration: 4, entries: [knee] };
  TestValidator.equals(
    "a single knee",
    [
      rule("single-clinch-knee").check(knee, clinch),
      rule("single-clinch-knee").check(knee, alone),
    ],
    ["knee 1 is not a single clinch knee", null],
  );

  // 2. The target.
  const groin: IAutoMovieScheduleEntry = entry(0, "a", "punch", 0, 1, {
    at: { kind: "person", subject: "b", region: "groin" },
  });
  TestValidator.equals(
    "a foul target",
    rule("legal-target").check(groin, { duration: 1, entries: [groin] }),
    "entry 0: a strike at the groin is a foul",
  );

  // 3. A downed opponent.
  const down: IAutoMovieScheduleEntry = entry(0, "b", "knockdown", 1, 2);
  const up: IAutoMovieScheduleEntry = entry(1, "b", "stand", 4, 5);
  const early: IAutoMovieScheduleEntry = entry(2, "a", "punch", 2, 3, head);
  const late: IAutoMovieScheduleEntry = entry(3, "a", "punch", 5, 6, head);
  const fight: IAutoMovieSchedule = {
    duration: 6,
    entries: [down, up, early, late],
  };
  TestValidator.equals(
    "no strike while down",
    [
      rule("no-attack-on-a-downed-opponent").check(early, fight),
      rule("no-attack-on-a-downed-opponent").check(late, fight),
    ],
    ["entry 2 strikes b, who is down since 1.00 s", null],
  );
}
