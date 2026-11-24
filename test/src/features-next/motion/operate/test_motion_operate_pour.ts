import { createDrinkware, createPourVessel } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPour,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanOperate,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * The staged pour visibly tips a held glass about its lip over a fixed cup.
 * Scenarios:
 * 1. At the pivot boundaries, halfway through each turn and at mid-flow,
 *    the displayed lip stays within 25 mm of the authored pivot. The vessel
 *    reaches half its 40-degree tilt at both turn midpoints and the full
 *    tilt at mid-flow, each within 10 degrees.
 * 2. The displayed source returns upright, within 25 mm of its entry lip.
 *    The recipient's mouth remains within 1 mm of its placement.
 * 3. The authored clock bounds discharge. The 90 mL transfer fills the
 *    recipient's remaining 50 mL and spills 40 mL. Seeking backward repeats
 *    the pre-overflow balance.
 * 4. Requesting more than the source holds refuses on `transferMl`.
 * 5. A direct plan refuses either vessel if it declares internal articulation
 *    or has a pose reader of unknown rigidity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the performance and its geometry, volume and refusal bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads prop transforms through HumanPerformance and the liquid cue through pour.liquid. A stationary source or a balance without overflow fails.
 * @evidence contracts/development/testing.md#independent-expectations Reads local points from the archetypes, checks the authored 40-degree target and the half angle from the symmetric turn progress, and derives the balance from the initial volumes and recipient capacity.
 * @evidence contracts/development/testing.md#distinguishing-cases Samples the upright and tilted poses, both sides of the capacity threshold, backward seeking and insufficient source volume. The rigid native props expose a uniform pose reader, while true and unknown articulation declarations still refuse.
 * @evidence contracts/development/testing.md#execution-ownership Builds short polygon-body performances in memory without a renderer or external state.
 */
export function test_motion_operate_pour(): void {
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
  // The right hand pours to its inner side, the glass turned so its lip
  // faces the cup there: pronation tips the glass toward the body's left. A
  // cup straight ahead asks the wrist to pitch the glass 40 degrees forward
  // at the pivot, which the arm cannot hold (planned with the pour's hard
  // lip and tilt limits, a task point stays 105 mm off at mid-flow).
  const targetAt: IAutoMovieVector3 = {
    x: sourceAt.x + 0.13,
    y: sourceAt.y + sourceLip.y - targetMouth.y,
    z: sourceAt.z,
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
      laws: [AutoMovieMotionHumanOperate.pour],
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
        HumanObject.prop("glass", source, { at: sourceAt, yaw: 90 }),
        HumanObject.prop("cup", target, {
          at: targetAt,
          yaw: 0,
          fixed: true,
        }),
      ],
      composition: HumanChain.subject("a")
        .pickUp({ prop: "glass", handle: "body", hand: "right" })
        .registered(AutoMovieMotionHumanOperate.pour.name, authored).node,
    });

  const film: IAutoMovieMotionHumanPerformance = performance(params);
  const segment: IAutoMovieMotionHumanSegment = film.segments("a")[1]!;
  const eventTime = (name: string): number =>
    segment.plan.duration *
    (segment.plan.events.find(
      (event: IAutoMovieMotionEvent): boolean => event.name === name,
    )?.share ?? NaN);
  const tipStart: number = params.timing.approach;
  const flowStart: number = tipStart + params.timing.tip;
  const flowEnd: number = flowStart + params.timing.flow;
  const retreatStart: number = flowEnd + params.timing.right;
  const duration: number = retreatStart + params.timing.retreat;
  for (const [name, expected] of [
    ["tipStart", tipStart],
    ["flowStart", flowStart],
    ["flowEnd", flowEnd],
    ["retreatStart", retreatStart],
  ] as const)
    TestValidator.predicate(
      name + " follows the authored clock",
      Math.abs(eventTime(name) - expected) <= 1e-8,
    );
  TestValidator.predicate(
    "the pour lasts through retreat",
    Math.abs(segment.plan.duration - duration) <= 1e-8,
  );
  const middle: number = (flowStart + flowEnd) / 2;
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const mouth: IAutoMovieVector3 = Vector3.add(targetAt, targetMouth);
  const pivot: IAutoMovieVector3 = { ...mouth, y: mouth.y + params.gap };
  for (const [seconds, tilt] of [
    [tipStart, 0],
    [(tipStart + flowStart) / 2, params.tilt / 2],
    [middle, params.tilt],
    [(flowEnd + retreatStart) / 2, params.tilt / 2],
    [retreatStart, 0],
  ] as const) {
    const displayed: IAutoMovieRigidTransform = film.prop(
      "glass",
      segment.start + seconds,
    );
    const lip: IAutoMovieVector3 = point(displayed, sourceLip);
    const vertical: number = Quaternion.rotateVector(displayed.rotation, up).y;
    const degrees: number =
      (Math.acos(Math.max(-1, Math.min(1, vertical))) * 180) / Math.PI;
    TestValidator.predicate(
      `the source tilts ${tilt} degrees at ${seconds}s`,
      Math.abs(degrees - tilt) <= 10,
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

  for (const [seconds, fraction] of [
    [0, 0],
    [flowStart, 0],
    [middle, 0.5],
    [flowEnd, 1],
    [duration, 1],
    [middle, 0.5],
  ] as const) {
    const discharged: number = params.transferMl * fraction;
    const caught: number = Math.min(
      discharged,
      params.capacityMl - params.targetMl,
    );
    const actual: IAutoMovieMotionHumanPour.ILiquid =
      AutoMovieMotionHumanOperate.pour.liquid(params, segment.plan, seconds);
    TestValidator.predicate(
      `liquid is apportioned and conserved at ${seconds}s`,
      Math.abs(actual.sourceMl - (params.sourceMl - discharged)) <= 1e-8 &&
        Math.abs(actual.targetMl - (params.targetMl + caught)) <= 1e-8 &&
        Math.abs(actual.spillMl - (discharged - caught)) <= 1e-8,
    );
  }

  let refusal: unknown;
  try {
    performance({ ...params, transferMl: params.sourceMl + 1 });
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
  for (const [axis, subject] of [
    ["source", params.source],
    ["target", params.target],
  ] as const)
    for (const declared of [true, undefined]) {
      let refusal: unknown;
      try {
        AutoMovieMotionHumanOperate.pour.plan({
          ...segment.context,
          params,
          prop: (id: string): IAutoMovieMotionHumanPropReader => {
            const reader: IAutoMovieMotionHumanPropReader =
              segment.context.prop(id);
            if (id !== subject) return reader;
            const { hasArticulations: _, ...rest } = reader.prop;
            const prop: IAutoMovieMotionHumanProp =
              declared === undefined
                ? rest
                : { ...rest, hasArticulations: declared };
            return { ...reader, prop };
          },
        });
      } catch (error: unknown) {
        refusal = error;
      }
      TestValidator.predicate(
        `${axis} with ${declared === true ? "declared" : "unknown"} articulation is refused`,
        refusal instanceof HumanRefusal &&
          refusal.kind === "affordance" &&
          refusal.axis === axis,
      );
    }
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
