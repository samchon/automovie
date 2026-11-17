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
  HumanChain,
  HumanPerformance,
  composeHumanBladeExchange,
  readHumanBladeExchangeCues,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";

/**
 * Place two staged exchanges in a HumanPerformance using registered stage
 * timing laws that hold each performer's pose. The opening cue is 1.25
 * seconds into its two-second action. The block spends 0.75 seconds on
 * either side of its stroke.
 *
 * Scenarios:
 * 1. After a two-second opener preparation, the block starts at 2.5 seconds,
 *    meets the cue at 3.25 and ends at 4. The reply starts at 4 and ends at 5.
 * 2. With the cast reversed and a new cue, the second block starts at 7.5,
 *    meets at 8.25 and ends at 9. Omit the reply to end the scene at 9.
 * 3. Verify that each role retains its authored prop and stage mark and that
 *    a repeated performer, a shared prop and a blank cue are refused.
 * 4. Read both exchanges' editing cues from the placed film schedule.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the fixture clock, phase order, cue independence, authored marks and refused inputs.
 * @evidence contracts/development/testing.md#behavioral-verification Resolves two compositions in sequence, asserting placed subjects, props, marks and instants; a dropped preparation, aligned start instead of stroke, wrong cue or unordered response changes the result. The public reader projects cue tracks from those placements.
 * @evidence contracts/development/testing.md#independent-expectations Derives expected film times by addition and subtraction from arbitrary fixture durations and stage cues. Authored film marks are direct test inputs. The spec owns choreography composition; posed blade geometry is covered by the blade exchange spec.
 * @evidence contracts/development/testing.md#distinguishing-cases Exercises parallel roles, a reversed cast with its own anchors, reply present and absent, and malformed cast, prop and cue choices.
 * @evidence contracts/development/testing.md#execution-ownership Portable composition spec. HumanPerformance places registered timing laws over an in-memory body, with no host or capture.
 */
export function test_human_motion_blade_exchange_composition(): void {
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
  const full: IAutoMovieChain = composeHumanBladeExchange(castA, castB, first);
  const short: IAutoMovieChain = composeHumanBladeExchange(
    HumanChain.subject("b").registered("prepareOpening"),
    HumanChain.subject("a").registered("prepareBlock"),
    second,
  );
  const timings: Readonly<Record<string, IAutoMovieIntentTiming>> = {
    prepareOpening: { duration: 2 },
    prepareBlock: { duration: 1 },
    cut: { duration: 2, contact: 1.25 },
    parry: { duration: 1.5, events: [{ name: "stroke", share: 0.5 }] },
    riposte: { duration: 1 },
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
      (entry: IAutoMovieScheduleEntry): boolean => entry.intent.anchor === anchor,
    );
    if (action === undefined) throw new Error(`Missing action ${anchor}`);
    return action;
  };
  const opening: IAutoMovieScheduleEntry = placed("first.opening");
  const block: IAutoMovieScheduleEntry = placed("first.block");
  const reply: IAutoMovieScheduleEntry = placed("first.reply");
  const reversed: IAutoMovieScheduleEntry = placed("second.block");

  TestValidator.predicate(
    "the cast prepares in parallel",
    (): boolean =>
      nclose(placed("a.ready").start, 0) &&
      nclose(placed("a.ready").end, 2) &&
      nclose(placed("b.ready").start, 0) &&
      nclose(placed("b.ready").end, 1),
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
    "the next block reads its own cue",
    (): boolean =>
      nclose(reversed.start, 7.5) &&
      nclose(reversed.events?.[0]?.seconds ?? Number.NaN, 8.25) &&
      nclose(film.duration, 9),
  );
  TestValidator.equals(
    "the opening is authored as blocked",
    opening.intent.parameters,
    {
      params: {
        blade: "foam-a",
        outcome: "parried",
        target: { kind: "prop", subject: "set", point: "mark-a" },
      },
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

  for (const [cue, expected] of [
    ["first", [["opening", 3.25], ["block", 3.25], ["reply", 4]]],
    ["second", [["opening", 8.25], ["block", 8.25]]],
  ] as const) {
    const track: IAutoMovieScheduleCue[] = readHumanBladeExchangeCues(film, cue);
    TestValidator.equals(
      `${cue} editing cue names in film order`,
      track.map((event: IAutoMovieScheduleCue): string => event.name),
      expected.map(([name]) => name),
    );
    TestValidator.predicate(
      `${cue} editing cues use the placed film seconds`,
      expected.every(([, seconds], i: number): boolean =>
        nclose(track[i]?.seconds ?? Number.NaN, seconds),
      ),
    );
  }

  TestValidator.error("the two performers must be distinct", (): void => {
    composeHumanBladeExchange(castA, castA, first);
  });
  TestValidator.error("the two props must be distinct", (): void => {
    composeHumanBladeExchange(castA, castB, {
      ...first,
      respondingProp: "foam-a",
    });
  });
  TestValidator.error("the stage props must have ids", (): void => {
    composeHumanBladeExchange(castA, castB, { ...first, openingProp: "" });
  });
  TestValidator.error("the block lead must be nonnegative", (): void => {
    composeHumanBladeExchange(castA, castB, { ...first, blockLeadSeconds: -1 });
  });
  TestValidator.error("the stage cue must have a name", (): void => {
    composeHumanBladeExchange(castA, castB, { ...first, cue: " " });
  });
}
