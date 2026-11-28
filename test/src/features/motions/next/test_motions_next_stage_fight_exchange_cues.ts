import type {
  IAutoMovieSchedule,
  IAutoMovieScheduleCue,
  IAutoMovieScheduleEntry,
} from "@automovie/interface";
import { AutoMovieMotionHumanStageFight } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Check editing cues in a played stage exchange.
 *
 * Scenarios:
 *
 * 1. Keep the opening and block tie at 2.25 s in declaration order. Read the
 *    reply's entry at 2.5 s.
 * 2. When an opening is cut before contact and the block reaches its stroke
 *    exactly at the cut, emit the block alone at 4.5 s.
 * 3. When both cues fall beyond the cut, return an empty track. Reject an
 *    absent exchange identifier.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases identify event timing, same-instant order, clip inclusion and missing identity.
 * @evidence contracts/development/testing.md#behavioral-verification The cue reader consumes a complete typed schedule with separate opening, reply, block and unrelated rows.
 * @evidence contracts/development/testing.md#independent-expectations The placed starts and authored event shares determine each second, and inclusive cut endpoints distinguish the two truncation cases.
 */
export function test_motions_next_stage_fight_exchange_cues(): void {
  const entry = (
    index: number,
    anchor: string,
    subject: string,
    capability: string,
    start: number,
    end: number,
  ): IAutoMovieScheduleEntry => ({
    index,
    subject,
    intent: { anchor, capability, subject },
    start,
    end,
  });
  const schedule: IAutoMovieSchedule = {
    duration: 7,
    entries: [
      {
        ...entry(0, "side.first.block", "c", "parry", 0, 1),
        events: [{ name: "stroke", seconds: 0.75 }],
      },
      { ...entry(1, "first.opening", "a", "cut", 1, 3), contact: 2.25 },
      {
        ...entry(2, "first.block", "b", "parry", 1.5, 2.5),
        events: [
          { name: "prepare", seconds: 1.75 },
          { name: "stroke", seconds: 2.25 },
        ],
      },
      {
        ...entry(3, "first.reply", "b", "riposte", 2.5, 3.5),
        contact: 3,
      },
      {
        ...entry(4, "second.opening", "a", "cut", 4, 4.25),
        cut: { share: 0.25 },
      },
      {
        ...entry(5, "second.block", "b", "parry", 4, 4.5),
        cut: { share: 0.5 },
        events: [{ name: "stroke", seconds: 4.5 }],
      },
      {
        ...entry(6, "last.opening", "b", "cut", 6, 6.25),
        cut: { share: 0.25 },
      },
      {
        ...entry(7, "last.block", "a", "parry", 6.125, 6.375),
        cut: { share: 0.25 },
        events: [{ name: "stroke", seconds: 6.625 }],
      },
    ],
  };
  const first: IAutoMovieScheduleCue[] =
    AutoMovieMotionHumanStageFight.readHumanBladeExchangeCues(
      schedule,
      "first",
    );
  TestValidator.equals(
    "the full exchange reads its own phases",
    first.map((mark: IAutoMovieScheduleCue): string => mark.name),
    ["opening", "block", "reply"],
  );
  TestValidator.predicate(
    "the follow-through is cued at its start",
    (): boolean =>
      nclose(first[0]?.seconds ?? Number.NaN, 2.25) &&
      nclose(first[1]?.seconds ?? Number.NaN, 2.25) &&
      nclose(first[2]?.seconds ?? Number.NaN, 2.5),
  );
  const atCut: IAutoMovieScheduleCue[] =
    AutoMovieMotionHumanStageFight.readHumanBladeExchangeCues(
      schedule,
      "second",
    );
  TestValidator.predicate(
    "a stroke on the retained boundary is still cued",
    (): boolean =>
      atCut.length === 1 &&
      atCut[0]?.name === "block" &&
      nclose(atCut[0].seconds, 4.5),
  );
  TestValidator.equals(
    "the empty track represents an exchange edited before its cues",
    AutoMovieMotionHumanStageFight.readHumanBladeExchangeCues(schedule, "last"),
    [],
  );
  TestValidator.error("an unrelated anchor is not an exchange", (): void => {
    AutoMovieMotionHumanStageFight.readHumanBladeExchangeCues(
      schedule,
      "side.first",
    );
  });
}
