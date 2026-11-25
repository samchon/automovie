import { Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import {
  AutoMovieMotionHumanArm,
  HumanArmTrajectoryContext,
  HumanArmTrajectoryRetime,
  HumanHand,
  HumanArmTrajectoryModel as Model,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../internal/motionHumanBody";

/**
 * An arm can keep its pace when its middle finger opens during an already clear
 * joint-space transport. The fixture takes the outer angles and digit envelope
 * of the failed halt seed 2's central steps (Human #3151, 2026-11-25 Motion
 * supervision) and samples them on four 30 Hz frames.
 *
 * Scenarios:
 *
 * 1. Advancing the opening makes the central interval exceed the given pace.
 * 2. Retime one interior pose while keeping the four frames and their budgets.
 * 3. A budget too small even with the entry digit shape keeps the refusal and all
 *    poses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the real-body four-frame witness and the controls.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the entire geometry and speed model before and after the same bounded retiming used on the laid course.
 * @evidence contracts/development/testing.md#independent-expectations Uses the physical probe lengths with and without the real digit's opening as the interval budget inputs and verifies the original model's bound, coordinates, and frames.
 * @evidence contracts/development/testing.md#distinguishing-cases The same animated path first has space to redistribute its pace, then uses a capacity that its rigid digit control already exceeds.
 * @evidence contracts/development/testing.md#execution-ownership Resolves four poses of the shared m-average test body and checks them in memory without an optimiser or outside assets.
 */
export function test_motion_contact_arm_digit_retime(): void {
  const body = motionHumanBody("m-average");
  const times: readonly number[] = [0, 1 / 30, 2 / 30, 3 / 30];
  const rest = AutoMovieMotionHumanStance.stand.posture(
    body,
    { x: 0, y: 0, z: 0 },
    0,
  );
  const relaxed = HumanHand.shape("right", "relaxed");
  const flat = HumanHand.shape("right", "flat");
  const bases = times.map((_, i: number) => {
    const share: number = minimumJerk.share((9 + i) / 21);
    const joints: IAutoMovieMotionHumanPosture["joints"] = { ...rest.joints };
    for (const bone of [
      "rightMiddleProximal",
      "rightMiddleIntermediate",
      "rightMiddleDistal",
    ] as const) {
      const from = relaxed[bone]!;
      const to = flat[bone]!;
      joints[bone] = [
        from[0] + (to[0] - from[0]) * share,
        from[1] + (to[1] - from[1]) * share,
        from[2] + (to[2] - from[2]) * share,
      ];
    }
    return { pose: resolveHumanPosture(body, { ...rest, joints }), others: [] };
  });
  const context = HumanArmTrajectoryContext.of({
    body,
    times,
    bases,
    arms: [
      {
        side: "right",
        rest: AutoMovieMotionHumanArm.angles(bases[0]!.pose, "right"),
        sites: times.map(() => undefined),
      },
    ],
  });

  // The chart coordinates of the two outer waypoints of the measured line.
  const start = [
    60.903774, -18.175352, 8.42742, 41.243788, 0, 34.79526, -20.630016,
    -8.073912, 0,
  ];
  const end = [
    56.924523, -29.790135, 13.812882, 59.93175, 0, 57.030836, -33.81343,
    -13.233468, 0,
  ];
  const shares: readonly number[] = [0, 1 / 3, 2 / 3, 1];
  const blend = (
    from: readonly number[],
    to: readonly number[],
    share: number,
  ): number[] =>
    from.map((q: number, d: number): number => q + share * (to[d]! - q));
  const original: number[][] = shares.map(
    (share: number, i: number): number[] =>
      i === 0
        ? start
        : i === shares.length - 1
          ? end
          : blend(start, end, share),
  );
  const transport = {
    from: 0,
    to: shares.length - 1,
    detours: [],
    laid: { effector: false, shares },
  };
  const read = Model.evaluate(context, [original]);
  const fixed: Model.IContext = {
    ...context,
    frames: [
      context.frames[0]!.map((frame) => ({
        ...frame,
        tip: context.frames[0]![0]!.tip,
      })),
    ],
  };
  const pinned = Model.evaluate(fixed, [original]);
  const travel = (sample: Model.IEvaluation, k: number): number =>
    Math.max(
      ...[2, 5, 7].map((probe: number): number =>
        Vector3.distance(
          sample.placed[0]![k]!.probes[probe]![0],
          sample.placed[0]![k + 1]!.probes[probe]![0],
        ),
      ),
    );
  const opening: number = travel(read, 1) - travel(pinned, 1);
  TestValidator.predicate("the live digit adds travel", opening > 0);

  const check = (central: number, admitted: boolean): void => {
    // Each neighbour can absorb the opening's measured extra travel.
    const budget: readonly number[] = [
      travel(read, 0) + opening,
      central,
      travel(read, 2) + opening,
    ];
    const speed = (t: number): number => {
      const k: number = t < times[1]! ? 0 : t < times[2]! ? 1 : 2;
      return budget[k]! / (times[k + 1]! - times[k]!);
    };
    const trial: Model.IContext = { ...context, speed };
    const coordinates: number[][][] = [[...original]];
    const before = Model.evaluate(trial, coordinates);
    TestValidator.equals(
      "the original transport refuses at one speed interval",
      [before.worst.term, before.failing],
      ["speed", [false, true, true, false]],
    );
    const frames = JSON.stringify(
      context.frames[0]!.map(({ parent, shoulder, tip }) => ({
        parent,
        shoulder,
        tip,
      })),
    );
    const after = HumanArmTrajectoryRetime(
      trial,
      coordinates,
      before,
      [transport],
      blend,
    );
    TestValidator.equals(
      "the original clock and digit frames are kept",
      JSON.stringify(
        trial.frames[0]!.map(({ parent, shoulder, tip }) => ({
          parent,
          shoulder,
          tip,
        })),
      ),
      frames,
    );
    TestValidator.predicate(
      "the original pace and both end poses are kept",
      trial.speed === speed &&
        trial.times === times &&
        coordinates[0]![0] === start &&
        coordinates[0]![3] === end,
    );
    const moved: number = coordinates[0]!.filter(
      (q, i: number): boolean => q !== original[i],
    ).length;
    TestValidator.equals(
      "at most one internal pose is moved",
      moved,
      admitted ? 1 : 0,
    );
    if (admitted) {
      const replay = Model.evaluate(trial, coordinates);
      TestValidator.equals(
        "complete model replay agrees",
        [after.worst, after.failing, after.violation],
        [replay.worst, replay.failing, replay.violation],
      );
      TestValidator.predicate(
        "every real probe step keeps its original pace",
        budget.every(
          (bound: number, k: number): boolean => travel(replay, k) <= bound,
        ),
      );
      TestValidator.predicate(
        "the complete model admits the rebalanced steps",
        !after.failing.some(Boolean),
      );
    } else
      TestValidator.predicate(
        "the unsupported case keeps its exact refusal",
        after === before,
      );
  };
  check(travel(read, 1) - opening / 2, true);
  check(travel(pinned, 1) - opening / 2, false);
}
