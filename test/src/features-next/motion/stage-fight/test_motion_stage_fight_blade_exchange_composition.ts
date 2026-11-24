import { AutoMovieComposition } from "@automovie/engine";
import type {
  IAutoMovieChain,
  IAutoMovieIntentTiming,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBladeExchange,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPosture,
  IAutoMovieSchedule,
  IAutoMovieScheduleCue,
  IAutoMovieScheduleEntry,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStageFight,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

/**
 * Place two staged exchanges in a HumanPerformance using registered stage
 * timing laws that hold each performer's pose. The opening cue is 1.25
 * seconds into its two-second action. The block spends 0.75 seconds on
 * either side of its stroke.
 *
 * Scenarios:
 * 1. After a two-second opener preparation, the block starts at 2.5 seconds,
 *    meets the cue at 3.25 and ends at 4. The reply starts at 4 and ends at 5.
 *    The answered opening is taken: the opener holds the blade from 4 to the
 *    reply's end at 5, then guards until 5.5; the block is a bind.
 * 2. With the cast reversed and a new cue, the second block starts at 8,
 *    meets at 8.75 and ends at 9.5. Omit the reply to end the scene at 9.5
 *    with a plain parry.
 * 3. Retain each role's authored prop and mark. Refuse repeated performers,
 *    repeated props, blank ids and a negative lead.
 * 4. Read the first exchange's editing cues from the placed schedule.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the fixture clock, phase order, cue independence, authored marks and refused inputs.
 * @evidence contracts/development/testing.md#behavioral-verification Resolves two compositions in sequence, checking subjects, props, marks and instants. A dropped preparation, aligned start instead of stroke, wrong cue or unordered response changes the result. One projected track checks the actual schedule-to-edit handoff.
 * @evidence contracts/development/testing.md#independent-expectations Derives expected film times by addition and subtraction from arbitrary fixture durations and stage cues. Authored film marks are direct test inputs. The spec owns choreography composition; posed blade geometry is covered by the blade exchange spec.
 * @evidence contracts/development/testing.md#distinguishing-cases Exercises parallel roles, a reversed cast with its own anchors, reply present and absent, and malformed cast, prop, lead and cue choices. The cue-reader spec owns tie order, cuts and absence.
 * @evidence contracts/development/testing.md#execution-ownership Portable composition spec. HumanPerformance places registered timing laws over an in-memory body, with no host or capture.
 */
export function test_motion_stage_fight_blade_exchange_composition(): void {
  const castA: IAutoMovieMotionHumanChain = HumanChain.subject("a").registered(
    "prepareOpening",
    {},
    "a.ready",
  );
  const castB: IAutoMovieMotionHumanChain = HumanChain.subject("b").registered(
    "prepareBlock",
    {},
    "b.ready",
  );
  const first: IAutoMovieMotionHumanBladeExchange = {
    cue: "first",
    openingProp: "foam-a",
    respondingProp: "foam-b",
    blockLeadSeconds: 0.75,
    openingMark: { kind: "prop", subject: "set", point: "mark-a" },
    replyMark: { kind: "prop", subject: "set", point: "mark-b" },
  };
  const second: IAutoMovieMotionHumanBladeExchange = {
    cue: "second",
    openingProp: "foam-b",
    respondingProp: "foam-a",
    blockLeadSeconds: 0.75,
    openingMark: { kind: "prop", subject: "set", point: "mark-c" },
  };
  const full: IAutoMovieChain = AutoMovieMotionHumanStageFight.bladeExchange(
    castA,
    castB,
    first,
  );
  const short: IAutoMovieChain = AutoMovieMotionHumanStageFight.bladeExchange(
    HumanChain.subject("b").registered("prepareOpening"),
    HumanChain.subject("a").registered("prepareBlock"),
    second,
  );
  const timings: Readonly<Record<string, IAutoMovieIntentTiming>> = {
    prepareOpening: { duration: 2 },
    prepareBlock: { duration: 1 },
    cut: { duration: 2, contact: 1.25 },
    parry: { duration: 1.5, events: [{ name: "stroke", share: 0.5 }] },
    bind: { duration: 1.5, events: [{ name: "stroke", share: 0.5 }] },
    riposte: { duration: 1 },
    taken: { duration: 1 },
    enGarde: { duration: 0.5 },
  };
  const laws: IAutoMovieMotionHumanActionLaw<never>[] = Object.entries(
    timings,
  ).map(
    ([name, timing]: [
      string,
      IAutoMovieIntentTiming,
    ]): IAutoMovieMotionHumanActionLaw<never> => ({
      name,
      interrupts: {},
      plan: (
        context: IAutoMovieMotionHumanActionContext<never>,
      ): IAutoMovieMotionHumanActionPlan => ({
        ...timing,
        events: [...(timing.events ?? [])],
        contacts: context.entry.supports.map(
          (
            support: IAutoMovieMotionHumanEntryState.ISupport,
          ): IAutoMovieMotionHumanActionPlan["contacts"][number] => ({
            ...support,
            from: 0,
            to: 1,
          }),
        ),
        posture: (): IAutoMovieMotionHumanPosture => context.entry.posture,
      }),
    }),
  );
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "staged-exchange-editing",
    laws,
    performers: ["a", "b"].map((subject: string, i: number) => ({
      subject,
      body,
      at: { x: i * 2, y: 0, z: 0 },
      yaw: 0,
      proficiency: { level: "trained" as const },
    })),
    composition: AutoMovieComposition.sequence(full, short),
  });
  const film: IAutoMovieSchedule = performance.schedule;
  const placed = (anchor: string): IAutoMovieScheduleEntry => {
    const action: IAutoMovieScheduleEntry | undefined = film.entries.find(
      (entry: IAutoMovieScheduleEntry): boolean =>
        entry.intent.anchor === anchor,
    );
    if (action === undefined) throw new Error(`Missing action ${anchor}`);
    return action;
  };
  const opening: IAutoMovieScheduleEntry = placed("first.opening");
  const block: IAutoMovieScheduleEntry = placed("first.block");
  const reply: IAutoMovieScheduleEntry = placed("first.reply");
  const reversed: IAutoMovieScheduleEntry = placed("second.block");
  const readyA: IAutoMovieScheduleEntry = placed("a.ready");
  const readyB: IAutoMovieScheduleEntry = placed("b.ready");

  TestValidator.predicate(
    "the cast prepares in parallel",
    (): boolean =>
      nclose(readyA.start, 0) &&
      nclose(readyA.end, 2) &&
      nclose(readyB.start, 0) &&
      nclose(readyB.end, 1),
  );
  TestValidator.predicate(
    "the block meets the opening after preparation",
    (): boolean =>
      nclose(opening.start, 2) &&
      nclose(opening.contact ?? Number.NaN, 3.25) &&
      nclose(block.start, 2.5) &&
      nclose(block.events?.[0]?.seconds ?? Number.NaN, 3.25),
  );
  TestValidator.predicate(
    "the reply waits for the block to finish",
    (): boolean =>
      nclose(block.end, 4) && nclose(reply.start, 4) && nclose(reply.end, 5),
  );
  TestValidator.predicate(
    "the opener keeps the taken blade until the reply ends, then guards",
    (): boolean =>
      nclose(placed("first.taken").start, 4) &&
      nclose(placed("first.taken").end, 5) &&
      nclose(placed("first.guard").start, 5) &&
      nclose(placed("first.guard").end, 5.5),
  );
  TestValidator.predicate(
    "the next block reads its own cue",
    (): boolean =>
      nclose(reversed.start, 8) &&
      nclose(reversed.events?.[0]?.seconds ?? Number.NaN, 8.75) &&
      nclose(film.duration, 9.5),
  );
  TestValidator.equals(
    "the answered opening is authored as blocked and taken",
    opening.intent.parameters,
    {
      params: {
        blade: "foam-a",
        outcome: "parried",
        target: { kind: "prop", subject: "set", point: "mark-a" },
        taken: true,
      },
    },
  );
  TestValidator.equals(
    "the answered block is a bind, the unanswered one a parry",
    [block.intent.capability, reversed.intent.capability],
    ["bind", "parry"],
  );
  TestValidator.equals(
    "the taken blade holds on the block until the reply",
    placed("first.taken").intent.parameters,
    {
      params: { blade: "foam-a", against: "first.block", until: "first.reply" },
    },
  );
  TestValidator.equals(
    "the second block has the reversed cast",
    reversed.subject,
    "a",
  );
  TestValidator.equals(
    "the second block reads the opening of its scene",
    reversed.intent.parameters,
    { params: { blade: "foam-a", against: "second.opening" } },
  );
  TestValidator.equals(
    "the reply uses the responder's separate mark",
    reply.intent.parameters,
    {
      params: {
        blade: "foam-b",
        target: { kind: "prop", subject: "set", point: "mark-b" },
      },
    },
  );
  TestValidator.equals(
    "the second scene has no reply",
    film.entries.filter(
      (entry: IAutoMovieScheduleEntry): boolean =>
        entry.intent.capability === "riposte",
    ).length,
    1,
  );

  const track: IAutoMovieScheduleCue[] =
    AutoMovieMotionHumanStageFight.readHumanBladeExchangeCues(
    film,
    "first",
  );
  const expected: readonly IAutoMovieScheduleCue[] = [
    { name: "opening", seconds: 3.25 },
    { name: "block", seconds: 3.25 },
    { name: "reply", seconds: 4 },
  ];
  TestValidator.predicate(
    "the placed schedule supplies the editing track",
    (): boolean =>
      track.length === expected.length &&
      track.every(
        (event: IAutoMovieScheduleCue, index: number): boolean =>
          event.name === expected[index]!.name &&
          nclose(event.seconds, expected[index]!.seconds),
      ),
  );

  TestValidator.error("the two performers must be distinct", (): void => {
    AutoMovieMotionHumanStageFight.bladeExchange(castA, castA, first);
  });
  const invalid: readonly [
    string,
    Partial<IAutoMovieMotionHumanBladeExchange>,
  ][] = [
    ["the two props must be distinct", { respondingProp: "foam-a" }],
    ["the stage props must have ids", { openingProp: "" }],
    ["the block lead must be nonnegative", { blockLeadSeconds: -1 }],
    ["the stage cue must have a name", { cue: " " }],
  ];
  for (const [name, input] of invalid)
    TestValidator.error(name, (): void => {
      AutoMovieMotionHumanStageFight.bladeExchange(castA, castB, {
        ...first,
        ...input,
      });
    });
}
