import { clampPose } from "@automovie/engine";
import type {
  AutoMovieMotionHumanChannel,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { nclose } from "../../../../features/internal/nclose";

/**
 * An overlay's real carrier reader forwards each synchronous projection loan,
 * even when a previous call has already read that same local second.
 *
 * Scenarios:
 * 1. A registered carrier authors head flexion15. During actual overlay
 *    planning, same-time reads with genuine5/10-degree projectors give5/10;
 *    omitting the projector still gives the original15. A/B/default/A must
 *    not reuse an earlier answer solely because the time is unchanged.
 * 2. Reversed times and whole/head-only reads keep the current projection.
 *    The carrier's root.x follows its local second, distinguishing correct
 *    time forwarding from an accidentally constant posture fixture.
 * 3. A genuine HumanPerformance places the carrier and overlay through over,
 *    preserving the declared yielded head channel. Shared canonical geometry
 *    is never edited; only owned skeleton clones prepare the two ROM sources.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines overlay-local seconds, literal clinical head values, whole/partial reads, genuine projector scope and immutable canonical fixture ownership in three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Builds registered carrier/overlay laws in the public performance and reads context.carrier.posture while the overlay actually plans. Same-time changing/omitted projector loans and reverse-order times expose persistent time-only cache leakage; literal head values and root progression detect skipped current source calls without a callback-count/performance assertion.
 * @evidence contracts/development/testing.md#independent-expectations The carrier explicitly authors head15. Its own current projector acts on that actual one-joint pose, so direct clinical ROM[0,5] and[0,10] require5 and10; no loan requires15. Root.x is entry.x plus the supplied local second. Numeric expectations allow1e-12 for scalar plumbing; no cold performance or changed implementation supplies them.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers same-time five/ten/omitted/five loans, head demand versus complete demand, later/earlier/repeated times, actual overlay registration/yields and complete construction. Composer reentrancy/FK loans and physical stopped-carrier semantics have separate entries.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable unit uses a canonical Human fixture and public registered laws/over composition. Test-owned skeleton clones supply genuine clamp factories, not fake capability flags; it patches no foreign method/global and runs no host, compiler or renderer.
 */
export function test_motion_dynamics_carrier_projection(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const five: ReturnType<typeof clampPose.prepare> = limited(body, 5);
  const ten: ReturnType<typeof clampPose.prepare> = limited(body, 10);
  let observed: boolean = false;
  const carrier: IAutoMovieMotionHumanActionLaw = {
    name: "projectionLoanCarrier",
    interrupts: {},
    yields: ["head"],
    plan: (
      context: IAutoMovieMotionHumanActionContext,
    ): IAutoMovieMotionHumanActionPlan => ({
      duration: 1,
      contacts: [],
      events: [],
      posture: (
        seconds: number,
        _channels?: readonly AutoMovieMotionHumanChannel[],
        _resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const source: IAutoMoviePose = {
          skeleton: context.body.skeleton.id,
          root: null,
          joints: [{ bone: "head", flexion: 15, abduction: 0, twist: 0 }],
        };
        const projected: IAutoMoviePose =
          projection === undefined ? source : projection(source);
        return {
          ...context.entry.posture,
          root: {
            ...context.entry.posture.root,
            x: context.entry.posture.root.x + seconds,
          },
          joints: {
            ...context.entry.posture.joints,
            head: [projected.joints[0]!.flexion!, 0, 0],
          },
          limbs: {},
        };
      },
    }),
  };
  const overlay: IAutoMovieMotionHumanActionLaw = {
    name: "observeCarrierProjection",
    interrupts: {},
    overlay: true,
    plan: (
      context: IAutoMovieMotionHumanActionContext,
    ): IAutoMovieMotionHumanActionPlan => {
      TestValidator.predicate(
        "the actual overlay receives its registered carrier",
        context.carrier?.name === carrier.name,
      );
      const read: IAutoMovieMotionHumanActionContext.ICarrier =
        context.carrier!;
      for (const [seconds, projection, expected, channels] of [
        [0.75, five, 5, ["head"]],
        [0.75, ten, 10, undefined],
        [0.75, undefined, 15, ["head"]],
        [0.25, five, 5, undefined],
        [0.75, five, 5, undefined],
      ] as const) {
        const actual: IAutoMovieMotionHumanPosture = read.posture(
          seconds,
          channels,
          undefined,
          projection,
        );
        TestValidator.predicate(
          `same-time carrier read uses this actual loan at${seconds}: expected${expected}, got${actual.joints.head?.[0]}`,
          nclose(actual.joints.head![0], expected, 1e-12),
        );
        if (channels === undefined)
          TestValidator.predicate(
            "complete carrier read forwards the current action-local second",
            nclose(
              actual.root.x,
              context.entry.posture.root.x + seconds,
              1e-12,
            ),
          );
        observed = true;
      }
      return {
        duration: 1,
        contacts: [],
        events: [],
        channels: ["head"],
        posture: (): IAutoMovieMotionHumanPosture => ({
          ...context.entry.posture,
          joints: { ...context.entry.posture.joints, head: [0, 0, 0] },
          limbs: {},
        }),
      };
    },
  };
  const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "carrier-projector-loans",
    performers: [
      {
        subject: "A",
        body: { ...body },
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    laws: [carrier, overlay],
    composition: HumanChain.subject("A")
      .registered("projectionLoanCarrier")
      .over(
        (upper: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
          upper.registered("observeCarrierProjection"),
      ).node,
  });
  const head: IAutoMovieJointPose | undefined = performance
    .pose("A", 0.5)
    .joints.find(
      (joint: IAutoMovieJointPose): boolean => joint.bone === "head",
    );
  TestValidator.predicate(
    "actual planning observes carrier loans and displays the overlay",
    observed && head !== undefined && nclose(head.flexion ?? NaN, 0, 1e-12),
  );
}

/** Prepare genuine direct clinical projection on an owned clone of the canonical rig. */
function limited(
  body: IAutoMovieMotionHumanBody,
  maximum: number,
): ReturnType<typeof clampPose.prepare> {
  const skeleton: IAutoMovieSkeleton = structuredClone(body.skeleton);
  const head: IAutoMovieBone = skeleton.bones.find(
    (bone: IAutoMovieBone): boolean => bone.bone === "head",
  )!;
  head.constraint = {
    flexion: { min: 0, max: maximum },
    abduction: null,
    twist: null,
  };
  return clampPose.prepare(skeleton);
}
