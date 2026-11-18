import {
  HumanChain,
  HumanFoot,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A planted sole stays in the ground frame and lifts during swing.
 *
 * Scenarios:
 * 1. Read one gait cycle of a straight walk.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A planted sole stays in the ground frame and lifts during swing.
 * @evidence contracts/development/testing.md#independent-expectations A ground contact has zero world drift; the five-millimetre bound permits the rig fit.
 * @evidence contracts/development/testing.md#distinguishing-cases Samples on opposite sides of the event distinguish bearing from swing.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_gait_ground_lock(): void {
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
  const reader = HumanSignature.of(film, "a", body, 0);
  const sockets = (t: number) =>
    HumanFoot.sockets(body, film.bones("a", t), "left").map((s) => s.point);
  const supported = (heel + next) / 2;
  TestValidator.predicate(
    "planted socket stays over ground",
    HumanSignature.bears(reader, supported, "left", 0, 0),
  );
  const before = sockets(supported - 1 / 240),
    after = sockets(supported + 1 / 240);
  const slip = Math.min(
    ...before.map((p, i) => Math.hypot(p.x - after[i]!.x, p.z - after[i]!.z)),
  );
  TestValidator.predicate("stationary sole in stance", slip <= 0.005);
  TestValidator.predicate(
    "free sole clears during swing",
    !HumanSignature.bears(reader, (toe + heel) / 2, "left", 0, 0),
  );
}
