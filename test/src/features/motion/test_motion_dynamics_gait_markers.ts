import { HumanChain, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

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
export function test_motion_dynamics_gait_markers(): void {
  const body = motionHumanBody("m-average");
  const film = new HumanPerformance({
    seed: "recompose-travel",
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
}
