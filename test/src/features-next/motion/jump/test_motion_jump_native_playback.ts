import type {
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";
import { qclose } from "../../../features/internal/qclose";
import { vclose } from "../../../features/internal/vclose";

/**
 * Native jump playback agrees with unaltered layered authoring at actual phase
 * boundaries and out-of-order interior reads.
 *
 * Scenarios:
 * 1. Seek across the push, turning flight, absorption and recovery on two otherwise identical performances.
 * 2. Give one performance an identity layer so that it uses ordinary posture fitting.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the observed jump, the phase order tested and why the layer is present.
 * @evidence contracts/development/testing.md#behavioral-verification Compares canonical root and clinical joints returned by the performance at the actual event seconds and between them.
 * @evidence contracts/development/testing.md#independent-expectations A layer that returns its input contributes zero motion. The bare jump must display the same articulation and root.
 * @evidence contracts/development/testing.md#distinguishing-cases Different phase owners meet at takeoff, touchdown and settling. Reversing the query order checks that fitting uses the current sample's geometry.
 * @evidence contracts/development/testing.md#execution-ownership Constructs and observes both public performances in memory with no replacement of methods.
 */
export function test_motion_jump_native_playback(): void {
  const body: ReturnType<typeof motionHumanBody> = motionHumanBody("m-average");
  const layer: IAutoMovieMotionHumanLayer = {
    name: "identity",
    apply: (
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieMotionHumanPosture => posture,
  };
  const make = (layered: boolean): HumanPerformance =>
    new HumanPerformance({
      seed: "jump-native-playback",
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
        .stand({ hold: 0.3, sway: 0 })
        .jump({
          to: { x: 0.2, y: 0, z: 1 },
          apex: 0.5,
          rotation: { somersault: 1, way: "forward" },
        }).node,
      ...(layered ? { layers: { a: [layer] } } : {}),
    });
  const native: HumanPerformance = make(false);
  const ordinary: HumanPerformance = make(true);
  const segment: IAutoMovieMotionHumanSegment = native.segments("a")[1]!;
  const seconds = (name: string): number =>
    segment.start +
    segment.plan.events.find((event) => event.name === name)!.share *
      segment.plan.duration;
  const takeoff: number = seconds("takeoff");
  const touchdown: number = seconds("touchdown");
  const settled: number = seconds("settled");
  const end: number = segment.start + segment.plan.duration;
  for (const at of [
    touchdown,
    (settled + end) / 2,
    takeoff,
    (segment.start + takeoff) / 2,
    settled,
    seconds("apex"),
    (touchdown + settled) / 2,
    end,
    touchdown,
  ]) {
    const actual: IAutoMoviePose = native.pose("a", at);
    const expected: IAutoMoviePose = ordinary.pose("a", at);
    TestValidator.predicate(
      `displayed root at ${at} seconds`,
      vclose(actual.root!.translation, expected.root!.translation, 1e-9) &&
        qclose(actual.root!.rotation, expected.root!.rotation, 1e-9),
    );
    TestValidator.predicate(
      `displayed clinical joints at ${at} seconds`,
      actual.joints.length === expected.joints.length &&
        actual.joints.every((joint, i) => {
          const target: IAutoMoviePose["joints"][number] = expected.joints[i]!;
          return (
            joint.bone === target.bone &&
            nclose(joint.flexion ?? 0, target.flexion ?? 0, 1e-9) &&
            nclose(joint.abduction ?? 0, target.abduction ?? 0, 1e-9) &&
            nclose(joint.twist ?? 0, target.twist ?? 0, 1e-9)
          );
        }),
    );
  }
}
