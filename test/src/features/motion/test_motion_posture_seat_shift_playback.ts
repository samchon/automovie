import { integrateAirborneRotation } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import { HumanPerformance } from "@automovie/motions";

import { HumanPreparedPlayback } from "../../../../packages/motions/src/perform/HumanPreparedPlayback";
import { MOTION_HUMAN_LAW_STAGES_POSTURE } from "../internal/MOTION_HUMAN_LAW_STAGES_POSTURE";
import type { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLawSweep } from "../internal/motionHumanLawSweep";

/**
 * A lateral seat shift retains the authored planted-foot and thigh-palm
 * goals across weight transfer, throughout the slide and after it ends.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the compared authored and displayed samples across the shift clock.
 * @evidence contracts/development/testing.md#behavioral-verification Compares actual authored channels and displayed fits of native and ordinary reads, and checks callback replacement.
 * @evidence contracts/development/testing.md#independent-expectations The public writer provides the unchanged transfer behavior, with epsilon only for arithmetic roundoff from the change of coordinates.
 * @evidence contracts/development/testing.md#distinguishing-cases Uses two body sizes, event boundaries, and seeks before and after the slide in nonmonotonic order.
 * @evidence contracts/development/testing.md#execution-ownership Both films use the public scene with a real seated entry. Separate film caches isolate the native and replacement display routes.
 */
export function test_motion_posture_seat_shift_playback(): void {
  const names: readonly motionHumanBody.Name[] = ["m-large", "f-small"];
  for (const name of names) {
    const stage: motionHumanLawSweep.Stage = MOTION_HUMAN_LAW_STAGES_POSTURE.shift!;
    const scene: motionHumanLawSweep.IScene = motionHumanLawSweep.staged(
      "default", stage, [name, name], () => {},
    );
    const prepared: HumanPerformance = fresh(scene);
    const reference: HumanPerformance = fresh(scene);
    const segment: IAutoMovieMotionHumanSegment = prepared.segments("a").at(-1)!;
    const fallback: IAutoMovieMotionHumanSegment = reference.segments("a").at(-1)!;
    const ordinary: IAutoMovieMotionHumanActionPlan["posture"] = fallback.plan.posture;
    fallback.plan.posture = (...input) => ordinary(...input);
    const duration: number = segment.plan.duration;
    const samples: readonly number[] = [
      duration, 0, 0.5 * duration, 0.05 * duration,
      ...segment.plan.events.map((event) => event.share * duration),
      0.9 * duration, 0.25 * duration,
    ];
    for (const seconds of samples) {
      const actual: HumanPreparedPlayback.ISample | undefined = HumanPreparedPlayback.read(
        segment.plan, scene.people[0]!.body, segment.plan.posture, true, true, undefined, seconds,
      );
      if (actual === undefined) throw new Error(`${name}: missing native shift at ${seconds} s`);
      check(actual.posture, ordinary(seconds), `${name} authored shift at ${seconds} s`);
      check(
        prepared.pose("a", segment.start + seconds),
        reference.pose("a", fallback.start + seconds),
        `${name} displayed shift at ${seconds} s`,
      );
    }
  }
}

/** Construct a real independent film without sharing its plan or cached poses. */
function fresh(scene: motionHumanLawSweep.IScene): HumanPerformance {
  return new HumanPerformance({
    seed: "sweep-1",
    composition: scene.composition,
    performers: scene.people.map((person) => ({
      ...person,
      proficiency: { level: "trained" },
    })),
    props: scene.props,
  }, integrateAirborneRotation.observe());
}

/** Compare complete pose or posture trees while allowing scalar roundoff. */
function check(actual: unknown, expected: unknown, where: string): void {
  if (typeof actual === "number" && typeof expected === "number") {
    if (!(Math.abs(actual - expected) < 1e-8))
      throw new Error(`${where}: ${actual} differs from ${expected}`);
    return;
  }
  if (actual === expected) return;
  if (typeof actual !== "object" || actual === null ||
      typeof expected !== "object" || expected === null)
    throw new Error(`${where}: different values`);
  const left: Record<string, unknown> = actual as Record<string, unknown>;
  const right: Record<string, unknown> = expected as Record<string, unknown>;
  const keys: string[] = Object.keys(left);
  if (keys.length !== Object.keys(right).length)
    throw new Error(`${where}: different record sizes`);
  for (const key of keys) {
    if (!Object.hasOwn(right, key)) throw new Error(`${where}: missing ${key}`);
    check(left[key], right[key], `${where}.${key}`);
  }
}
