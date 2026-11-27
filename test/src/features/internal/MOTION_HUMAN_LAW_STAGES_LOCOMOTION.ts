import { AutoMovieArchetypeLadder } from "@automovie/archetypes";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";

import { motionHumanLawSweep } from "./motionHumanLawSweep";

const S: typeof motionHumanLawSweep = motionHumanLawSweep;

/** The everyday captures' box to step over is 0.3 m high and 0.25 m deep, with its near side 0.35 m ahead and facing the performer. It has the `edge` and `top` contacts of `AutoMovieArchetypeKerb.create` at a height outside the kerb band. */
const box: IAutoMovieMotionHumanProp = {
  subject: "box",
  frame: {
    position: { x: 0, y: 0, z: 0.6 },
    rotation: { x: 0, y: 1, z: 0, w: 0 },
  },
  points: {},
  affordances: [
    {
      id: "edge",
      kind: "ledge",
      frame: {
        translation: { x: 0, y: 0.3, z: 0.25 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
      extent: null,
    },
    {
      id: "top",
      kind: "surface",
      frame: {
        translation: { x: 0, y: 0.3, z: 0.125 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
      extent: null,
      depth: 0.25,
    },
  ],
};

/**
 * The stages of the laws that carry the body over the ground: standing,
 * walking, running, jumping, approaching a person, stepping over a box,
 * stairs, a ladder, crawling, carrying a load and moving a heavy one by its
 * handles.
 *
 * Every distance is the body's own or a plain staging choice: a walk of 3 m
 * and a run of 6 m straight ahead, a standing jump of 0.6 hip heights, a
 * partner 3 m ahead to approach, the 0.3 m box of the everyday captures, four
 * stairs, the carry captures' load of 0.15 carried 2.5 m, and a crate with
 * handles at the elbow's height 0.55 m ahead (behind for a drag), pushed or
 * dragged 2.5 m or pulled 2 m back.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the family and every staging distance.
 * @evidence contracts/development/design.md#principled-representation One stage per law, keyed by the law's name, each asking the row for the parameters it can set.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Eleven laws, the ones whose intent is travel.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row is special-cased; a parameter is passed under its own name.
 */
export const MOTION_HUMAN_LAW_STAGES_LOCOMOTION: Readonly<
  Record<string, motionHumanLawSweep.Stage>
> = {
  stand: (
    _pick: motionHumanLawSweep.Pick,
    a: IAutoMovieMotionHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(a, S.chain().act("stand", { hold: 2 })),
  walk: (
    pick: motionHumanLawSweep.Pick,
    a: IAutoMovieMotionHumanBody,
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
    a: IAutoMovieMotionHumanBody,
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
    a: IAutoMovieMotionHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act("jump", {
        to: { x: 0, y: 0, z: 0.6 * a.measure.hipHeight },
      }),
    ),
  approach: (
    pick: motionHumanLawSweep.Pick,
    a: IAutoMovieMotionHumanBody,
    b: IAutoMovieMotionHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.duo(a, b, 3, [
      S.chain().act("approach", {
        target: S.person("b", "sternum"),
        at: pick("at") ?? "personal",
        ...S.set(pick, "from"),
      }),
      S.chain("b").act("stand", { hold: 8, sway: 0 }),
    ]),
  stepOver: (
    pick: motionHumanLawSweep.Pick,
    a: IAutoMovieMotionHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act("stepOver", {
        obstacle: "box",
        ...S.set(pick, "lead"),
      }),
      [box],
    ),
  climbStairs: (
    pick: motionHumanLawSweep.Pick,
    a: IAutoMovieMotionHumanBody,
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
    a: IAutoMovieMotionHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(a, S.chain().act("climbLadder", { ladder: "ladder" }), [
      // A fixed ladder 0.35 m ahead, its rungs facing the climber.
      HumanObject.prop("ladder", AutoMovieArchetypeLadder.create({ kind: "fixed" }), {
        at: { x: 0, y: 0, z: 0.35 },
        yaw: 180,
        fixed: true,
      }),
    ]),
  crawl: (
    _pick: motionHumanLawSweep.Pick,
    a: IAutoMovieMotionHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(a, S.chain().act("crawl", { count: 2 })),
  carry: (
    pick: motionHumanLawSweep.Pick,
    a: IAutoMovieMotionHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act("carry", {
        to: { x: 0, y: 0, z: 2.5 },
        kind: pick("kind") ?? "oneHand",
        load: 0.15,
        ...S.set(pick, "hand"),
      }),
    ),
  pushPull: (
    pick: motionHumanLawSweep.Pick,
    a: IAutoMovieMotionHumanBody,
  ): motionHumanLawSweep.IScene => {
    const way: "push" | "pull" | "drag" = (pick("way") ?? "push") as
      | "push"
      | "pull"
      | "drag";
    return S.solo(
      a,
      S.chain().act("pushPull", {
        prop: "crate",
        way,
        to: { x: 0, y: 0, z: way === "pull" ? -2 : 2.5 },
        ...S.set(pick, "load"),
      }),
      [crate(a, way === "drag" ? -0.55 : 0.55)],
    );
  },
};

/** A crate on the floor `ahead` metres along +Z, with two handles 0.5 m apart at the performer's elbow height (the shoulder's height less the upper arm). */
function crate(
  a: IAutoMovieMotionHumanBody,
  ahead: number,
): IAutoMovieMotionHumanProp {
  return {
    subject: "crate",
    frame: {
      position: { x: 0, y: 0, z: ahead },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    points: {},
    affordances: (["left", "right"] as const).map((id) => ({
      id,
      kind: "handle" as const,
      frame: {
        translation: {
          x: id === "left" ? 0.25 : -0.25,
          y: a.measure.shoulderHeight - a.measure.upperArm,
          z: 0,
        },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
      extent: null,
    })),
  };
}
