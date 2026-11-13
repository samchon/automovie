import type { resolveAutoMovieSchedule } from "@automovie/engine";
import {
  HumanChain,
  HumanCue,
  HumanPerformance,
  type HumanSegment,
  type IHumanActionContext,
  type IHumanActionLaw,
  type IHumanActionPlan,
  type IHumanBody,
  type IHumanEntryState,
  type IHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * An action entered past its start is aligned on the timing it will have
 * when placed: the instant the schedule aligns falls on its target second.
 *
 * A test law `marker` lasts a second with its `mark` at three quarters, and
 * its own cancel table enters a following `marker` at half of it. The
 * second marker is synced so that its `mark` falls on the third beat of a
 * 96 bpm score (1.25 s), which cuts into the first one. The schedule plans it once as a trial to read how
 * far its `mark` lies after its start, then places it: the trial must read
 * what the placed action gives, the part left after the entry and the
 * shares on that part, or the mark lands a quarter second early.
 *
 * Scenarios, on the average man:
 * 1. The placed second marker is entered at half of its plan.
 * 2. Its `mark` falls on the beat at 1.25 s, within a microsecond.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers a law through the public input, syncs it to a cue track and reads the placed action's instant; a trial that reads the whole plan's shares misplaces the mark by the entry's part.
 * @evidence contracts/development/testing.md#independent-expectations The beat is the score's own second (2 x 60 / 96) and the entry and the mark's share are the test law's own numbers; nothing is read from the schedule.
 * @evidence contracts/development/testing.md#distinguishing-cases An action entered past its start, which no shipped cancel table does yet; one entered at its start is the sync spec's.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds one short performance; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the test law and the 2 scenarios.
 */
export function test_human_motion_core_schedule_entry_align(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const marker: IHumanActionLaw<never> = {
    name: "marker",
    interrupts: {
      marker: [{ window: [0, 1], kind: "inertialize", entry: 0.5, blend: 0.1 }],
    } as IHumanActionLaw["interrupts"],
    plan: (context: IHumanActionContext<never>): IHumanActionPlan => ({
      duration: 1,
      events: [{ name: "mark", share: 0.75 }],
      contacts: context.entry.supports.map(
        (
          support: IHumanEntryState.ISupport,
        ): IHumanActionPlan["contacts"][number] => ({
          ...support,
          from: 0,
          to: 1,
        }),
      ),
      posture: (): IHumanPosture => context.entry.posture,
    }),
  };
  const cues: { music: resolveAutoMovieSchedule.ICue[] } = {
    music: HumanCue.beats({ bpm: 96, count: 8 }),
  };
  const performance: HumanPerformance = new HumanPerformance({
    seed: "entry",
    laws: [marker],
    cues,
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a")
      .stand({ seconds: 0.3 })
      .registered("marker")
      .registered("marker")
      .sync({ of: "music", event: "beat", index: 2, align: "mark" }).node,
  });
  const second: HumanSegment.ISegment = performance.segments("a")[2]!;
  const entered: number =
    (second.entryTime - second.start) / second.plan.duration;
  const mark: number =
    second.start +
    (second.plan.events.find(
      (e: IHumanActionPlan["events"][number]): boolean => e.name === "mark",
    )?.share ?? NaN) *
      second.plan.duration;
  TestValidator.predicate(
    "the second marker is entered at half of its plan",
    Math.abs(entered - 0.5) <= 1e-9,
  );
  TestValidator.equals(
    "its mark falls on the beat",
    Math.abs(mark - 1.25) <= 1e-6 ? "on the beat" : `at ${mark.toFixed(6)} s`,
    "on the beat",
  );
}
