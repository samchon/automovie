import { integrateAirborneRotation } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import { HumanPerformance } from "@automovie/motions";
import { deepStrictEqual, ok } from "node:assert/strict";

import { MOTION_HUMAN_LAW_STAGES_LOCOMOTION } from "../../../features/internal/MOTION_HUMAN_LAW_STAGES_LOCOMOTION";
import { MOTION_HUMAN_LAW_STAGES_POSTURE } from "../../../features/internal/MOTION_HUMAN_LAW_STAGES_POSTURE";
import { motionHumanLawSweep } from "../../../features/internal/motionHumanLawSweep";

/**
 * Gesture and ladder native phases preserve the displayed pose and authored
 * targets through each action event, including ladder plant changes.
 *
 * Scenarios:
 * 1. Seek across authored events, endpoints and intermediate gesture and ladder postures.
 * 2. Compare a separate film whose publicly returned plan uses a replacement callback.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names both scenarios, their targets and exact event comparisons.
 * @evidence contracts/development/testing.md#behavioral-verification The displayed native path agrees with a separate film forced through the ordinary reader. The native posture also preserves the exact authored limb records.
 * @evidence contracts/development/testing.md#independent-expectations The separate film uses the ordinary authoring callback as its display reference. Counting calls proves that display reaches the changed callback.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers the moving gesture arm, all ladder release and catch events, interior times, action endpoints and a repeated seek after reading unrelated seconds.
 * @evidence contracts/development/testing.md#execution-ownership Builds two independent real films per stage and changes only the reference film's exact callback identity.
 */
export function test_motion_climb_gesture_ladder_playback(): void {
  const stages: readonly motionHumanLawSweep.Stage[] = [
    MOTION_HUMAN_LAW_STAGES_POSTURE.gesture!,
    MOTION_HUMAN_LAW_STAGES_LOCOMOTION.climbLadder!,
  ];
  for (const stage of stages) {
    const scene: motionHumanLawSweep.IScene = motionHumanLawSweep.staged(
      "default",
      stage,
      ["m-large", "m-large"],
      () => {},
    );
    const playback: HumanPerformance = fresh(scene);
    const reference: HumanPerformance = fresh(scene);
    const actual: IAutoMovieMotionHumanSegment = playback.segments("a").at(-1)!;
    const expected: IAutoMovieMotionHumanSegment = reference
      .segments("a")
      .at(-1)!;
    const ordinary: IAutoMovieMotionHumanActionPlan["posture"] =
      expected.plan.posture;
    let fallbackReads: number = 0;
    expected.plan.posture = function (
      this: IAutoMovieMotionHumanActionPlan,
      ...args: Parameters<typeof ordinary>
    ): IAutoMovieMotionHumanPosture {
      ++fallbackReads;
      return Reflect.apply(ordinary, this, args);
    };
    const duration: number = actual.plan.duration;
    const events: number[] = actual.plan.events.map(
      (event) => event.share * duration,
    );
    const bounds: number[] = [...new Set([0, ...events, duration])].sort(
      (a, b) => a - b,
    );
    const times: readonly number[] = [
      duration,
      ...bounds.flatMap((t, index) =>
        index === 0 ? [t] : [t, (bounds[index - 1]! + t) / 2],
      ),
      duration / 3,
      0,
    ];

    for (const t of times) {
      const label: string = `${actual.name} at ${t} s`;
      deepStrictEqual(
        actual.plan.posture(t),
        Reflect.apply(ordinary, expected.plan, [t]),
        label,
      );
      deepStrictEqual(
        playback.pose("a", actual.start + t),
        reference.pose("a", expected.start + t),
        label,
      );
    }

    ok(
      fallbackReads > 0,
      `The ${actual.name} display calls the replacement callback`,
    );
  }
}

/** Create a film with independent placement and display state. */
function fresh(scene: motionHumanLawSweep.IScene): HumanPerformance {
  return new HumanPerformance(
    {
      seed: "sweep-1",
      composition: scene.composition,
      performers: scene.people.map((person) => ({
        ...person,
        proficiency: { level: "trained" },
      })),
      props: scene.props,
    },
    integrateAirborneRotation.observe(),
  );
}
