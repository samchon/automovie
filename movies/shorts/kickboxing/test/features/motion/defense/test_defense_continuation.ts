import {
  AutoMovieHumanRigControls,
  type AutoMovieHumanSkeleton,
} from "@automovie/human";
import assert from "node:assert/strict";

import type { MotionAction } from "../../../../src/motion/core/MotionAction";
import { DefenseContinuation } from "../../../../src/motion/defense/DefenseContinuation";
import type { DefenseMotion } from "../../../../src/motion/defense/DefenseMotion";

/**
 * An entry preserves its own value/rate while reaching the original next defense.
 *
 * Scenarios:
 * 1. Correct one arm, torso, root and actual task from an independent actual entry.
 * 2. Check h/h2 endpoint derivatives against explicit input tangents.
 * 3. Keep the other arm, original WORLD support, clock and nominal terminal unchanged.
 * 4. Seek in another order and mutate caller/result data without changing later samples.
 *
 * @evidence contracts/testing.md#observable-behavior Exercises the real public-Engine cubic continuation with independent scalar/point boundary data. It checks actual-entry values, finite derivative convergence to supplied rates, exact correction expiry, disjoint ownership, unchanged support and history independence. No renderer or foreign method is replaced.
 * @evidence contracts/testing.md#independent-cases Explicit20/30-degree endpoints and12-degree-per-second entry tangent define the oracle, while a quadratic nominal source has known zero initial slope. h/h2 derivatives only test this source polynomial; actual fitted motion and contact lifetimes require the real combination consumer.
 */
export function test_defense_continuation_entry_and_terminal(): void {
  const input: DefenseContinuation.Entry = entry();
  const initial: DefenseMotion.Sample = nominal(0);
  const source: string = JSON.stringify({ input, initial });
  const continuation: DefenseContinuation = new DefenseContinuation(
    initial,
    input,
  );
  const beginning: DefenseMotion.Sample = continuation.apply(
    nominal(0),
    0,
    unusedEvaluator,
  );
  near(beginning.pose.arms!.left.shoulder!.flexion!, 30, 1e-12);
  near(beginning.pose.spine!.thoracic!.rotation!, 7, 1e-12);
  near(beginning.pose.arms!.right.shoulder!.flexion!, 70, 1e-12);
  vector(beginning.rootOffset, input.sample.rootOffset, 1e-12);
  vector(
    beginning.effectors[0]!.target,
    input.sample.effectors[0]!.target,
    1e-12,
  );
  assert.deepEqual(beginning.support, initial.support);
  assert.equal(beginning.elapsed, initial.elapsed);
  const h: number = 0.00001;
  const full: DefenseMotion.Sample = continuation.apply(
    nominal(h),
    h,
    unusedEvaluator,
  );
  const half: DefenseMotion.Sample = continuation.apply(
    nominal(h / 2),
    h / 2,
    unusedEvaluator,
  );
  const coarse: number = (full.pose.arms!.left.shoulder!.flexion! - 30) / h;
  const fine: number = (half.pose.arms!.left.shoulder!.flexion! - 30) / (h / 2);
  near(fine, 12, 0.03);
  assert.ok(Math.abs(fine - 12) < Math.abs(coarse - 12));
  for (const axis of [0, 1, 2] as const) {
    near(
      (half.rootOffset[axis] - input.sample.rootOffset[axis]) / (h / 2),
      input.rootVelocity[axis],
      0.001,
    );
    near(
      (half.effectors[0]!.target[axis] -
        input.sample.effectors[0]!.target[axis]) /
        (h / 2),
      input.taskRates[0]!.velocity[axis],
      0.001,
    );
  }
  const end: number = input.windowSeconds;
  assert.deepEqual(
    continuation.apply(nominal(end), end, unusedEvaluator),
    nominal(end),
  );
  assert.deepEqual(
    continuation.apply(nominal(end + 0.1), end + 0.1, unusedEvaluator),
    nominal(end + 0.1),
  );
  const before: DefenseMotion.Sample = continuation.apply(
    nominal(end - h),
    end - h,
    unusedEvaluator,
  );
  const residualRate: number =
    (before.pose.arms!.left.shoulder!.flexion! -
      nominal(end - h).pose.arms!.left.shoulder!.flexion!) /
    h;
  near(residualRate, 0, 0.03);
  const middle: DefenseMotion.Sample = continuation.apply(
    nominal(0.07),
    0.07,
    unusedEvaluator,
  );
  continuation.apply(nominal(0.18), 0.18, unusedEvaluator);
  assert.deepEqual(
    continuation.apply(nominal(0.07), 0.07, unusedEvaluator),
    middle,
  );
  assert.equal(JSON.stringify({ input, initial }), source);
  input.sample.pose.arms!.left.shoulder!.flexion = 0;
  input.channelRates[0]!.degreesPerSecond = 999;
  middle.rootOffset[0] = 999;
  assert.ok(
    continuation.apply(nominal(0.07), 0.07, unusedEvaluator).rootOffset[0] < 1,
  );
  near(
    continuation.apply(nominal(0), 0, unusedEvaluator).pose.arms!.left.shoulder!
      .flexion!,
    30,
    1e-12,
  );
}

