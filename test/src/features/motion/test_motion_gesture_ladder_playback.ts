import { deepStrictEqual, equal, ok } from "node:assert/strict";

import { integrateAirborneRotation } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import { HumanPerformance } from "@automovie/motions";

import { HumanPreparedPlayback } from "../../../../packages/motions/src/perform/HumanPreparedPlayback";
import { MOTION_HUMAN_LAW_STAGES_LOCOMOTION } from "../internal/MOTION_HUMAN_LAW_STAGES_LOCOMOTION";
import { MOTION_HUMAN_LAW_STAGES_POSTURE } from "../internal/MOTION_HUMAN_LAW_STAGES_POSTURE";
import { motionHumanLawSweep } from "../internal/motionHumanLawSweep";

/**
 * Gesture and ladder native phases preserve the displayed pose and authored
 * targets through each action event, including ladder plant changes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names both scenarios, their targets and exact event comparisons.
 * @evidence contracts/development/testing.md#behavioral-verification The displayed native path agrees with a separate film forced through the ordinary reader. The native posture also preserves the exact authored limb records.
 * @evidence contracts/development/testing.md#independent-expectations The independently dispatched ordinary authoring path remains the reference for this equivalence requirement. Native-source rejection checks an unknown supplier without invoking it.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers the moving gesture arm, all ladder release and catch events, interior times, action endpoints and a repeated seek after reading unrelated seconds.
 * @evidence contracts/development/testing.md#execution-ownership Builds two independent real films per stage and changes only the reference film's exact callback identity.
 */
export function test_motion_gesture_ladder_playback(): void {
  const stages: readonly motionHumanLawSweep.Stage[] = [
    MOTION_HUMAN_LAW_STAGES_POSTURE.gesture!,
    MOTION_HUMAN_LAW_STAGES_LOCOMOTION.climbLadder!,
  ];
  for (const stage of stages) {
    const scene: motionHumanLawSweep.IScene = motionHumanLawSweep.staged(
      "default", stage, ["m-large", "m-large"], () => {},
    );
    const playback: HumanPerformance = fresh(scene);
    const reference: HumanPerformance = fresh(scene);
    const actual: IAutoMovieMotionHumanSegment = playback.segments("a").at(-1)!;
    const expected: IAutoMovieMotionHumanSegment = reference.segments("a").at(-1)!;
    const ordinary: IAutoMovieMotionHumanActionPlan["posture"] = expected.plan.posture;
    expected.plan.posture = (...args) => ordinary(...args);
    const duration: number = actual.plan.duration;
    const events: number[] = actual.plan.events.map((event) => event.share * duration);
    const bounds: number[] = [...new Set([0, ...events, duration])].sort((a, b) => a - b);
    const times: readonly number[] = [duration, ...bounds.flatMap((t, index) => index === 0
      ? [t] : [t, (bounds[index - 1]! + t) / 2]), duration / 3, 0];

    for (const t of times) {
      const label: string = `${actual.name} at ${t} s`;
      const sample: IAutoMovieMotionHumanPlayback.ISample | undefined = HumanPreparedPlayback.read(
        actual.plan, scene.people[0]!.body, actual.plan.posture, true, true, undefined, t,
      );
      ok(sample, `Missing native playback for ${label}`);
      deepStrictEqual(sample.posture, ordinary(t), label);
      deepStrictEqual(playback.pose("a", actual.start + t), reference.pose("a", expected.start + t), label);
    }

    equal(HumanPreparedPlayback.read(actual.plan, scene.people[0]!.body, actual.plan.posture,
      true, true, undefined, duration / 3, undefined, () => {
        throw new Error("A foreign resolution supplier ran during admission");
      }), undefined);
  }
}

/** Create a film with independent placement and display state. */
function fresh(scene: motionHumanLawSweep.IScene): HumanPerformance {
  return new HumanPerformance({
    seed: "sweep-1",
    composition: scene.composition,
    performers: scene.people.map((person) => ({ ...person, proficiency: { level: "trained" } })),
    props: scene.props,
  }, integrateAirborneRotation.observe());
}
