import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";
import {
  AutoMovieMotionClock,
  AutoMovieMotionHumanHead,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { linearMotionClock } from "../../../internal/synthetic/linearMotionClock";

/**
 * Observe two nods about the sagittal axis from an asymmetric held posture.
 *
 * Scenarios:
 *
 * 1. Sample signed excursion and the neutral endpoints on the authored clock.
 * 2. Check the other two axes and the supporting root at each sample.
 */
function scenario_test_unit_motions_compose_head_nod(): void {
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock(1, [
    { name: "apex", seconds: 0.25 },
    { name: "release", seconds: 0.75 },
  ]);
  const entry: IAutoMovieMotionHumanPosture = {
    root: { x: 2, y: 0, z: -1 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: { head: [3, 5, -2], neck: [1, -4, 2] },
    limbs: {},
  };
  const primitive: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanHead.nod(clock, ["start", "end"], 2, 20);
  for (const [seconds, excursion] of [
    [0, 0],
    [0.375, -20],
    [0.625, 20],
    [1, 0],
  ] as const) {
    const pose: IAutoMovieMotionHumanPosture = primitive.write(entry, seconds);
    TestValidator.equals("supporting root", pose.root, entry.root);
    for (const axis of [0, 1, 2] as const) {
      for (const joint of ["neck", "head"] as const) {
        const expected: number =
          entry.joints[joint]![axis] + (axis === 0 ? excursion / 2 : 0);
        TestValidator.predicate(
          joint + " angle at " + seconds,
          nclose(pose.joints[joint]![axis], expected),
        );
      }
    }
  }
}

/**
 * Observe one complete oscillation with half-height quarter-cycle ramps from an
 * asymmetric held posture.
 *
 * Scenarios:
 *
 * 1. Sample signed excursion and the neutral endpoints on the authored clock.
 * 2. Check the other two axes and the supporting root at each sample.
 */
function scenario_test_unit_motions_compose_head_oscillate(): void {
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock(1, [
    { name: "apex", seconds: 0.25 },
    { name: "release", seconds: 0.75 },
  ]);
  const entry: IAutoMovieMotionHumanPosture = {
    root: { x: 2, y: 0, z: -1 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: { head: [3, 5, -2], neck: [1, -4, 2] },
    limbs: {},
  };
  const primitive: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanHead.nod(clock, ["start", "end"], 1, 20);
  for (const [seconds, excursion] of [
    [0, 0],
    [0.25, 10],
    [0.5, 0],
    [0.75, -10],
    [1, 0],
  ] as const) {
    const pose: IAutoMovieMotionHumanPosture = primitive.write(entry, seconds);
    TestValidator.equals("supporting root", pose.root, entry.root);
    for (const axis of [0, 1, 2] as const) {
      for (const joint of ["neck", "head"] as const) {
        const expected: number =
          entry.joints[joint]![axis] + (axis === 0 ? excursion / 2 : 0);
        TestValidator.predicate(
          joint + " angle at " + seconds,
          nclose(pose.joints[joint]![axis], expected),
        );
      }
    }
  }
}

/**
 * Observe two shakes about the twist axis from an asymmetric held posture.
 *
 * Scenarios:
 *
 * 1. Sample signed excursion and the neutral endpoints on the authored clock.
 * 2. Check the other two axes and the supporting root at each sample.
 */
function scenario_test_unit_motions_compose_head_shake(): void {
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock(1, [
    { name: "apex", seconds: 0.25 },
    { name: "release", seconds: 0.75 },
  ]);
  const entry: IAutoMovieMotionHumanPosture = {
    root: { x: 2, y: 0, z: -1 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: { head: [3, 5, -2], neck: [1, -4, 2] },
    limbs: {},
  };
  const primitive: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanHead.shake(clock, ["start", "end"], 2, 20);
  for (const [seconds, excursion] of [
    [0, 0],
    [0.375, -20],
    [0.625, 20],
    [1, 0],
  ] as const) {
    const pose: IAutoMovieMotionHumanPosture = primitive.write(entry, seconds);
    TestValidator.equals("supporting root", pose.root, entry.root);
    for (const axis of [0, 1, 2] as const) {
      for (const joint of ["neck", "head"] as const) {
        const expected: number =
          entry.joints[joint]![axis] + (axis === 2 ? excursion / 2 : 0);
        TestValidator.predicate(
          joint + " angle at " + seconds,
          nclose(pose.joints[joint]![axis], expected),
        );
      }
    }
  }
}

/** The carrier's posture: a walking stride's head already turned 5 degrees. */
const CARRIER: IAutoMovieMotionHumanPosture = {
  root: { x: 0.1, y: 0.9, z: 0.4 },
  yaw: 10,
  pitch: 0,
  roll: 0,
  joints: { neck: [0, 0, 5], hips: [2, 0, 0] },
  limbs: {},
};

/**
 * `AutoMovieMotionHumanHead.tilt` rolls the head to one side over the cervical
 * joints and back, on whatever posture the carrier gives it.
 *
 * A 3 s clock rises from `start` to `full` at 1 s and falls from `relax` at 2 s
 * to `end`; the head rolls -20 degrees.
 *
 * Scenarios:
 *
 * 1. Over the hold, the neck's and the head's added roll sum to the authored
 *    angle, with no added flexion or twist.
 * 2. At the start and the end the carrier's head returns unchanged.
 * 3. The carrier's root, heading and other joints are never touched.
 */
function scenario_test_unit_motions_compose_head_tilt(): void {
  const clock: IAutoMovieMotionClock = linearMotionClock(3, [
    { name: "full", seconds: 1 },
    { name: "relax", seconds: 2 },
  ]);
  const tilt: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanHead.tilt(
    clock,
    ["start", "full"],
    ["relax", "end"],
    -20,
  );
  const cervical = (
    posture: IAutoMovieMotionHumanPosture,
    axis: 0 | 1 | 2,
  ): number =>
    (posture.joints.neck?.[axis] ?? 0) + (posture.joints.head?.[axis] ?? 0);

  // 1. The hold.
  const held: IAutoMovieMotionHumanPosture = tilt.write(CARRIER, 1.5);
  TestValidator.predicate(
    "the roll reaches its angle over the hold",
    nclose(cervical(held, 1), -20, 1e-9) &&
      nclose(cervical(held, 0), 0, 1e-9) &&
      nclose(cervical(held, 2), 5, 1e-9),
  );

  // 2. The ends.
  TestValidator.predicate(
    "the carrier's head returns at both ends",
    [0, 3].every((seconds: number): boolean => {
      const shown: IAutoMovieMotionHumanPosture = tilt.write(CARRIER, seconds);
      return (
        nclose(cervical(shown, 0), 0, 1e-9) &&
        nclose(cervical(shown, 1), 0, 1e-9) &&
        nclose(cervical(shown, 2), 5, 1e-9)
      );
    }),
  );

  // 3. The rest of the carrier.
  TestValidator.equals(
    "the carrier's root, heading and hips",
    [held.root, held.yaw, held.joints.hips],
    [CARRIER.root, CARRIER.yaw, CARRIER.joints.hips],
  );
}

/**
 * Observe a held lateral tilt with neutral endpoints from an asymmetric held
 * posture.
 *
 * Scenarios:
 *
 * 1. Sample signed excursion and the neutral endpoints on the authored clock.
 * 2. Check the other two axes and the supporting root at each sample.
 */
function scenario_test_unit_motions_compose_head_tilt_pulse(): void {
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock(1, [
    { name: "apex", seconds: 0.25 },
    { name: "release", seconds: 0.75 },
  ]);
  const entry: IAutoMovieMotionHumanPosture = {
    root: { x: 2, y: 0, z: -1 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: { head: [3, 5, -2], neck: [1, -4, 2] },
    limbs: {},
  };
  const primitive: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanHead.tilt(
      clock,
      ["start", "apex"],
      ["release", "end"],
      -20,
    );
  for (const [seconds, excursion] of [
    [0, 0],
    [0.25, -20],
    [0.5, -20],
    [0.75, -20],
    [1, 0],
  ] as const) {
    const pose: IAutoMovieMotionHumanPosture = primitive.write(entry, seconds);
    TestValidator.equals("supporting root", pose.root, entry.root);
    for (const axis of [0, 1, 2] as const) {
      for (const joint of ["neck", "head"] as const) {
        const expected: number =
          entry.joints[joint]![axis] + (axis === 1 ? excursion / 2 : 0);
        TestValidator.predicate(
          joint + " angle at " + seconds,
          nclose(pose.joints[joint]![axis], expected),
        );
      }
    }
  }
}

/**
 * AutoMovieMotionHumanHead, the head channels a law composes: each one's own
 * scenario below (nod, oscillate, shake, tilt and tilt pulse).
 */
export function test_unit_motions_compose_head(): void {
  scenario_test_unit_motions_compose_head_nod();
  scenario_test_unit_motions_compose_head_oscillate();
  scenario_test_unit_motions_compose_head_shake();
  scenario_test_unit_motions_compose_head_tilt();
  scenario_test_unit_motions_compose_head_tilt_pulse();
}