/**
 * Missing actual rates, changed task identities and out-of-ROM corrections refuse.
 *
 * Scenarios:
 * 1. Reject missing/duplicate/foreign-arm rates and missing actual task tangents.
 * 2. Reject malformed h/h2, changing standing root orientation and angular motion.
 * 3. Reject a source correction crossing native ROM instead of clipping it.
 *
 * @evidence contracts/testing.md#observable-behavior Calls real construction and sampling admission with independently malformed boundary inputs. It detects missing-rate-as-zero behavior, opposite-arm authority, task retargeting, hidden root rotation and clinical clipping.
 * @evidence contracts/testing.md#independent-cases The public channel catalogue defines canonical ownership; explicit180-degree shoulder entry with positive tangent necessarily exceeds its native upper endpoint immediately. These portable cases do not use a fake solver or claim full-body admission.
 */
export function test_defense_continuation_admission(): void {
  const initial: DefenseMotion.Sample = nominal(0);
  const missing: DefenseContinuation.Entry = entry();
  missing.channelRates.pop();
  assert.throws(
    (): DefenseContinuation => new DefenseContinuation(initial, missing),
  );
  const duplicate: DefenseContinuation.Entry = entry();
  duplicate.channelRates[1] = { ...duplicate.channelRates[0]! };
  assert.throws(
    (): DefenseContinuation => new DefenseContinuation(initial, duplicate),
  );
  const foreign: DefenseContinuation.Entry = entry();
  foreign.channelRates[0]!.channel = AutoMovieHumanRigControls.channel(
    "arms.right.shoulder.flexion",
  );
  assert.throws(
    (): DefenseContinuation => new DefenseContinuation(initial, foreign),
  );
  const task: DefenseContinuation.Entry = entry();
  task.taskRates = [];
  assert.throws(
    (): DefenseContinuation => new DefenseContinuation(initial, task),
  );
  const time: DefenseContinuation.Entry = entry();
  time.provenance.h2 = NaN;
  assert.throws(
    (): DefenseContinuation => new DefenseContinuation(initial, time),
  );
  const angular: DefenseContinuation.Entry = entry();
  angular.rootAngularVelocity = [0, 0.1, 0];
  assert.throws(
    (): DefenseContinuation => new DefenseContinuation(initial, angular),
  );
  const rotation: DefenseContinuation.Entry = entry();
  rotation.sample.rootRotation = [0, Math.sin(0.1), 0, Math.cos(0.1)];
  assert.throws(
    (): DefenseContinuation => new DefenseContinuation(initial, rotation),
  );
  const limit: DefenseContinuation.Entry = entry();
  limit.sample.pose.arms!.left.shoulder!.flexion = 180;
  limit.channelRates.find(
    (row: DefenseContinuation.Rate): boolean =>
      row.channel === "arms.left.shoulder.flexion",
  )!.degreesPerSecond = 100;
  const bounded: DefenseContinuation = new DefenseContinuation(initial, limit);
  assert.throws(
    (): DefenseMotion.Sample =>
      bounded.apply(nominal(0.005), 0.005, unusedEvaluator),
  );
  const valid: DefenseContinuation = new DefenseContinuation(initial, entry());
  assert.throws(
    (): DefenseMotion.Sample =>
      valid.apply({ ...nominal(0.01), effectors: [] }, 0.01, unusedEvaluator),
  );
  assert.throws(
    (): DefenseMotion.Sample => valid.apply(nominal(0), -1, unusedEvaluator),
  );
}

