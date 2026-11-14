import { createLadder } from "@automovie/archetypes";
import { HumanObject, type IHumanBody } from "@automovie/motions";

import { motionHumanLawSweep } from "./motionHumanLawSweep";

const S: typeof motionHumanLawSweep = motionHumanLawSweep;

/**
 * The stages of the laws that carry the body over the ground: standing,
 * walking, running, jumping, approaching a person, stepping over a box,
 * stairs, a ladder, crawling and carrying a load.
 *
 * Every distance is the body's own or a plain staging choice: a walk of 3 m
 * and a run of 6 m straight ahead, a standing jump of 0.6 hip heights, a
 * partner 3 m ahead to approach, the 0.3 m box of the everyday captures, four
 * stairs, and the carry captures' load of 0.15 carried 2.5 m.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the family and every staging distance.
 * @evidence contracts/development/design.md#principled-representation One stage per law, keyed by the law's name, each asking the row for the parameters it can set.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Ten laws, the ones whose intent is travel.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row is special-cased; a parameter is passed under its own name.
 */
export const MOTION_HUMAN_LAW_STAGES_LOCOMOTION: Readonly<
  Record<string, motionHumanLawSweep.Stage>
> = {
  stand: (
    _pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(a, S.chain().act("stand", { seconds: 2 })),
  walk: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act("walk", {
        to: { x: 0, y: 0, z: 3 },
        ...S.set(pick, "pace"),
      }),
    ),
  run: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act("run", {
        to: { x: 0, y: 0, z: 6 },
        ...S.set(pick, "pace"),
      }),
    ),
  jump: (
    _pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act("jump", {
        to: { x: 0, y: 0, z: 0.6 * a.measure.hipHeight },
      }),
    ),
  approach: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
    b: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.duo(a, b, 3, [
      S.chain().act("approach", {
        target: S.person("b", "sternum"),
        at: pick("at") ?? "personal",
        ...S.set(pick, "side"),
      }),
      S.chain("b").act("stand", { seconds: 8 }),
    ]),
  stepOver: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act("stepOver", {
        obstacle: { at: { x: 0, y: 0, z: 0.35 }, height: 0.3, depth: 0.25 },
        ...S.set(pick, "lead"),
      }),
    ),
  climbStairs: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act("climbStairs", {
        count: 4,
        direction: pick("direction") ?? "up",
        ...S.set(pick, "pattern", "lead"),
      }),
    ),
  climbLadder: (
    _pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(a, S.chain().act("climbLadder", { ladder: "ladder" }), [
      // A fixed ladder 0.35 m ahead, its rungs facing the climber.
      HumanObject.prop("ladder", createLadder({ kind: "fixed" }), {
        at: { x: 0, y: 0, z: 0.35 },
        yaw: 180,
        fixed: true,
      }),
    ]),
  crawl: (
    _pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(a, S.chain().act("crawl", { cycles: 2 })),
  carry: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act("carry", {
        to: { x: 0, y: 0, z: 2.5 },
        how: pick("how") ?? "oneHand",
        load: 0.15,
        ...S.set(pick, "side"),
      }),
    ),
};
