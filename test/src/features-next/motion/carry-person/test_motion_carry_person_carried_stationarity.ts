import { createSeat } from "@automovie/archetypes";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSupport,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { AutoMovieMotionHumanBase } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

/**
 * A locally held posture travels with a translating bench. The whole-body
 * wrapper moves the shown hips, while the goals-only wrapper carries an
 * arm target and leaves the root to its caller. Grounded goals keep their
 * original first- and lower-body stationarity bounds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two carrier paths and the ground control.
 * @evidence contracts/development/testing.md#behavioral-verification Uses public film bones at out-of-order times for the whole-body path and reads the actual goal and metadata of the carried plan for the goals-only branch.
 * @evidence contracts/development/testing.md#independent-expectations Bench travel is authored at 0.2 m per film second, so both the chosen hand goal and displayed hips gain exactly that displacement relative to their initial states.
 * @evidence contracts/development/testing.md#distinguishing-cases The locally identical base can certify a stationary ground branch, but cannot certify the bench or the whole rider in world coordinates. Late-first, earlier and repeated pose reads expose representative-second substitution.
 * @evidence contracts/development/testing.md#execution-ownership A discovered motions test using a canonical Human body, a bench and a registered law, without a host or rendering dependency.
 */
export function test_motion_carry_person_carried_stationarity(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const frame = (seconds: number): IAutoMovieRigidTransform => ({
    position: { x: 4 + 0.2 * seconds, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  });
  let carried: IAutoMovieMotionHumanActionPlan | undefined;
  let ground: IAutoMovieMotionHumanActionPlan | undefined;
  const law: IAutoMovieMotionHumanActionLaw = {
    name: "carriedQuietProbe",
    interrupts: {},
    plan: (
      context: IAutoMovieMotionHumanActionContext,
    ): IAutoMovieMotionHumanActionPlan => {
      const local: IAutoMovieMotionHumanActionPlan = {
        ...AutoMovieMotionHumanBase.still(1, {
          ...context.entry.posture,
          limbs: {
            ...context.entry.posture.limbs,
            leftArm: {
              point: { x: 0.25, y: 1.1, z: 0.2 },
              bend: { x: 0.4, y: 0.8, z: 0 },
            },
          },
        }),
        legsStill: [0, 1],
      };
      ground = AutoMovieMotionHumanSupport.carry.plan(context, local, [
        "leftArm",
      ]);
      carried = AutoMovieMotionHumanSupport.carry.plan(
        {
          ...context,
          entry: {
            ...context.entry,
            supports: [
              {
                part: "seat",
                kind: "seat",
                support: { kind: "prop", subject: "bench" },
              },
            ],
          },
        },
        local,
        ["leftArm"],
      );
      return AutoMovieMotionHumanSupport.carry.on(context, local, "bench");
    },
  };
  const performance: HumanPerformance = new HumanPerformance({
    seed: "moving quiet support",
    performers: [
      {
        subject: "actor",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      HumanObject.prop(
        "bench",
        createSeat({ kind: "bench", places: 1 }),
        frame(0),
        frame,
      ),
    ],
    laws: [law],
    composition: HumanChain.subject("actor").registered(law.name).node,
  });
  const start: number = performance.segments("actor")[0]!.start;
  const late: number = performance.bones("actor", start + 0.75).get("hips")!
    .worldPosition.x;
  const initial: number = performance.bones("actor", start).get("hips")!
    .worldPosition.x;
  const early: number = performance.bones("actor", start + 0.25).get("hips")!
    .worldPosition.x;
  const extra: number = performance.bones("actor", start + 0.75).get("hips")!
    .worldPosition.x;
  TestValidator.predicate(
    "the displayed hips follow the bench on each seek",
    nclose(late - initial, 0.15, 1e-9) &&
      nclose(early - initial, 0.05, 1e-9) &&
      nclose(extra, late, 1e-9),
  );
  TestValidator.predicate(
    "carried goals are world motion even with a locally held root",
    nclose(carried!.posture(0.75).limbs.leftArm!.point.x, 0.4, 1e-9) &&
      carried!.still === undefined &&
      carried!.legsStill === undefined,
  );
  TestValidator.equals<readonly [number, number] | undefined>(
    "the ground retains its known still interval",
    [0, 1],
    ground!.still,
  );
  TestValidator.equals<readonly [number, number] | undefined>(
    "the ground retains its known lower body",
    [0, 1],
    ground!.legsStill,
  );
}
