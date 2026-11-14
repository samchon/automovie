import { createBag, createDrinkware } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanHand,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "./motionHumanBody";

/**
 * A prop the standing arm does not reach is picked up by lowering the body
 * toward it, on one body, which the `test_human_motion_pick_up_lowered_*`
 * specs read one body each.
 *
 * The person stands at the origin facing +Z. A glass stands on a counter
 * 0.95 m high (inside the 0.9 to 1.0 m of kitchen counters) before the right
 * shoulder, its grip ahead of the shoulder across the floor by the arm's
 * length and the grip socket's; a tote stands on the floor before the right
 * shoulder, 0.45 m ahead; a second glass stands on the counter 2.5 m ahead.
 *
 * Scenarios, on the body:
 * 1. The counter glass's grip lies beyond the straight arm (upper arm and
 *    forearm) and the grip socket from the standing shoulder, so the arm
 *    alone cannot take it.
 * 2. The counter glass is picked up: the pick up plans; at `gripClosed` the
 *    displayed right wrist lies within the straight arm of the shoulder; at
 *    `lifted` the glass stands at least 0.09 m above where it stood (the
 *    lift is 0.1 m); from `gripClosed` to the end it stays within 10 degrees
 *    of upright (#3361); at the end the hips and the right shoulder joints
 *    are within 10 mm of where they stood (the body straightened).
 * 3. The tote is picked up off the floor: it plans; at `gripClosed` the hips
 *    joint stands lower than standing and the wrist within the arm of the
 *    shoulder; at `lifted` the tote is at least 0.09 m above the floor
 *    where it stood; at the end the hips and the shoulder are back within
 *    10 mm.
 * 4. A bend toward the tote's handle cut at its `deepest` into the pick up
 *    plans and lifts the tote as scenario 3 reads it, the body left as the
 *    bend lowered it (a stand after straightens it): the bend may be cut
 *    into a pick up.
 * 5. The far glass is refused as a `reach` refusal whose message names a
 *    step closer.
 *
 * @param name The body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the scene with its measures and the 5 scenarios with their bounds.
 * @evidence contracts/development/implementation.md#principled-implementation Places real archetypes, builds performances through the public chain and reads displayed joints and prop frames.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One performance per scenario, its readings gathered as complaints and asserted once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A performance that does not plan is a complaint with the refusal's words.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four short performances and a refusal, read at a few instants.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by each body's spec, so the readings exist once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing past the call.
 */
