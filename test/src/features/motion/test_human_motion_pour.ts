import { createDrinkware, createPourVessel } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPour,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  pour,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The staged pour visibly tips a held glass about its lip over a fixed cup.
 * Scenarios:
 * 1. The displayed lip stays within 25 mm of the authored pivot through tip,
 *    flow and righting. At mid-flow the displayed vessel tips 40 ± 10 degrees.
 * 2. The displayed source returns upright, within 25 mm of its entry lip.
 *    The recipient's mouth remains within 1 mm of its placement.
 * 3. Discharging 90 mL conserves the combined 430 mL, with no spill at the
 *    midpoint and 40 mL of overflow at the end. Seeking backward repeats it.
 * 4. Requesting more than the source holds refuses on `transferMl`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the performance and its geometry, volume and refusal bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the displayed prop transforms and liquid cue through the public performance API. A stationary source or a balance without overflow fails.
 * @evidence contracts/development/testing.md#independent-expectations Reads local points from the archetypes, uses the authored 40-degree target and derives the balance from the initial volumes and recipient capacity.
 * @evidence contracts/development/testing.md#distinguishing-cases Samples the upright and tilted poses, both sides of the capacity threshold, backward seeking and insufficient source volume.
 * @evidence contracts/development/testing.md#execution-ownership Builds short polygon-body performances in memory without a renderer or external state.
 */
export function test_human_motion_pour(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const source: ReturnType<typeof createDrinkware> = createDrinkware(
    { kind: "glass", fill: 150 / 473 },
    7,
  );
  const target: ReturnType<typeof createPourVessel> = createPourVessel(
    { kind: "cup" },
    7,
  );
  const sourceLip: IAutoMovieVector3 =
    source.affordance("lip").frame.translation;
  const targetMouth: IAutoMovieVector3 =
    target.affordance("mouth").frame.translation;
  const sourceAt: IAutoMovieVector3 = {
    x: -body.measure.shoulderHalfWidth,
    y: body.measure.waistHeight,
    z: 0.55 * (body.measure.upperArm + body.measure.forearm),
  };
  const targetAt: IAutoMovieVector3 = {
    x: sourceAt.x,
    y: sourceAt.y + sourceLip.y - targetMouth.y,
    z: sourceAt.z + 0.13,
  };
  const params: IAutoMovieMotionHumanPour.IParams = {
    source: "glass",
    target: "cup",
    tilt: 40,
    gap: 0.08,
    timing: { approach: 0.9, tip: 0.7, flow: 0.6, right: 0.7, retreat: 0.9 },
    sourceMl: 150,
    targetMl: 280,
    capacityMl: 330,
    transferMl: 90,
  };
  const performance = (
    authored: IAutoMovieMotionHumanPour.IParams,
  ): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "pour",
      laws: [pour],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        HumanObject.prop("glass", source, { at: sourceAt, yaw: 0 }),
        HumanObject.prop("cup", target, {
          at: targetAt,
          yaw: 0,
          fixed: true,
        }),
      ],
      composition: HumanChain.subject("a")
        .pickUp({ prop: "glass", handle: "body", hand: "right" })
        .registered(pour.name, authored).node,
    });

  const film: IAutoMovieMotionHumanPerformance = performance(params);
  const segment: IAutoMovieMotionHumanSegment = film.segments("a")[1]!;
  const time = (name: string): number =>
    segment.plan.duration *
    (segment.plan.events.find(
      (event: IAutoMovieMotionEvent): boolean => event.name === name,
    )?.share ?? NaN);
  const flowStart: number = time("flowStart");
  const flowEnd: number = time("flowEnd");
  const tipStart: number = time("tipStart");
  const retreatStart: number = time("retreatStart");
  const middle: number = (flowStart + flowEnd) / 2;
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const mouth: IAutoMovieVector3 = Vector3.add(targetAt, targetMouth);
  const pivot: IAutoMovieVector3 = Vector3.add(mouth, Vector3.scale(up, 0.08));
  for (const seconds of [
    tipStart,
    (tipStart + flowStart) / 2,
    middle,
    (flowEnd + retreatStart) / 2,
    retreatStart,
  ]) {
    const lip: IAutoMovieVector3 = point(
      film.prop("glass", segment.start + seconds),
      sourceLip,
    );
    TestValidator.predicate(
      `source lip stays within 25 mm of its pivot at ${seconds}s`,
      () => Vector3.length(Vector3.subtract(lip, pivot)) <= 0.025,
    );
    const recipient: IAutoMovieVector3 = point(
      film.prop("cup", segment.start + seconds),
      targetMouth,
    );
    TestValidator.predicate(
      `recipient stays fixed at ${seconds}s`,
      () => Vector3.length(Vector3.subtract(recipient, mouth)) <= 0.001,
    );
  }
  const tilted: IAutoMovieVector3 = Quaternion.rotateVector(
    film.prop("glass", segment.start + middle).rotation,
    up,
  );
  const degrees: number =
    (Math.acos(Math.min(1, Math.max(-1, tilted.y))) * 180) / Math.PI;
  TestValidator.predicate(
    "the source tips forty degrees during flow",
    () => Math.abs(degrees - 40) <= 10,
  );
  const start: IAutoMovieRigidTransform = film.prop("glass", segment.start);
  const end: IAutoMovieRigidTransform = film.prop("glass", segment.end);
  TestValidator.predicate(
    "the source returns upright",
    () =>
      Quaternion.rotateVector(end.rotation, up).y >=
      Math.cos((5 * Math.PI) / 180),
  );
  TestValidator.predicate(
    "the source returns its lip to the entry position",
    () =>
      Vector3.length(
        Vector3.subtract(point(start, sourceLip), point(end, sourceLip)),
      ) <= 0.025,
  );

  const samples: readonly (readonly [number, number, number, number])[] = [
    [0, 150, 280, 0],
    [middle, 105, 325, 0],
    [segment.plan.duration, 60, 330, 40],
    [middle, 105, 325, 0],
  ];
  for (const [seconds, remaining, caught, spilled] of samples) {
    const actual: IAutoMovieMotionHumanPour.ILiquid = pour.liquid(
      params,
      segment.plan,
      seconds,
    );
    TestValidator.predicate(
      `balance conserves 430 mL at ${seconds}s`,
      () =>
        Math.abs(actual.sourceMl + actual.targetMl + actual.spillMl - 430) <=
        1e-8,
    );
    TestValidator.predicate(
      `liquid is apportioned at ${seconds}s`,
      () =>
        Math.abs(actual.sourceMl - remaining) <= 1e-8 &&
        Math.abs(actual.targetMl - caught) <= 1e-8 &&
        Math.abs(actual.spillMl - spilled) <= 1e-8,
    );
  }

  let refusal: unknown;
  try {
    performance({ ...params, transferMl: 151 });
  } catch (error: unknown) {
    refusal = error;
  }
  TestValidator.predicate(
    "the source cannot discharge more than it holds",
    () =>
      refusal instanceof HumanRefusal &&
      refusal.kind === "parameter" &&
      refusal.axis === "transferMl",
  );
}

/** Locate a prop-local point using its displayed rigid transform. */
function point(
  frame: IAutoMovieRigidTransform,
  local: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, local),
  );
}
