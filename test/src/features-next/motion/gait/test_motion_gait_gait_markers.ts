import type { IAutoMovieMotionHumanPerformance } from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanWalkSignature } from "../../../features/internal/motionHumanWalkSignature";

/**
 * Public gait markers agree with the two independent contact-window edges.
 *
 * Scenarios:
 * 1. Read one gait cycle of a straight walk.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Public gait markers agree with the two independent contact-window edges.
 * @evidence contracts/development/testing.md#independent-expectations The same foot is supported immediately before toe-off and immediately after heel strike.
 * @evidence contracts/development/testing.md#distinguishing-cases Samples on opposite sides of the event distinguish bearing from swing.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_gait_gait_markers(): void {
  const body = motionHumanBody("m-average");
  const perform = (seed: string) =>
    new HumanPerformance({
      seed,
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").walk({ to: { x: 0, y: 0, z: 6 } })
        .node,
    });
  const film = perform("recompose-travel");
  const strikes = (walk: IAutoMovieMotionHumanPerformance) => {
    const part = walk.segments("a")[0]!;
    return part.plan.events
      .filter((e) => /^(left|right)HeelStrike\d+$/.test(e.name))
      .map((e) => ({
        name: e.name,
        time: part.start + e.share * part.plan.duration,
      }))
      .sort((a, b) => a.time - b.time);
  };
  const first = strikes(film),
    other = perform("timing-2"),
    second = strikes(other);
  TestValidator.equals(
    "same seed repeats each strike",
    strikes(perform("recompose-travel")),
    first,
  );
  TestValidator.predicate(
    "changing only seed changes strike times",
    first.length >= 4 &&
      first.length === second.length &&
      Math.max(...first.map((v, i) => Math.abs(v.time - second[i]!.time))) >
        0.001,
  );
  for (const [i, one] of first.entries()) {
    const side = one.name.startsWith("left") ? "leftFoot" : "rightFoot";
    const a = film.bones("a", one.time + 1 / 24).get(side)!.worldPosition,
      b = other.bones("a", second[i]!.time + 1 / 24).get(side)!.worldPosition;
    TestValidator.predicate(
      "strike placements agree to two millimetres",
      Math.hypot(a.x - b.x, a.z - b.z) <= 0.002,
    );
  }
  const stop = (walk: IAutoMovieMotionHumanPerformance): number => {
    const limbs = walk.bones("a", walk.duration);
    return (
      (limbs.get("leftUpperLeg")!.worldPosition.z +
        limbs.get("rightUpperLeg")!.worldPosition.z) /
      2
    );
  };
  TestValidator.predicate(
    "seed leaves the destination within one millimetre",
    Math.abs(stop(film) - stop(other)) <= 0.001,
  );
  const segment = film.segments("a")[0]!;
  const event = (name: string): number => {
    const item = segment.plan.events.find((value) => value.name === name);
    if (item === undefined) throw new Error("missing gait event " + name);
    return segment.start + item.share * segment.plan.duration;
  };
  const toe = event("leftToeOff1"),
    heel = event("leftHeelStrike1"),
    last = event("lastFootfall");
  const contact = segment.plan.contacts.filter(
    (c) => c.part === "leftFoot" && c.kind === "plant",
  );
  const windows = contact.map(
    (c) =>
      [
        segment.start + c.from * segment.plan.duration,
        segment.start + c.to * segment.plan.duration,
      ] as const,
  );
  const supported = (t: number): boolean =>
    windows.some(([from, to]) => t >= from && t <= to);
  const h = (heel - toe) / 1000;
  TestValidator.predicate(
    "toe-off, heel strike, final footfall",
    toe < heel && heel <= last && last <= event("arrive"),
  );
  TestValidator.predicate(
    "toe-off releases swing",
    supported(toe - h) && !supported(toe + h),
  );
  TestValidator.predicate(
    "heel strike restores support",
    !supported(heel - h) && supported(heel + h),
  );
  const observations = motionComplaints();
  motionHumanWalkSignature.read("f-small", observations);
  observations.assert(
    "explicit walking paces retain stance, gaze, cadence and trunk bounds",
  );
}