export function motionPickUpLowered(name: motionHumanBody.Name): void {
  const body: IHumanBody = motionHumanBody(name);
  const complaints: string[] = [];
  const arm: number = body.measure.upperArm + body.measure.forearm;
  const glass: ReturnType<typeof createDrinkware> = createDrinkware({
    kind: "glass",
  });
  const tote: ReturnType<typeof createBag> = createBag({ kind: "tote" });
  const perform = (prop: IHumanProp, chain: HumanChain): HumanPerformance =>
    new HumanPerformance({
      seed: "reach",
      props: [prop],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: chain.node,
    });
  const instant = (segment: HumanSegment.ISegment, event: string): number =>
    segment.start +
    (segment.plan.events.find((e): boolean => e.name === event)?.share ?? NaN) *
      segment.plan.duration;
  const joint = (
    performance: HumanPerformance,
    seconds: number,
    bone: "hips" | "rightUpperArm" | "rightHand",
  ): IAutoMovieVector3 =>
    HumanSignature.joint(
      HumanSignature.of(performance, "a", body, 0),
      seconds,
      bone,
    );
  const mm = (metres: number): string => (metres * 1000).toFixed(1);

  // Where a prop's grip stands, placed at yaw 0 (no turn of its own frame).
  const grip = (
    model: {
      affordance(id: string): { frame: { translation: IAutoMovieVector3 } };
    },
    handle: string,
    at: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    Vector3.add(at, model.affordance(handle).frame.translation);

  // The standing shoulder, from a standing film.
  const still: HumanPerformance = perform(
    HumanObject.prop("glass", glass, { at: { x: 0, y: 0, z: 3 }, yaw: 0 }),
    HumanChain.subject("a").stand({ seconds: 0.5 }),
  );
  const shoulder: IAutoMovieVector3 = joint(still, 0, "rightUpperArm");
  const hips: IAutoMovieVector3 = joint(still, 0, "hips");

  // 1. The counter glass beyond the standing arm; the wrist stands a grip
  // socket short of the grip.
  const socket: number = Vector3.length(
    HumanHand.offset(body, "right", "grip").point,
  );
  const counter: IAutoMovieVector3 = {
    x: shoulder.x,
    y: 0.95,
    z: shoulder.z + arm + socket,
  };
  const reached: IAutoMovieVector3 = grip(glass, "body", counter);
  const standing: number = Vector3.length(Vector3.subtract(reached, shoulder));
  if (!(standing > arm + socket))
    complaints.push(
      `${name}: the counter glass's grip is ${mm(standing)} mm from the standing shoulder, beyond the arm and the grip socket (${mm(arm + socket)} mm) expected`,
    );

  // A pick up read: within reach at the grasp, lifted, and straight again.
  const picked = (
    label: string,
    performance: HumanPerformance,
    subject: string,
    from: number,
    upright: boolean,
    straight: boolean,
  ): void => {
    const segment: HumanSegment.ISegment = performance.segments("a").at(-1)!;
    const closed: number = instant(segment, "gripClosed");
    const lifted: number = instant(segment, "lifted");
    const reach: number = Vector3.length(
      Vector3.subtract(
        joint(performance, closed, "rightHand"),
        joint(performance, closed, "rightUpperArm"),
      ),
    );
    if (!(reach <= arm + 0.001))
      complaints.push(
        `${name}: ${label}: at gripClosed the wrist is ${mm(reach)} mm from the shoulder, within the arm's ${mm(arm)} mm expected`,
      );
    const rose: number = performance.prop(subject, lifted).position.y - from;
    if (!(rose >= 0.09))
      complaints.push(
        `${name}: ${label}: the prop rose ${mm(rose)} mm by lifted, at least 90 mm expected`,
      );
    const end: number = performance.duration;
    const kept: readonly (readonly [
      "hips" | "rightUpperArm",
      IAutoMovieVector3,
    ])[] = straight
      ? [
          ["hips", hips],
          ["rightUpperArm", shoulder],
        ]
      : [];
    for (const [bone, was] of kept) {
      const off: number = Vector3.length(
        Vector3.subtract(joint(performance, end, bone), was),
      );
      if (!(off <= 0.01))
        complaints.push(
          `${name}: ${label}: at the end the ${bone} joint is ${mm(off)} mm from where it stood, within 10 mm expected`,
        );
    }
    if (upright)
      for (let i: number = 0; i <= 8; i++) {
        const seconds: number = closed + 0.01 + ((end - closed - 0.01) * i) / 8;
        const axis: IAutoMovieVector3 = Quaternion.rotateVector(
          performance.prop(subject, seconds).rotation,
          { x: 0, y: 1, z: 0 },
        );
        const tilt: number =
          (Math.acos(Math.min(1, Math.max(-1, axis.y))) * 180) / Math.PI;
        if (!(tilt <= 10))
          complaints.push(
            `${name}: ${label}: at ${seconds.toFixed(2)} s the glass tilts ${tilt.toFixed(1)} degrees, within 10 expected`,
          );
      }
  };

  // 2. The counter glass.
  try {
    picked(
      "the counter glass",
      perform(
        HumanObject.prop("glass", glass, { at: counter, yaw: 0 }),
        HumanChain.subject("a").pickUp({ prop: "glass", handle: "body" }),
      ),
      "glass",
      counter.y,
      true,
      true,
    );
  } catch (error) {
    complaints.push(
      `${name}: the counter glass: expected to plan, got ${(error as Error).message}`,
    );
  }

  // 3 and 4. The tote off the floor, alone and after a bend.
  const floor: IAutoMovieVector3 = { x: shoulder.x, y: 0, z: 0.45 };
  for (const [label, chain, straight] of [
    [
      "the tote",
      HumanChain.subject("a").pickUp({ prop: "tote", handle: "handle" }),
      true,
    ],
    [
      "the tote after a bend",
      HumanChain.subject("a")
        .bend({ toward: { kind: "prop", subject: "tote", point: "handle" } })
        .until({ event: "deepest" })
        .pickUp({ prop: "tote", handle: "handle" }),
      // The pick up holds the body the bend left; a stand straightens it.
      false,
    ],
  ] as const)
    try {
      const performance: HumanPerformance = perform(
        HumanObject.prop("tote", tote, { at: floor, yaw: 0 }),
        chain,
      );
      picked(label, performance, "tote", 0, false, straight);
      const closed: number = instant(
        performance.segments("a").at(-1)!,
        "gripClosed",
      );
      const low: number = joint(performance, closed, "hips").y;
      if (!(low < hips.y - 0.01))
        complaints.push(
          `${name}: ${label}: at gripClosed the hips stand ${mm(low)} mm high, lower than standing (${mm(hips.y)} mm) expected`,
        );
    } catch (error) {
      complaints.push(
        `${name}: ${label}: expected to plan, got ${(error as Error).message}`,
      );
    }

  // 5. The far glass.
  let refused: unknown = null;
  try {
    perform(
      HumanObject.prop("glass", glass, {
        at: { ...counter, z: 2.5 },
        yaw: 0,
      }),
      HumanChain.subject("a").pickUp({ prop: "glass", handle: "body" }),
    );
  } catch (error) {
    refused = error;
  }
  if (
    !(
      refused instanceof HumanRefusal &&
      refused.kind === "reach" &&
      refused.message.includes("step closer")
    )
  )
    complaints.push(
      `${name}: the far glass: expected a reach refusal naming a step closer, got ${refused instanceof Error ? refused.message : String(refused)}`,
    );

  TestValidator.equals(
    `a prop beyond the standing arm is picked up by lowering the body (${name})`,
    complaints,
    [],
  );
}
