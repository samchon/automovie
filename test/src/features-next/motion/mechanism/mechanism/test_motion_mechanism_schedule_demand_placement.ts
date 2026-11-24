import { resolveAutoMovieSchedule } from "@automovie/engine";
import type {
  IAutoMovieIntent,
  IAutoMovieIntentTiming,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieScheduleContext,
  IAutoMovieScheduleEntry,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStrike,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/**
 * A strike that reads a partner whose chain is composed after the striker's
 * places that chain first, and two parts that read each other are reported
 * as a cycle by the resolver.
 *
 * Scenarios:
 * 1. The average man jabs at a partner's chin; the partner's guard is
 *    composed after the striker's chain in the same parallel group. The
 *    performance places, and the jab reaches its contact.
 * 2. Two parallel parts whose actions read each other while they are timed:
 *    the first read places the waiting part, and that part's read back of the
 *    first, still being placed, is reported as a cycle.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both cases and their expected outcomes.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the performances through HumanPerformance and reads the placed schedule or the refusal.
 * @evidence contracts/development/testing.md#independent-expectations A placed contact for the ordered case and the cycle's wording for the other.
 * @evidence contracts/development/testing.md#distinguishing-cases A read of a later-declared chain against two chains that read each other.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of two polygon men.
 */
export function test_motion_mechanism_schedule_demand_placement(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const performers: IAutoMovieMotionHumanPerformance.IInput["performers"] = [
    {
      subject: "a",
      body,
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
      proficiency: { level: "trained" },
    },
    {
      subject: "b",
      body,
      at: { x: 0, y: 0, z: 0.55 * body.measure.stature },
      yaw: 180,
      proficiency: { level: "trained" },
    },
  ];

  // 1. The partner's chain is composed after the striker's.
  const ordered: HumanPerformance = new HumanPerformance({
    seed: "demand-ordered",
    laws: Object.values(AutoMovieMotionHumanStrike.HumanStrike),
    performers,
    composition: HumanChain.subject("a")
      .guard({ duration: 0.6, style: "kickboxing" })
      .registered(
        "jab",
        { at: { kind: "person", subject: "b", region: "chin" } },
        "strike",
      )
      .with(HumanChain.subject("b").guard({ duration: 2, style: "kickboxing" }))
      .node,
  });
  const strike: IAutoMovieScheduleEntry | undefined =
    ordered.schedule.entries.find(
      (entry: IAutoMovieScheduleEntry): boolean =>
        entry.intent.anchor === "strike",
    );
  TestValidator.predicate(
    "a strike on a later-declared partner is placed with its contact",
    strike?.contact !== undefined,
  );

  // 2. Two parts that read each other: the resolver's demand reports the
  // cycle to the second reader. Strikes read a partner a reaction time late
  // and within placed guards, so the cycle is read on the resolver itself.
  const found: IAutoMovieScheduleContext.Demand[] = [];
  resolveAutoMovieSchedule(
    {
      kind: "parallel",
      parts: [
        { kind: "intent", intent: { subject: "a", capability: "reach" } },
        { kind: "intent", intent: { subject: "b", capability: "reach" } },
      ],
    },
    {
      timing: (
        intent: IAutoMovieIntent,
        context: IAutoMovieScheduleContext,
      ): IAutoMovieIntentTiming => {
        // Each reads the other while it is timed.
        if (found.length < 2)
          found.push(context.demand!(intent.subject === "a" ? "b" : "a"));
        return { duration: 1 };
      },
    },
  );
  TestValidator.equals(
    "a read back from a demanded part is a cycle, and the first read placed that part",
    found,
    ["cycle", "placed"],
  );
}