/** A declared zero-slope nominal program independent of the correction implementation. */
function nominal(seconds: number): DefenseMotion.Sample {
  return {
    pose: {
      arms: {
        left: { shoulder: { flexion: 20 + 50 * seconds ** 2 } },
        right: { shoulder: { flexion: 70 } },
      },
      spine: { thoracic: { rotation: 5 + 10 * seconds ** 2 } },
      legs: {
        left: { knee: { flexion: 30 } },
        right: { knee: { flexion: 30 } },
      },
    },
    rootOffset: [0.1 * seconds ** 2, 0, 0],
    support: { left: 0.5, right: 0.5 },
    effectors: [
      {
        bone: "leftHand",
        localPoint: [0.04, 0, 0],
        target: [0.2 + 0.5 * seconds ** 2, 1.4, 0.15],
        role: "guard",
        radius: 0.09,
      },
    ],
    phase: "delivery",
    elapsed: seconds,
    progress: seconds / 0.5,
  };
}

/** Complete measured-rate-shaped input; values are independent mathematical fixture data. */
function entry(): DefenseContinuation.Entry {
  const channels: AutoMovieHumanRigControls.DegreeChannel[] = [
    ...AutoMovieHumanRigControls.chain({ region: "arm", side: "left" }),
    AutoMovieHumanRigControls.channel("arms.left.wrist.flexion"),
    AutoMovieHumanRigControls.channel("arms.left.wrist.radialDeviation"),
    ...AutoMovieHumanRigControls.chain({ region: "pelvis" }),
    ...AutoMovieHumanRigControls.chain({ region: "spine" }),
    ...AutoMovieHumanRigControls.chain({ region: "neck" }),
  ];
  for (const digit of ["thumb", "index", "middle", "ring", "little"] as const)
    channels.push(
      ...AutoMovieHumanRigControls.chain({
        region: "finger",
        side: "left",
        digit,
      }),
    );
  for (const side of ["left", "right"] as const) {
    channels.push(...AutoMovieHumanRigControls.chain({ region: "leg", side }));
    for (const digit of [
      "hallux",
      "second",
      "third",
      "fourth",
      "fifth",
    ] as const)
      channels.push(
        ...AutoMovieHumanRigControls.chain({ region: "toe", side, digit }),
      );
  }
  const sample: DefenseMotion.Sample = nominal(0);
  sample.pose.arms!.left.shoulder!.flexion = 30;
  sample.pose.arms!.right.shoulder!.flexion = 90;
  sample.pose.spine!.thoracic!.rotation = 7;
  sample.rootOffset = [0.02, 0, 0.01];
  sample.effectors[0]!.target = [0.25, 1.45, 0.15];
  return {
    side: "left",
    sample,
    channelRates: [...new Set(channels)].map(
      (
        channel: AutoMovieHumanRigControls.DegreeChannel,
      ): DefenseContinuation.Rate => ({
        channel,
        degreesPerSecond:
          channel === "arms.left.shoulder.flexion"
            ? 12
            : channel === "spine.thoracic.rotation"
              ? 8
              : 0,
      }),
    ),
    rootVelocity: [0.03, 0, -0.02],
    rootAngularVelocity: [0, 0, 0],
    taskRates: [
      { bone: "leftHand", localPoint: [0.04, 0, 0], velocity: [0.1, 0, 0] },
    ],
    provenance: {
      h: 0.002,
      h2: 0.001,
      oneSided: "before",
      contactBranch: "explicit-fixture-branch",
    },
    windowSeconds: 0.2,
  };
}

/** This source polynomial has no clinical witnesses and must not invoke FK. */
const unusedEvaluator: AutoMovieHumanSkeleton.PoseEvaluator = (): never => {
  throw new Error("No FK belongs to this pure correction case");
};

/** Independent scalar tolerance for finite derivative approximations and exact boundary values. */
function near(actual: number, expected: number, tolerance: number): void {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${actual} != ${expected}`,
  );
}

/** Compare each independently declared metre component. */
function vector(
  actual: MotionAction.Vec3,
  expected: MotionAction.Vec3,
  tolerance: number,
): void {
  for (const axis of [0, 1, 2] as const)
    near(actual[axis], expected[axis], tolerance);
}
