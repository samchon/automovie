import {
  HumanChain,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * The first lifted foot returns to bearing at its named heel strike.
 *
 * Scenarios:
 *
 * 1. Read one gait cycle of a straight walk.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The first lifted foot returns to bearing at its named heel strike.
 * @evidence contracts/development/testing.md#independent-expectations The displayed foot’s low, stationary contact identifies support independently of its declared events.
 * @evidence contracts/development/testing.md#distinguishing-cases Samples on opposite sides of the event distinguish bearing from swing.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_support_support_gait_events(): void {
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
    next = event("leftToeOff2");
  const reader = HumanSignature(film, "a", body, 0);
  const actual = HumanSignature.gait(reader, 0, next, 120).strikes.filter(
    (s) => s.side === "left",
  );
  TestValidator.predicate(
    `left strike declared ${heel}s, observed ${actual.map((s) => s.seconds)}s; toe-off ${toe}s and next toe-off ${next}s`,
    actual.some((s) => Math.abs(s.seconds - heel) <= 1 / 24),
  );
  TestValidator.predicate(
    "swing and subsequent support",
    !HumanSignature.bears(reader, (toe + heel) / 2, "left", 0, 0) &&
      HumanSignature.bears(reader, (heel + next) / 2, "left", 0, 0),
  );
}
