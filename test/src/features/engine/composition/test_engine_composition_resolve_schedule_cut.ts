import { AutoMovieComposition, AutoMovieEngineScheduleCut, AutoMovieEngineSchedule } from "@automovie/engine";
import type {
  IAutoMovieIntent,
  IAutoMovieIntentTiming,
  IAutoMovieSchedule,
  IAutoMovieScheduleEntry,
  IAutoMovieScheduleLaws,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * An intent cut at a share or a named event ends there, and the next part of
 * its sequence starts there and is recorded as the interrupter.
 *
 * Scenarios:
 *
 * 1. A 2 s kick cut at the tagged share 0.4 ends at 0.8 s; the 1 s step after it
 *    starts at 0.8 s and the kick's entry names it in `interruptedBy`.
 * 2. Cut at its `chamber` event (share 0.3), the kick ends at 0.6 s and the entry
 *    records the event's name.
 * 3. Metamorphic: moving the cut later moves the next start later by the share
 *    times the duration, and the contact (1.0 s) survives only a cut after it.
 * 4. A cut at an unknown event throws a message listing the action's events; a
 *    share outside [0, 1] throws; exact legacy inputs normalize, while mixed or
 *    incorrectly tagged inputs are rejected.
 * 5. An uncut sequence and a cut last part record no interrupter.
 * 6. A cut at another subject's event: a 2 s guard of subject b, placed in
 *    parallel with a's kick anchored "k", cut `{ of: "k", event: "impact" }`
 *    ends at the kick's impact, 1.0 s; an unknown anchor or event throws.
 * 7. A proximity cut asks the laws' `until` for its share and ends there; an
 *    `until` law answering undefined (never met) leaves the 2 s guard uncut,
 *    ending at 2 s with no interrupter and the step starting at 2 s; with no
 *    `until` law it throws.
 * 8. A part synced into its own subject's running action cuts it, so the sequence
 *    goes on from the synced part's end: b's 2 s guard, then a 1 s step synced
 *    0.5 s before a's kick contact (1.0 s), plays 0.5 to 1.5 s and the stand
 *    after it starts at 1.5 s, not at the guard's uncut 2 s; a part of another
 *    subject synced the same way leaves the cursor at 2 s.
 * 9. A saved proximity cut is tagged for the timing, cut, alignment, outcome
 *    and state laws. Repeated references share the same normalized intent,
 *    preserving synced resume and interruption.
 */
export function test_engine_composition_resolve_schedule_cut(): void {
  const laws: IAutoMovieScheduleLaws = {
    timing: (intent: IAutoMovieIntent): IAutoMovieIntentTiming =>
      intent.capability === "kick"
        ? {
            duration: 2,
            contact: 1,
            events: [
              { name: "chamber", share: 0.3 },
              { name: "impact", share: 0.5 },
            ],
          }
        : intent.capability === "guard"
          ? { duration: 2 }
          : { duration: 1 },
  };
  const kick = (until?: IAutoMovieIntent["until"]): IAutoMovieIntent => ({
    subject: "a",
    capability: "kick",
    ...(until === undefined ? {} : { until }),
  });
  const step: IAutoMovieIntent = { subject: "a", capability: "step" };
  const run = (...parts: IAutoMovieIntent[]): IAutoMovieSchedule =>
    AutoMovieEngineSchedule.resolve(AutoMovieComposition.sequence(...parts), laws);
  const close = (a: number, b: number): boolean => Math.abs(a - b) < 1e-12;

  const shared: IAutoMovieSchedule = run(
    kick({ type: "share", share: 0.4 }),
    step,
  );
  const [k, s] = shared.entries;
  TestValidator.predicate(
    "cut at share",
    close(k!.end, 0.8) &&
      k!.cut?.share === 0.4 &&
      close(s!.start, 0.8) &&
      k!.interruptedBy === s!.index,
  );
  TestValidator.predicate(
    "contact after the cut is dropped",
    k!.contact === undefined,
  );

  const evented: IAutoMovieSchedule = run(
    kick({ type: "event", event: "chamber" }),
    step,
  );
  TestValidator.predicate(
    "cut at event",
    close(evented.entries[0]!.end, 0.6) &&
      evented.entries[0]!.cut?.event === "chamber",
  );

  let previous: number = -Infinity;
  for (const share of [0.1, 0.3, 0.5, 0.7, 0.9]) {
    const e: IAutoMovieSchedule = run(kick({ type: "share", share }), step);
    TestValidator.predicate(
      `next start moves with the cut (${share})`,
      close(e.entries[1]!.start, 2 * share) && e.entries[1]!.start > previous,
    );
    TestValidator.predicate(
      `contact survives only a later cut (${share})`,
      (e.entries[0]!.contact !== undefined) === 2 * share >= 1,
    );
    previous = e.entries[1]!.start;
  }

  TestValidator.predicate(
    "unknown event lists the events",
    ((): boolean => {
      try {
        run(kick({ type: "event", event: "recoil" }), step);
        return false;
      } catch (error) {
        return (
          String(error).includes("chamber") && String(error).includes("impact")
        );
      }
    })(),
  );
  TestValidator.error("share outside [0, 1]", (): unknown =>
    run(kick({ type: "share", share: 1.5 }), step),
  );
  const plain: IAutoMovieSchedule = run(kick(), step);
  const last: IAutoMovieSchedule = run(
    step,
    kick({ type: "share", share: 0.5 }),
  );
  TestValidator.predicate(
    "no interrupter without a cut or a follower",
    plain.entries[0]!.interruptedBy === undefined &&
      last.entries[1]!.interruptedBy === undefined &&
      close(last.entries[1]!.end, 2),
  );

  const guard = (until: IAutoMovieIntent["until"]): IAutoMovieIntent => ({
    subject: "b",
    capability: "guard",
    until,
  });
  const both = (
    until: IAutoMovieIntent["until"],
    l: IAutoMovieScheduleLaws = laws,
  ): IAutoMovieSchedule =>
    AutoMovieEngineSchedule.resolve(
      AutoMovieComposition.parallel(
        { ...kick(), anchor: "k" },
        AutoMovieComposition.sequence(guard(until), step),
      ),
      l,
    );
  const crossed: IAutoMovieSchedule = both({
    type: "anchor-event",
    of: "k",
    event: "impact",
  });
  const g = crossed.entries.find((e) => e.intent.capability === "guard")!;
  TestValidator.predicate(
    "cut at another subject's event",
    close(g.end, 1) && g.cut?.event === "k.impact",
  );
  TestValidator.error("unknown anchor", (): unknown =>
    both({ type: "anchor-event", of: "x", event: "impact" }),
  );
  TestValidator.error("unknown event of the anchor", (): unknown =>
    both({ type: "anchor-event", of: "k", event: "recoil" }),
  );
  const near = both(
    {
      type: "proximity",
      proximity: {
        effector: "palmLeft",
        target: { kind: "none" },
        distance: 0.1,
      },
    },
    { ...laws, until: (): number => 0.25 },
  );
  TestValidator.predicate(
    "proximity cut at the laws' share",
    close(near.entries.find((e) => e.intent.capability === "guard")!.end, 0.5),
  );
  const never: IAutoMovieSchedule = both(
    {
      type: "proximity",
      proximity: {
        effector: "palmLeft",
        target: { kind: "none" },
        distance: 0.1,
      },
    },
    { ...laws, until: (): undefined => undefined },
  );
  const uncut: IAutoMovieScheduleEntry = never.entries.find(
    (e) => e.intent.capability === "guard",
  )!;
  const after: IAutoMovieScheduleEntry = never.entries.find(
    (e) => e.intent.capability === "step",
  )!;
  TestValidator.predicate(
    "proximity never met runs to the end, uncut",
    close(uncut.end, 2) &&
      uncut.cut === undefined &&
      uncut.interruptedBy === undefined &&
      close(after.start, 2),
  );
  TestValidator.error("proximity without an until law", (): unknown =>
    both({
      type: "proximity",
      proximity: {
        effector: "palmLeft",
        target: { kind: "none" },
        distance: 0,
      },
    }),
  );

  const legacy = (value: unknown): IAutoMovieIntent["until"] =>
    value as IAutoMovieIntent["until"];
  const canonical: IAutoMovieIntent.IUntil = {
    type: "share",
    share: 0.2,
  };
  TestValidator.predicate(
    "canonical variant is preserved",
    AutoMovieEngineScheduleCut.normalize(canonical) === canonical,
  );
  TestValidator.predicate(
    "legacy exact share shape is normalized",
    close(run(kick(legacy({ share: 0.25 }))).entries[0]!.end, 0.5),
  );
  TestValidator.predicate(
    "legacy exact own-event shape is normalized",
    run(kick(legacy({ event: "chamber" }))).entries[0]!.cut?.event ===
      "chamber",
  );
  TestValidator.predicate(
    "legacy exact anchored-event shape is normalized",
    both(legacy({ of: "k", event: "impact" })).entries.some(
      (entry: IAutoMovieScheduleEntry): boolean =>
        entry.intent.capability === "guard" && entry.cut?.event === "k.impact",
    ),
  );
  const taggedUndefinedIndex: IAutoMovieSchedule = both(
    legacy({
      type: "anchor-event",
      of: "k",
      event: "impact",
      index: undefined,
    }),
  );
  TestValidator.predicate(
    "explicit undefined anchored-event index uses the default occurrence",
    taggedUndefinedIndex.entries.some(
      (entry: IAutoMovieScheduleEntry): boolean =>
        entry.intent.capability === "guard" &&
        close(entry.end, 1) &&
        entry.cut?.event === "k.impact",
    ),
  );
  const savedCut: string =
    '{"proximity":{"effector":"palmLeft","target":{"kind":"none"},"distance":0.1}}';
  const savedStep: IAutoMovieIntent = {
    ...step,
    until: legacy(JSON.parse(savedCut) as unknown),
  };
  const anchor: IAutoMovieIntent = { ...kick(), anchor: "saved-kick" };
  const stand: IAutoMovieIntent = {
    subject: "a",
    capability: "stand",
    until: { type: "share", share: 1 },
  };
  const seen: IAutoMovieIntent[] = [];
  const record = (intent: IAutoMovieIntent): void => {
    if (intent.capability === "step") seen.push(intent);
  };
  const restored: IAutoMovieSchedule = AutoMovieEngineSchedule.resolve(
    AutoMovieComposition.sequence(
      anchor,
      AutoMovieComposition.at("saved-kick", savedStep, -0.5, {
        align: "start",
      }),
      savedStep,
      stand,
    ),
    {
      timing: (intent, context): IAutoMovieIntentTiming => {
        record(intent);
        return laws.timing(intent, context);
      },
      align: (intent, _instant, target): number => {
        record(intent);
        return target;
      },
      until: (intent): number | undefined => {
        record(intent);
        return intent.until?.type === "proximity" ? 0.25 : undefined;
      },
      outcome: (entry): undefined => {
        record(entry.intent);
        return undefined;
      },
      state: (entry): void => record(entry.intent),
    },
  );
  const [placedAnchor, alignedStep, nextStep, placedStand] = restored.entries;
  TestValidator.predicate(
    "saved cut has one tagged intent across laws and entries",
    seen.length === 9 &&
      seen.every((intent) => intent === alignedStep!.intent) &&
      alignedStep!.intent === nextStep!.intent &&
      alignedStep!.intent.until?.type === "proximity" &&
      JSON.stringify(savedStep.until) === savedCut &&
      placedAnchor!.intent === anchor &&
      placedStand!.intent === stand,
  );
  TestValidator.predicate(
    "saved cut preserves aligned resume and the next interruption",
    close(alignedStep!.start, 0.5) &&
      close(alignedStep!.end, 0.75) &&
      close(nextStep!.start, 0.75) &&
      close(nextStep!.end, 1) &&
      close(placedStand!.start, 1) &&
      nextStep!.interruptedBy === placedStand!.index,
  );
  const undefinedTargetOptions: IAutoMovieSchedule = both(
    legacy({
      type: "proximity",
      proximity: {
        effector: "palmLeft",
        target: { kind: "none", line: undefined, range: undefined },
        distance: 0.1,
      },
    }),
    { ...laws, until: (): number => 0.25 },
  );
  TestValidator.predicate(
    "explicit undefined none-target options are accepted",
    close(
      undefinedTargetOptions.entries.find(
        (entry) => entry.intent.capability === "guard",
      )!.end,
      0.5,
    ),
  );
  TestValidator.error("legacy mixed share and event is rejected", (): unknown =>
    run(kick(legacy({ share: 0.25, event: "chamber" }))),
  );
  TestValidator.error("wrong tagged variant fields are rejected", (): unknown =>
    run(kick(legacy({ type: "share", share: 0.25, event: "chamber" }))),
  );
  TestValidator.error("unknown tagged variant is rejected", (): unknown =>
    run(kick(legacy({ type: "mystery", share: 0.25 }))),
  );

  const synced = (subject: string): IAutoMovieSchedule =>
    AutoMovieEngineSchedule.resolve(
      AutoMovieComposition.parallel(
        { ...kick(), anchor: "k" },
        AutoMovieComposition.sequence(
          { subject: "b", capability: "guard" },
          AutoMovieComposition.at("k", { subject, capability: "step" }, -0.5),
          { subject: "b", capability: "stand" },
        ),
      ),
      laws,
    );
  const own: IAutoMovieSchedule = synced("b");
  const ownSteps: readonly IAutoMovieScheduleEntry[] = own.entries.filter(
    (e) => e.subject === "b" && e.intent.capability !== "guard",
  );
  TestValidator.predicate(
    "a synced part cuts its own subject's action",
    close(ownSteps[0]!.start, 0.5) &&
      close(ownSteps[0]!.end, 1.5) &&
      close(ownSteps[1]!.start, 1.5),
  );
  const other: IAutoMovieSchedule = synced("c");
  TestValidator.predicate(
    "another subject's synced part keeps the cursor",
    close(other.entries.find((e) => e.intent.capability === "stand")!.start, 2),
  );
}
