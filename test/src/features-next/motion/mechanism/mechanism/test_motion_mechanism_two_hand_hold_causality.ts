import {
  createDrinkware,
  createShield,
  createSword,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieChain,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanBlade,
  AutoMovieMotionHumanStageFight,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/** A held prop stays carried, without re-entering an earlier pose, when a later or overlaid action takes one of them.
 *
 * Scenarios:
 * 1. The left hand picks up a strapped shield, the right hand an arming sword, and a boss beat then takes the shield in the left hand.
 * 2. Each hand picks up an arming sword, and a high-outside parry drill then takes the left blade.
 * 3. The same two blades rest for a second, and the parry is synced 0.4 s before the rest ends, so it cuts into the rest.
 * 4. The right hand picks up a glass, and a drink is laid over a four-second stand; after the drink the stand still carries the glass.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Plans each performance and samples every pose and every prop frame at 60 Hz to the end. A carry that captures a hold taken by a later action re-enters the earlier pose without bound (#4023): scenarios 1 and 2 overflow the stack without the capture-instant order. A selection that drops a hold it still owes lets the carried arm leave the chest, or a prop slide in its hand, and fails.
 * @evidence contracts/development/testing.md#independent-expectations A gripped prop is rigid in its hand: its position in the holding hand's frame does not change while the grip lasts, within 1 mm for the composed float64 transforms. A carried arm keeps the hand where it was on the chest, since the carry is that chest-relative place; 1 µm covers the same composition, while an arm returned to the stand's own pose moves centimetres. The take-over itself is not compared.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a stage beat and a blade action taking a prop at the boundary of the pick-up that preceded them, an advanced parry that starts inside the previous action, and an overlay that takes over a held prop inside its carrier. Master refuses to cut a pick-up into a parry and to lay a pick-up over another action, so the advanced case cuts into a rest and the overlay case takes over a held glass; scenarios 3 and 4 pass with or without the change and guard the carries it must keep. Single-prop carries belong to the pick-up and stage-prop specs.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_motion_mechanism_two_hand_hold_causality`, planning and sampling the public performance with a prepared polygon body; it starts no viewer, render or capture host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios, naming the props, hands, later actions, the advanced timing and the overlay each one exercises.
 */
export function test_motion_mechanism_two_hand_hold_causality(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const sword: ReturnType<typeof createSword> = createSword({
    kind: "armingSword",
  });
  const findings: string[] = [
    ...take(
      "boss beat",
      [
        HumanObject.prop("shield", createShield({ kind: "strapped" }), {
          at: { x: 0.3, y: 0.85, z: 0.3 },
          yaw: 0,
        }),
        HumanObject.prop("sword", sword, {
          at: { x: -0.3, y: 0.85, z: 0.3 },
          yaw: 0,
        }),
      ],
      AutoMovieMotionHumanStageFight.stageProp(
        HumanChain.subject("m")
          .stand()
          .pickUp({ prop: "shield", handle: "grip", hand: "left", lift: 0 })
          .pickUp({ prop: "sword", handle: "grip", hand: "right", lift: 0 }),
        { beat: "boss", prop: "shield", hand: "left", mark: "boss" },
        "boss",
      ),
      { left: "shield", right: "sword" },
      "stageProp",
    ),
    ...take(
      "parry drill",
      [
        HumanObject.prop("off", sword, {
          at: { x: 0.3, y: 0.85, z: 0.3 },
          yaw: 0,
        }),
        HumanObject.prop("edge", sword, {
          at: { x: -0.3, y: 0.85, z: 0.3 },
          yaw: 0,
        }),
      ],
      HumanChain.subject("m")
        .stand()
        .pickUp({ prop: "off", handle: "grip", hand: "left", lift: 0 })
        .pickUp({ prop: "edge", handle: "grip", hand: "right", lift: 0 })
        .registered("parry", {
          blade: "off",
          hand: "left",
          line: "highOutside",
        }),
      { left: "off", right: "edge" },
      "parry",
    ),
    ...take(
      "advanced parry",
      [
        HumanObject.prop("off", sword, {
          at: { x: 0.3, y: 0.85, z: 0.3 },
          yaw: 0,
        }),
        HumanObject.prop("edge", sword, {
          at: { x: -0.3, y: 0.85, z: 0.3 },
          yaw: 0,
        }),
      ],
      HumanChain.subject("m")
        .stand()
        .pickUp({ prop: "off", handle: "grip", hand: "left", lift: 0 })
        .pickUp({ prop: "edge", handle: "grip", hand: "right", lift: 0 })
        .stand({ hold: 1 }, "rest")
        .registered("parry", {
          blade: "off",
          hand: "left",
          line: "highOutside",
        })
        .sync({ of: "rest", event: "end", offset: -0.4 }),
      { left: "off", right: "edge" },
      "parry",
    ),
    ...take(
      "overlay drink",
      [
        HumanObject.prop("glass", createDrinkware({ kind: "glass" }), {
          at: {
            x: -body.measure.shoulderHalfWidth,
            y: body.measure.waistHeight,
            z: 0.6 * (body.measure.upperArm + body.measure.forearm),
          },
          yaw: 0,
        }),
      ],
      HumanChain.subject("m")
        .pickUp({
          prop: "glass",
          handle: "body",
          use: { tip: "lip", line: "square", at: "mouth" },
        })
        .stand({ hold: 4 })
        .over(
          (upper: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
            upper.handToFace({
              kind: "drink",
              prop: "glass",
              grasp: { handle: "body", line: "square" },
            }),
        ),
      { right: "glass" },
      (performance: HumanPerformance): [number, number] => [
        Math.max(
          ...performance
            .overlays("m")
            .map(
              (overlay: IAutoMovieMotionHumanSegment.IOverlay): number =>
                overlay.end,
            ),
        ) + 0.05,
        performance.segments("m").at(-1)!.end,
      ],
    ),
  ];
  TestValidator.equals(
    "both held props stay carried without re-entering an earlier pose",
    findings,
    [],
  );

  /** Plan, sample to the end and measure each prop in its hand through the last beat, or through the window named. */
  function take(
    label: string,
    props: IAutoMovieMotionHumanProp[],
    chain: IAutoMovieChain,
    held: Partial<Record<AutoMovieHumanSide, string>>,
    last: string | ((performance: HumanPerformance) => [number, number]),
    carried: AutoMovieHumanSide = "right",
  ): string[] {
    const out: string[] = [];
    let performance: HumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "two-hand-hold",
        performers: [
          {
            subject: "m",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: chain.node,
        laws: [
          AutoMovieMotionHumanStageFight.HumanStageProp,
          ...Object.values(AutoMovieMotionHumanBlade.HumanBlade),
        ],
        props,
      });
      for (let k: number = 0; k <= Math.ceil(performance.duration * 60); ++k) {
        const seconds: number = Math.min(performance.duration, k / 60);
        performance.pose("m", seconds);
        for (const subject of Object.values(held))
          performance.prop(subject!, seconds);
      }
    } catch (error) {
      return [
        `${label}: ${(error as Error).name}: ${(error as Error).message}`,
      ];
    }
    let window: [number, number];
    if (typeof last === "string") {
      const beat: IAutoMovieMotionHumanSegment | undefined = performance
        .segments("m")
        .find(
          (segment: IAutoMovieMotionHumanSegment): boolean =>
            segment.law.name === last,
        );
      if (beat === undefined) return [`${label}: no ${last} segment`];
      window = [beat.start, beat.end];
    } else window = last(performance);
    const [from, to]: [number, number] = window;
    if (!(to > from)) return [`${label}: empty window ${from} to ${to}`];
    for (const side of ["left", "right"] as const) {
      const subject: string | undefined = held[side];
      if (subject === undefined) continue;
      let first: IAutoMovieVector3 | undefined;
      let drift: number = 0;
      for (let k: number = 0; k <= 30; ++k) {
        const seconds: number = from + ((to - from) * k) / 30;
        const hand: IAutoMovieResolvedBone = performance
          .bones("m", seconds)
          .get(`${side}Hand`)!;
        const frame: IAutoMovieRigidTransform = performance.prop(
          subject,
          seconds,
        );
        const local: IAutoMovieVector3 = Quaternion.rotateVector(
          Quaternion.inverse(hand.worldRotation),
          Vector3.subtract(frame.position, hand.worldPosition),
        );
        first ??= local;
        drift = Math.max(drift, Vector3.length(Vector3.subtract(local, first)));
      }
      if (!(drift < 1e-3))
        out.push(`${label}: ${subject} slides ${drift} m in the ${side} hand`);
    }
    let anchor: IAutoMovieVector3 | undefined;
    let sway: number = 0;
    for (let k: number = 0; k <= 30; ++k) {
      const seconds: number = from + ((to - from) * k) / 30;
      const bones: Map<string, IAutoMovieResolvedBone> = performance.bones(
        "m",
        seconds,
      );
      const chest: IAutoMovieResolvedBone = bones.get("chest")!;
      const hand: IAutoMovieResolvedBone = bones.get(`${carried}Hand`)!;
      const local: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(chest.worldRotation),
        Vector3.subtract(hand.worldPosition, chest.worldPosition),
      );
      anchor ??= local;
      sway = Math.max(sway, Vector3.length(Vector3.subtract(local, anchor)));
    }
    if (!(sway < 1e-6))
      out.push(
        `${label}: the carried ${carried} hand moves ${sway} m on the chest`,
      );
    return out;
  }
}
