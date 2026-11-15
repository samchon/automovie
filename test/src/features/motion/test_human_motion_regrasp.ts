import { Quaternion, Transform, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanRegrasp,
  type HumanSegment,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/** The in-hand bound, metres: #3447's acceptance (a contact pad within 1 mm of its point on the object, a twisted key's off-axis motion under 1 mm). */
const STABLE: number = 0.001;

/** A key at a world point: its bow a handle at its origin, its shank along its +X from the origin, a second grip 30 mm along the shank. */
const key = (at: IAutoMovieVector3): IHumanProp => ({
  subject: "key",
  frame: { position: at, rotation: Quaternion.identity() },
  points: {},
  affordances: [
    {
      id: "bow",
      kind: "handle",
      frame: Transform.identity(),
      extent: null,
      radius: 0.01,
    },
    {
      id: "shank",
      kind: "handle",
      frame: Transform.identity(),
      extent: null,
      radius: 0.003,
    },
    {
      id: "tip",
      kind: "handle",
      frame: { ...Transform.identity(), translation: { x: 0.03, y: 0, z: 0 } },
      extent: null,
      radius: 0.003,
    },
  ],
});

/** The world point of a key-frame point at a second. */
const point = (
  p: HumanPerformance,
  local: IAutoMovieVector3,
  seconds: number,
): IAutoMovieVector3 => {
  const f: IHumanProp.IFrame = p.prop("key", seconds);
  return Vector3.add(f.position, Quaternion.rotateVector(f.rotation, local));
};

/**
 * A held object turned and shifted in the hand (#3447).
 *
 * The average man picks a key up by its bow from waist height before his
 * right shoulder, then turns it or shifts his grip.
 *
 * Scenarios:
 *
 * 1. `twist` by 90 degrees: two points of the key's axis stay where they were
 *    within 1 mm (the campaign's grip bound) through the turn, so the key
 *    turns about its own axis only.
 * 2. The twist's end: a point 20 mm off the axis lies where a quarter turn
 *    about the axis puts it, within 1 mm, and a -90 turn turns it the other
 *    way.
 * 3. Through the twist the key keeps its place in the hand within 1 mm.
 * 4. `regrip` to the `tip`: the key's world frame moves continuously (no
 *    step above 1 mm between reads 1/240 s apart) and ends held at the new
 *    grip.
 * 5. A twist by a hand that holds nothing is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs pick-ups followed by the rows and reads the displayed prop and hand frames.
 * @evidence contracts/development/testing.md#independent-expectations A rotation about an axis fixes the axis's points and turns an off-axis point by the angle; the in-hand bound is #3447's 1 mm (`STABLE`).
 * @evidence contracts/development/testing.md#distinguishing-cases Both turn directions, a regrip, and the refused empty hand.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test preparing one polygon man; no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the cast and the five scenarios with their bounds.
 */
export function test_human_motion_regrasp(): void {
  const complaints: string[] = [];
  const body: IHumanBody = motionHumanBody("m-average");
  const m: IHumanBody["measure"] = body.measure;
  const at: IAutoMovieVector3 = {
    x: -m.shoulderHalfWidth,
    y: m.waistHeight,
    z: 0.6 * (m.upperArm + m.forearm),
  };
  const perform = (
    composition: HumanPerformance.IInput["composition"],
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "regrasp",
      laws: [HumanRegrasp.twist, HumanRegrasp.regrip, HumanRegrasp.roll],
      props: [key(at)],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition,
    });
  const span = (p: HumanPerformance): [number, number] => {
    const s: HumanSegment.ISegment = p.segments("a").at(-1)!;
    return [s.start, s.start + s.plan.duration];
  };

  // 1-3. Twists both ways.
  for (const angle of [90, -90])
    try {
      const turned: HumanPerformance = perform(
        HumanChain.subject("a")
          .pickUp({ prop: "key", handle: "bow" })
          .registered("twist", {
            prop: "key",
            side: "right",
            axis: "shank",
            angle,
          }).node,
      );
      const [from, to] = span(turned);
      const axis0: IAutoMovieVector3 = point(
        turned,
        { x: 0, y: 0, z: 0 },
        from,
      );
      const axis1: IAutoMovieVector3 = point(
        turned,
        { x: 0.03, y: 0, z: 0 },
        from,
      );
      const off0: IAutoMovieVector3 = point(
        turned,
        { x: 0.01, y: 0.02, z: 0 },
        from,
      );
      const hand0 = turned.bones("a", from).get("rightHand")!;
      const seat0: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(hand0.worldRotation),
        Vector3.subtract(
          turned.prop("key", from).position,
          hand0.worldPosition,
        ),
      );
      let drift: number = 0;
      let slip: number = 0;
      for (let t: number = from; t <= to; t += 1 / 60) {
        drift = Math.max(
          drift,
          Vector3.length(
            Vector3.subtract(point(turned, { x: 0, y: 0, z: 0 }, t), axis0),
          ),
          Vector3.length(
            Vector3.subtract(point(turned, { x: 0.03, y: 0, z: 0 }, t), axis1),
          ),
        );
        const hand = turned.bones("a", t).get("rightHand")!;
        const seat: IAutoMovieVector3 = Quaternion.rotateVector(
          Quaternion.inverse(hand.worldRotation),
          Vector3.subtract(turned.prop("key", t).position, hand.worldPosition),
        );
        slip = Math.max(slip, Vector3.length(Vector3.subtract(seat, seat0)));
      }
      if (!(drift <= STABLE))
        complaints.push(
          `twist ${angle}: the key's axis moves ${(drift * 1000).toFixed(2)} mm, within ${STABLE * 1000} mm expected`,
        );
      if (!(slip <= STABLE))
        complaints.push(
          `twist ${angle}: the key moves ${(slip * 1000).toFixed(2)} mm in the hand, within ${STABLE * 1000} mm expected`,
        );
      const direction: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(axis1, axis0),
      );
      const expected: IAutoMovieVector3 = Vector3.add(
        axis0,
        Quaternion.rotateVector(
          Quaternion.fromAxisAngle(direction, angle),
          Vector3.subtract(off0, axis0),
        ),
      );
      const miss: number = Vector3.length(
        Vector3.subtract(
          point(turned, { x: 0.01, y: 0.02, z: 0 }, to),
          expected,
        ),
      );
      if (!(miss <= STABLE))
        complaints.push(
          `twist ${angle}: the off-axis point ends ${(miss * 1000).toFixed(2)} mm from a ${angle} degree turn, within ${STABLE * 1000} mm expected`,
        );
    } catch (error) {
      complaints.push(
        `twist ${angle}: expected to plan, got ${(error as Error).message}`,
      );
    }

  // 4. A regrip to the tip moves continuously.
  try {
    const shifted: HumanPerformance = perform(
      HumanChain.subject("a")
        .pickUp({ prop: "key", handle: "bow" })
        .registered("regrip", { prop: "key", side: "right", to: "tip" }).node,
    );
    const [from, to] = span(shifted);
    let jump: number = 0;
    let previous: IAutoMovieVector3 = shifted.prop("key", from).position;
    for (let t: number = from + 1 / 240; t <= to; t += 1 / 240) {
      const now: IAutoMovieVector3 = shifted.prop("key", t).position;
      jump = Math.max(jump, Vector3.length(Vector3.subtract(now, previous)));
      previous = now;
    }
    if (!(jump <= STABLE))
      complaints.push(
        `regrip: the key jumps ${(jump * 1000).toFixed(2)} mm between reads 1/240 s apart, within ${STABLE * 1000} mm expected`,
      );
  } catch (error) {
    complaints.push(
      `regrip: expected to plan, got ${(error as Error).message}`,
    );
  }

  // 5. An empty hand cannot twist.
  try {
    perform(
      HumanChain.subject("a").registered("twist", {
        prop: "key",
        side: "right",
        axis: "shank",
        angle: 90,
      }).node,
    );
    complaints.push("a twist by an empty hand was not refused");
  } catch (error) {
    if (!(error as Error).message.includes("does not hold"))
      complaints.push(
        `an empty hand's twist was refused with "${(error as Error).message}"`,
      );
  }
  TestValidator.equals(
    "a held object turned and shifted in the hand",
    complaints,
    [],
  );
}
