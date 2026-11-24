import type {
  IAutoMovieSchedule,
  IAutoMovieScheduleCue,
  IAutoMovieScheduleEntry,
} from "@automovie/interface";
import { AutoMovieMotionHumanStageFight } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../features/internal/nclose";

/**
 * Read editing cues from an in-memory film schedule with three staged
 * exchanges and an unrelated action.
 *
 * Scenarios:
 * 1. The first opening and block meet at 2.25 seconds. Keep their order on
 *    that tie and read the reply's start at 2.5, before its own contact.
 * 2. The second opening is cut before contact, but the block's stroke is
 *    exactly at its own cut. Keep the block at 4.5 with no reply.
 * 3. The last opening is cut before contact and its block is cut before
 *    the stroke. Return an empty track. Refuse a different, absent cue id.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the fixture's exact film times and distinguishes a cut encounter from a missing cue.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public cue reader; prefix matches, wrong event sources, dropped cut endpoints and cues after a cut change its observable track.
 * @evidence contracts/development/testing.md#independent-expectations The schedule fixture assigns the stages, cuts and instants. Assertions use those stated film seconds, rather than timing measured from the implementation or a pose.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a chronological tie, a distinct reply onset and contact, optional reply absence, an event at and after a cut, an unrelated anchor and a missing cue.
 * @evidence contracts/development/testing.md#execution-ownership Portable logic unit spec. The in-memory schedule contains no geometry, arm plan, host or capture.
 */
export function test_motion_stage_fight_blade_exchange_cues(): void {
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
    AutoMovieMotionHumanStageFight.readHumanBladeExchangeCues(
      schedule,
      "last",
    ),
    [],
  );
  TestValidator.error("an unrelated anchor is not an exchange", (): void => {
    AutoMovieMotionHumanStageFight.readHumanBladeExchangeCues(
      schedule,
      "side.first",
    );
  });
}
