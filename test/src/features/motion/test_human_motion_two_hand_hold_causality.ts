import { createShield, createSword } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieChain,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanBlade,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanStageProp,
  composeHumanStageProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/** A prop held in each hand stays carried, without re-entering an earlier pose, when a later action takes one of them.
 *
 * Scenarios:
 * 1. The left hand picks up a strapped shield, the right hand an arming sword, and a boss beat then takes the shield in the left hand.
 * 2. Each hand picks up an arming sword, and a high-outside parry drill then takes the left blade.
 * 3. The same two blades rest for a second, and the parry is synced 0.4 s before the rest ends, so it cuts into the rest.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Plans each performance and samples every pose and both prop frames at 60 Hz to the end. A carry that captures a hold taken by a later action re-enters the earlier pose without bound (#4023): scenarios 1 and 2 overflow the stack without the causal order. A carry that drops a hold it still owes lets that prop slide in its hand during the last beat and fails all three.
 * @evidence contracts/development/testing.md#independent-expectations A gripped prop is rigid in its hand: its position in the holding hand's frame does not change while the grip lasts. The 1 mm allowance covers the composed float64 transforms; the take-over itself is not compared.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a stage beat and a blade action taking a prop at the boundary of the pick-up that preceded them, and an advanced parry that starts inside the previous action. Master refuses to cut a pick-up into a parry, so the advanced case cuts into a rest; it passes with or without the causal order and guards the carry through the overlap. Single-prop carries belong to the pick-up and stage-prop specs.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_human_motion_two_hand_hold_causality`, planning and sampling the public performance with a prepared polygon body; it starts no viewer, render or capture host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios, naming the props, hands, later actions and the advanced timing each one exercises.
 */
export function test_human_motion_two_hand_hold_causality(): void {
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
      composeHumanStageProp(
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
        .stand({ seconds: 1 }, "rest")
        .registered("parry", {
          blade: "off",
          hand: "left",
          line: "highOutside",
        })
        .sync({ of: "rest", event: "end", offset: -0.4 }),
      { left: "off", right: "edge" },
      "parry",
    ),
  ];
  TestValidator.equals(
    "both held props stay carried without re-entering an earlier pose",
    findings,
    [],
  );

  /** Plan, sample to the end and measure each prop in its hand through the last beat. */
  function take(
    label: string,
    props: IAutoMovieMotionHumanProp[],
    chain: IAutoMovieChain,
    held: Record<AutoMovieHumanSide, string>,
    last: string,
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
        laws: [HumanStageProp, ...Object.values(HumanBlade)],
        props,
      });
      for (let k: number = 0; k <= Math.ceil(performance.duration * 60); ++k) {
        const seconds: number = Math.min(performance.duration, k / 60);
        performance.pose("m", seconds);
        for (const subject of Object.values(held))
          performance.prop(subject, seconds);
      }
    } catch (error) {
      return [
        `${label}: ${(error as Error).name}: ${(error as Error).message}`,
      ];
    }
    const beat: IAutoMovieMotionHumanSegment | undefined = performance
      .segments("m")
      .find(
        (segment: IAutoMovieMotionHumanSegment): boolean =>
          segment.law.name === last,
      );
    if (beat === undefined) return [`${label}: no ${last} segment`];
    for (const side of ["left", "right"] as const) {
      const subject: string = held[side];
      let first: IAutoMovieVector3 | undefined;
      let drift: number = 0;
      for (let k: number = 0; k <= 30; ++k) {
        const seconds: number = beat.start + ((beat.end - beat.start) * k) / 30;
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
    return out;
  }
}
