import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanAirborneShape,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A forward somersault completes one signed winding and lands upright.
 *
 * Scenarios:
 * 1. Accumulate the displayed long axis between the declared takeoff and touchdown of a single gymnast.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A forward somersault completes one signed winding and lands upright.
 * @evidence contracts/development/testing.md#independent-expectations A complete forward rotation winds positive two pi in the vertical/forward plane; its final basis matches its initial basis within 0.02 revolution.
 * @evidence contracts/development/testing.md#distinguishing-cases A stationary root and an extra full turn have upright endpoints but different winding.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_signed_flight_rotation(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const film: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "airborne",
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
      .jump(
        {
          to: { x: 0, y: 0, z: 1 },
          apex: 0.6,
          rotation: { somersault: 1, way: "forward" },
        },
        "leap",
      ).node,
    layers: {
      a: [
        {
          layer: HumanAirborneShape.layer("pike"),
          from: { of: "leap", event: "takeoff" },
          to: { of: "leap", event: "touchdown" },
          fade: 0.05,
        },
      ],
    },
  });
  const segment = film.segments("a")[1]!;
  const seconds = (name: string): number =>
    segment.start +
    segment.plan.duration *
      segment.plan.events.find((e) => e.name === name)!.share;
  const start: number = seconds("takeoff"),
    end: number = seconds("touchdown") - 1e-6;
  const initial: IAutoMovieQuaternion = film.pose("a", start).root!.rotation;
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(initial);
  let last: number = 0,
    winding: number = 0;
  const count: number = Math.ceil(60 * (end - start));
  for (let i = 0; i <= count; i++) {
    const actual = film.pose("a", start + ((end - start) * i) / count).root!
      .rotation;
    const relative: IAutoMovieQuaternion = Quaternion.multiply(inverse, actual);
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(relative, {
      x: 0,
      y: 1,
      z: 0,
    });
    TestValidator.predicate(
      "observable long axis",
      Math.hypot(axis.y, axis.z) > Math.sqrt(Number.EPSILON),
    );
    const angle: number = Math.atan2(axis.z, axis.y);
    if (i > 0)
      winding += Math.atan2(Math.sin(angle - last), Math.cos(angle - last));
    last = angle;
    if (i === count)
      TestValidator.predicate(
        "upright landing",
        2 * Math.acos(Math.min(1, Math.abs(relative.w))) <= 0.02 * 2 * Math.PI,
      );
  }
  TestValidator.predicate(
    "one forward winding",
    Math.abs(winding / (2 * Math.PI) - 1) <= 0.02,
  );
}
