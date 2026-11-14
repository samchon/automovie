import { createClub, createSword, createTable } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanHand,
  HumanObject,
  HumanPerformance,
  type HumanSegment,
  type IHumanActionContext,
  type IHumanActionLaw,
  type IHumanActionPlan,
  type IHumanBody,
  type IHumanProp,
  StrikingHeld,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A held tool's line is the tool's own: from the grip to its working point.
 * Where the archetype declares the working affordance's `+Y` a face's
 * normal (a bat's `strike`), the line runs from the hand's grip to that
 * point and the working length is that distance; where it declares the
 * `+Y` along the tool (a sword's `point`), the line is that `+Y`, as it
 * always was.
 *
 * Scenarios, on the average man standing at the origin facing +Z beside a
 * counter-height table to his right, each tool lying on it and picked up
 * by its `grip`, then read by a law that reads what the hand holds
 * (`StrikingHeld.of`) at its entry:
 * 1. The bat, by its `strike`: the working length equals the distance from
 *    the displayed hand's grip socket to the displayed `strike` point within
 *    1 mm, and the line, carried into the world by the displayed hand, lies
 *    within 0.5 degree of the direction from the one to the other.
 * 2. The sword, by its `point` and `edge`: the line, carried into the world
 *    by the displayed hand, lies within 0.5 degree of the displayed `point`
 *    affordance's own `+Y`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Picks real archetypes up through the public chain and reads the tool the motions read at the next action's entry against the displayed hand and props; a bat whose line is its strike face's normal, a working length that is not the grip-to-strike distance, or a sword whose line has left its point's direction fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected line and length are the displayed hand's grip socket and the props' own affordances, read here, never from the tool reader; the 1 mm and 0.5 degree are reading tolerances.
 * @evidence contracts/development/testing.md#distinguishing-cases A working affordance declared a face's normal against one declared along the tool.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds two short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the stage and the 2 scenarios with their bounds.
 */
export function test_human_motion_held_tool_line(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const complaints: string[] = [];
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const placement: IAutoMovieTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const degrees = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    (Math.acos(
      Math.max(
        -1,
        Math.min(1, Vector3.dot(Vector3.normalize(a), Vector3.normalize(b))),
      ),
    ) *
      180) /
    Math.PI;
  const bat: ReturnType<typeof createClub> = createClub({ kind: "bat" });
  const sword: ReturnType<typeof createSword> = createSword({
    kind: "longsword",
  });
  const cases: {
    label: string;
    prop: ReturnType<typeof createClub> | ReturnType<typeof createSword>;
    points: StrikingHeld.IPoints;
    working: IAutoMovieTransform;
  }[] = [
    {
      label: "the bat",
      prop: bat,
      points: { tip: "strike" },
      working: bat.placed("strike", placement),
    },
    {
      label: "the sword",
      prop: sword,
      points: { tip: "point", edge: "edge" },
      working: sword.placed("point", placement),
    },
  ];
  for (const one of cases) {
    // What the reading law read, and when.
    const seen: { tool: StrikingHeld.ITool | null; at: number } = {
      tool: null,
      at: Number.NaN,
    };
    const reading: IHumanActionLaw<stand.IParams> = {
      name: "readHeld",
      interrupts: stand.interrupts,
      plan: (context: IHumanActionContext<stand.IParams>): IHumanActionPlan => {
        seen.tool = StrikingHeld.of(context, "right", "tool", one.points);
        seen.at = context.start;
        return stand.plan(context);
      },
    };
    let film: HumanPerformance;
    try {
      film = new HumanPerformance({
        seed: "line",
        laws: [reading] as IHumanActionLaw<never>[],
        props: [
          HumanObject.prop("bench", createTable({ kind: "counter" }), {
            at: { x: -0.65, y: 0, z: 0 },
            yaw: 90,
          }),
          HumanObject.prop("tool", one.prop, {
            at: { x: -0.42, y: 0.914, z: 0.1 },
            yaw: 0,
          }),
        ],
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
          .pickUp({ prop: "tool", handle: "grip" })
          .registered("readHeld", { seconds: 0.2 }).node,
      });
    } catch (error) {
      complaints.push(
        `${one.label}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const segment: HumanSegment.ISegment | undefined = film
      .segments("a")
      .find((s: HumanSegment.ISegment): boolean => s.name === "readHeld");
    const tool: StrikingHeld.ITool | null = seen.tool;
    const at: number = seen.at;
    if (segment === undefined || tool === null) {
      complaints.push(`${one.label}: the reading law never ran`);
      continue;
    }
    const bones: ReturnType<typeof film.bones> = film.bones("a", at);
    const hand: IAutoMovieQuaternion = bones.get("rightHand")!.worldRotation;
    const socket: IAutoMovieVector3 = HumanHand.frame(
      body,
      bones,
      "right",
      "grip",
    ).point;
    const frame: IHumanProp.IFrame = film.prop("tool", at);
    const working: IAutoMovieTransform = one.working;
    const point: IAutoMovieVector3 = Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, working.translation),
    );
    const line: IAutoMovieVector3 = Quaternion.rotateVector(hand, tool.axis);
    if (one.label === "the bat") {
      // 1. The bat's line and length run from the grip to the strike.
      const length: number = Vector3.length(Vector3.subtract(point, socket));
      if (!(Math.abs(tool.length - length) <= 0.001))
        complaints.push(
          `the bat: the working length is ${(tool.length * 1000).toFixed(1)} mm, the grip-to-strike distance ${(length * 1000).toFixed(1)} mm expected within 1 mm`,
        );
      const off: number = degrees(line, Vector3.subtract(point, socket));
      if (!(off <= 0.5))
        complaints.push(
          `the bat: the line is ${off.toFixed(2)} degrees from the grip-to-strike direction, within 0.5 expected`,
        );
    } else {
      // 2. The sword's line is its point's own +Y.
      const own: IAutoMovieVector3 = Quaternion.rotateVector(
        frame.rotation,
        Quaternion.rotateVector(working.rotation, up),
      );
      const off: number = degrees(line, own);
      if (!(off <= 0.5))
        complaints.push(
          `the sword: the line is ${off.toFixed(2)} degrees from its point's own direction, within 0.5 expected`,
        );
    }
  }
  TestValidator.equals("a held tool's line is the tool's own", complaints, []);
}
