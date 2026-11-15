import {
  createTable,
  createTableware,
  createTool,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  type IHumanBody,
  type IHumanProp,
  seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/** A prop's named contact in the world, read from its rest frame. */
const contact = (prop: IHumanProp, id: string): IAutoMovieVector3 => {
  const a: IAutoMovieAffordance = prop.affordances!.find(
    (x: IAutoMovieAffordance): boolean => x.id === id,
  )!;
  return Vector3.add(
    prop.frame.position,
    Quaternion.rotateVector(prop.frame.rotation, a.frame.translation),
  );
};

/**
 * Eating with a fork at a table (#3361's hand-to-face rows on a seated base,
 * with the archetypes of #3501).
 *
 * The average man sits on a seat at its popliteal height before a dining
 * table (`createTable`), a plate (`createTableware`, `plate`) on the table's
 * `top` before him, a fork (`createTool`, `fork`) on the plate's `top`. He
 * picks the fork up by its `grip` and eats (`handToFace` `eat`, the fork as
 * its prop and its `face` as the working point).
 *
 * Scenarios:
 *
 * 1. With the right hand and the plate on his right, the fork's `face`
 *    comes within 10 mm of the mouth region's point at its closest, the
 *    touch bound a contact on the skin is read against.
 * 2. With the left hand and the plate on his left, the same.
 * 3. With the plate near (half the arm's reach ahead of the table's edge)
 *    and far (the arm's reach less a hand), the same for the right hand.
 * 4. With the plate beyond the arm's reach (twice the reach ahead) the
 *    pick-up is refused with a reason (a `HumanRefusal`), never planned
 *    with the fork left behind.
 * 5. Through the meal the fork stays in the hand that took it: its place in
 *    that hand moves by at most 1 mm (the campaign's grip bound) from its
 *    grip to the end.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the seated scene from the archetypes, performs the pick-up and the eating through the public chain and measures the displayed fork and mouth.
 * @evidence contracts/development/testing.md#independent-expectations The touch bound of a skin contact, the campaign's grip bound, and reach as the arm's own length.
 * @evidence contracts/development/testing.md#distinguishing-cases Both hands, a near and a far plate, and an unreachable plate.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test preparing one polygon man and in-memory archetypes; no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the scene and the five scenarios with their bounds.
 */
export function test_human_motion_habit_eat(): void {
  const complaints: string[] = [];
  const body: IHumanBody = motionHumanBody("m-average");
  const m: IHumanBody["measure"] = body.measure;
  const reach: number = m.upperArm + m.forearm + m.hand;
  const seat: seated.ISeat = {
    at: {
      x: 0,
      y: seated.popliteal(body),
      z: body.rest.get("leftFoot")!.z - 0.1,
    },
    yaw: 0,
    depth: 0.45,
  };
  const table: IHumanProp = HumanObject.prop(
    "table",
    createTable({ kind: "dining" }, 1),
    {
      at: { x: 0, y: 0, z: 0.25 + 0.3 },
      yaw: 0,
      fixed: true,
    },
  );
  const top: IAutoMovieVector3 = contact(table, "top");

  const scene = (side: "left" | "right", ahead: number): HumanPerformance => {
    const out: number = (side === "left" ? 1 : -1) * m.shoulderHalfWidth;
    const plate: IHumanProp = HumanObject.prop(
      "plate",
      createTableware({ kind: "plate" }, 1),
      {
        at: { x: out, y: top.y, z: seat.at.z + ahead },
        yaw: 0,
      },
    );
    const fork: IHumanProp = HumanObject.prop(
      "fork",
      createTool({ kind: "fork" }, 1),
      {
        at: contact(plate, "top"),
        yaw: 90,
      },
    );
    return new HumanPerformance({
      seed: "eat",
      props: [table, plate, fork],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .sit({ seat, seconds: 0.2 })
        .pickUp({ prop: "fork", handle: "grip", hand: side })
        .registered("handToFace", {
          task: "eat",
          side,
          prop: "fork",
          point: "face",
        }).node,
    });
  };
  const closest = (p: HumanPerformance): number => {
    const s: HumanSegment.ISegment = p.segments("a").at(-1)!;
    let best: number = Infinity;
    for (let t: number = s.start; t <= s.start + s.plan.duration; t += 1 / 60) {
      const bones = p.bones("a", t);
      const mouth = body.surfaces.regions.mouth;
      const lips: IAutoMovieVector3 = Vector3.add(
        bones.get(mouth.bone)!.worldPosition,
        Quaternion.rotateVector(
          bones.get(mouth.bone)!.worldRotation,
          mouth.point,
        ),
      );
      const f: IHumanProp.IFrame = p.prop("fork", t);
      const tip: IAutoMovieVector3 = Vector3.add(
        f.position,
        Quaternion.rotateVector(f.rotation, forkFace),
      );
      best = Math.min(best, Vector3.length(Vector3.subtract(tip, lips)));
    }
    return best;
  };
  const forkModel: IHumanProp = HumanObject.prop(
    "fork",
    createTool({ kind: "fork" }, 1),
    {
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
    },
  );
  const forkFace: IAutoMovieVector3 = forkModel.affordances!.find(
    (a: IAutoMovieAffordance): boolean => a.id === "face",
  )!.frame.translation;

  // 1-3. Both hands, near and far.
  for (const [label, side, ahead] of [
    ["right hand", "right", 0.5 * reach],
    ["left hand", "left", 0.5 * reach],
    ["near plate", "right", 0.35 * reach],
    ["far plate", "right", reach - m.hand],
  ] as const)
    try {
      const p: HumanPerformance = scene(side, ahead);
      const miss: number = closest(p);
      if (!(miss <= 0.01))
        complaints.push(
          `${label}: the fork's face comes ${(miss * 1000).toFixed(1)} mm from the mouth at its closest, within 10 mm expected`,
        );

      // 5. The fork stays in its hand.
      const grip: number =
        p.segments("a")[1]!.start + p.segments("a")[1]!.plan.duration;
      const seat0 = (t: number): IAutoMovieVector3 => {
        const hand = p.bones("a", t).get(`${side}Hand`)!;
        return Quaternion.rotateVector(
          Quaternion.inverse(hand.worldRotation),
          Vector3.subtract(p.prop("fork", t).position, hand.worldPosition),
        );
      };
      const start: IAutoMovieVector3 = seat0(grip);
      let slip: number = 0;
      for (let t: number = grip; t <= p.duration; t += 0.1)
        slip = Math.max(
          slip,
          Vector3.length(Vector3.subtract(seat0(t), start)),
        );
      if (!(slip <= 0.001))
        complaints.push(
          `${label}: the fork moves ${(slip * 1000).toFixed(2)} mm in the hand, within 1 mm expected`,
        );
    } catch (error) {
      complaints.push(
        `${label}: expected to plan, got ${(error as Error).message}`,
      );
    }

  // 4. An unreachable plate.
  try {
    scene("right", 2 * reach);
    complaints.push("a plate twice the reach away was not refused");
  } catch (error) {
    if (!(error instanceof HumanRefusal))
      complaints.push(
        `a plate twice the reach away threw ${(error as Error).message}, a refusal with its reason expected`,
      );
  }
  TestValidator.equals("eating with a fork at a table", complaints, []);
}
