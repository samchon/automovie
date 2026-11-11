import {
  AutoMovieChain,
  AutoMovieComposition,
  type IAutoMovieIntent,
  type IAutoMovieSchedule,
  auditAutoMovieOutcome,
  checkAutoMovieLegality,
  evaluateAutoMovieSchedule,
  measureAutoMovieSchedule,
  resolveAutoMovieOutcome,
  resolveAutoMovieSchedule,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/** Intents compose immutably, resolve on the film clock with the production's laws, and are read, judged and measured without rewriting.
 *
 * Scenarios:
 * 1. `next` and `with` return new chains of the caller's class and leave the original unchanged; a trailing sequence flattens.
 * 2. A sequence places parts end to start, a parallel group ends with its longest part, and `at` starts an answer at its anchor's contact plus the offset.
 * 3. Outcome and state laws read the entries placed before them; a missing anchor and a duplicate anchor are refused.
 * 4. Evaluation is pure and seekable: active entries with their phase, and each subject's latest ended state.
 * 5. The first matching outcome rule decides, else the default.
 * 6. An audit reports a missing, a weak and a forbidden contact, and nothing for a measured one.
 * 7. Legality reports every rule violation by entry; measurement counts actions per minute, combinations, lateral share and idle time.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMovieChain`, `AutoMovieComposition`, `IAutoMovieIntent`, `IAutoMovieSchedule` on in-memory inputs and asserts the returned observations through 4x TestValidator.predicate, 5x TestValidator.equals; 7 numbered scenarios (first: `next` and `with` return new chains of the caller's class and leave the original unchanged; a trailing...; last: Legality reports every rule violation by entry; measurement counts actions per minute, combinations, lateral...). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (7 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 7 numbered scenarios (first: `next` and `with` return new chains of the caller's class and leave the original unchanged; a trailing...; last: Legality reports every rule violation by entry; measurement counts actions per minute, combinations, lateral...), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_composition_schedule`, which owns every case it runs; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 7 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: `next` and `with` return new chains of the caller's class and leave the original unchanged; a trailing sequence flattens.).
 */
export function test_composition_schedule(): void {
  const act = (
    subject: string,
    capability: string,
    anchor?: string,
  ): IAutoMovieIntent => ({
    subject,
    capability,
    ...(anchor === undefined ? {} : { anchor }),
  });
  const first: AutoMovieChain = AutoMovieChain.of(act("a", "reach", "r1"));
  const chained: AutoMovieChain = first
    .next(act("a", "turn"))
    .next(act("a", "reach"));
  // A production subclass keeps its vocabulary after every combinator.
  class Performer extends AutoMovieChain {
    public turn(): Performer {
      return this.next({ subject: "a", capability: "turn" });
    }
  }
  const own: Performer = new Performer(first.node)
    .turn()
    .with(act("b", "watch"))
    .turn();
  TestValidator.predicate(
    "immutable flattening chain of the subclass",
    first.node.kind === "intent" &&
      chained.node.kind === "sequence" &&
      chained.node.parts.length === 3 &&
      own instanceof Performer &&
      own.node.kind === "sequence" &&
      own.node.parts.length === 2 &&
      own.node.parts[0]!.kind === "parallel",
  );

  // a: reach (1 s, contact 0.4) -> turn (0.5 s) -> reach; b answers at r1 + 0.1.
  const composition: AutoMovieComposition = AutoMovieComposition.parallel(
    chained,
    AutoMovieComposition.at(
      "r1",
      AutoMovieChain.of(act("b", "dodge")).with(act("c", "watch")),
      0.1,
    ),
  );
  const timing: resolveAutoMovieSchedule.ILaws["timing"] = (
    intent: IAutoMovieIntent,
  ) =>
    intent.capability === "reach"
      ? { duration: 1, contact: 0.4 }
      : intent.capability === "turn"
        ? { duration: 0.5 }
        : { duration: 0.3 };
  const schedule: IAutoMovieSchedule = resolveAutoMovieSchedule(composition, {
    timing,
    outcome: (
      entry: IAutoMovieSchedule.IEntry,
      context: resolveAutoMovieSchedule.IContext,
    ) =>
      entry.intent.capability === "dodge"
        ? `after ${context.entries.length} entries`
        : undefined,
    state: (entry: IAutoMovieSchedule.IEntry) => ({
      last: entry.intent.capability,
    }),
  });
  const placed: string[] = schedule.entries.map(
    (e: IAutoMovieSchedule.IEntry): string =>
      `${e.subject}.${e.intent.capability}@${e.start.toFixed(2)}-${e.end.toFixed(2)}`,
  );
  TestValidator.equals("placement", placed, [
    "a.reach@0.00-1.00",
    "b.dodge@0.50-0.80",
    "c.watch@0.50-0.80",
    "a.turn@1.00-1.50",
    "a.reach@1.50-2.50",
  ]);
  TestValidator.predicate(
    "frozen schedule, contact and earlier-state outcome",
    Object.isFrozen(schedule) &&
      schedule.duration === 2.5 &&
      schedule.entries[0]!.contact === 0.4 &&
      schedule.entries[1]!.outcome === "after 3 entries",
  );
  const refusals: string[] = [];
  for (const [label, made] of [
    ["missing anchor", AutoMovieComposition.at("none", act("b", "dodge"))],
    [
      "duplicate anchor",
      AutoMovieComposition.sequence(
        act("a", "reach", "x"),
        act("a", "reach", "x"),
      ),
    ],
  ] as const)
    try {
      resolveAutoMovieSchedule(made, { timing });
      refusals.push(`${label} accepted`);
    } catch {}
  TestValidator.equals("composition refusals", refusals, []);

  // Pure, seekable evaluation.
  const late: evaluateAutoMovieSchedule.IInstant = evaluateAutoMovieSchedule(
    schedule,
    1.25,
  );
  const early: evaluateAutoMovieSchedule.IInstant = evaluateAutoMovieSchedule(
    schedule,
    0.6,
  );
  TestValidator.predicate(
    "active entries and states",
    late.active.length === 1 &&
      late.active[0]!.entry.intent.capability === "turn" &&
      Math.abs(late.active[0]!.phase - 0.5) < 1e-12 &&
      JSON.stringify(late.states) ===
        JSON.stringify({
          a: { last: "reach" },
          b: { last: "dodge" },
          c: { last: "watch" },
        }) &&
      early.active.length === 3 &&
      JSON.stringify(evaluateAutoMovieSchedule(schedule, 1.25)) ===
        JSON.stringify(late),
  );

  // Outcomes from a production table.
  const table: resolveAutoMovieOutcome.ITable<"lands" | "misses" | "blocked"> =
    {
      rules: [
        {
          id: "dodged",
          when: (i: readonly IAutoMovieIntent[]) =>
            i.some((x) => x.capability === "dodge"),
          outcome: "misses",
        },
        {
          id: "guarded",
          when: (i: readonly IAutoMovieIntent[]) =>
            i.some((x) => x.capability === "guard"),
          outcome: "blocked",
        },
      ],
      otherwise: "lands",
    };
  TestValidator.equals(
    "outcome rules",
    [
      resolveAutoMovieOutcome(table, [act("a", "reach"), act("b", "dodge")]),
      resolveAutoMovieOutcome(table, [
        act("a", "reach"),
        act("b", "guard"),
        act("b", "dodge"),
      ]),
      resolveAutoMovieOutcome(table, [act("a", "reach")]),
    ],
    [
      { outcome: "misses", rule: "dodged" },
      { outcome: "misses", rule: "dodged" },
      { outcome: "lands" },
    ],
  );

  // Audits fail and never rewrite.
  const contact = (
    seconds: number,
    impulse: number,
  ): auditAutoMovieOutcome.IContact => ({
    a: { subject: "b", region: "head" },
    b: { subject: "a", region: "hand" },
    seconds,
    impulse,
  });
  const expectation: auditAutoMovieOutcome.IExpectation = {
    a: { subject: "a", region: "hand" },
    b: { subject: "b", region: "head" },
    window: { start: 0.3, end: 0.5 },
    minimumImpulse: 1,
  };
  const outcome: auditAutoMovieOutcome.IOutcome = {
    id: "lands",
    required: [expectation],
  };
  TestValidator.equals(
    "audits",
    [
      auditAutoMovieOutcome(outcome, [contact(0.4, 2)]).length,
      auditAutoMovieOutcome(outcome, [contact(0.6, 2)]).length,
      auditAutoMovieOutcome(outcome, [contact(0.4, 0.5)]).length,
      auditAutoMovieOutcome(
        { id: "misses", required: [], forbidden: [expectation] },
        [contact(0.4, 2)],
      ).length,
    ],
    [0, 1, 1, 1],
  );

  // Legality and pacing.
  const violations: checkAutoMovieLegality.IViolation[] =
    checkAutoMovieLegality(schedule, [
      {
        id: "no-turn",
        check: (e: IAutoMovieSchedule.IEntry) =>
          e.intent.capability === "turn" ? "turned" : null,
      },
    ]);
  TestValidator.equals("legality", violations, [
    { rule: "no-turn", entry: 1, detail: "turned" },
  ]);
  const measure: measureAutoMovieSchedule.IMeasure = measureAutoMovieSchedule(
    schedule,
    {
      action: (e: IAutoMovieSchedule.IEntry) => e.intent.capability === "reach",
      combinationGap: 0.5,
      displacement: (e: IAutoMovieSchedule.IEntry) =>
        e.intent.capability === "dodge"
          ? { lateral: 0.3, linear: 0.1 }
          : { lateral: 0, linear: 0.2 },
      idle: (e: IAutoMovieSchedule.IEntry) => e.intent.capability === "watch",
    },
  );
  TestValidator.predicate(
    "pacing measurement",
    Math.abs(measure.actionsPerMinute - 2 / (2.5 / 60)) < 1e-9 &&
      measure.combinationShare === 0.5 &&
      Math.abs(measure.subjects.b!.lateralShare - 0.75) < 1e-12 &&
      Math.abs(measure.subjects.c!.idleSeconds - 2.5) < 1e-12 &&
      Math.abs(measure.subjects.a!.idleSeconds - 0) < 1e-12,
  );
}
