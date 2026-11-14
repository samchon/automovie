import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionKey } from "../HumanActionKey";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * A fall onto the floor on purpose from a stance: a goalkeeper's dive to
 * the side, or a sliding tackle forward on the hip.
 *
 * Every second the body is a set of joint angles blended from the entry's
 * toward the kind's (`SHAPES`, provisional), turned about one axis of its
 * own (the dive about its forward axis, so it lands on its side; the slide
 * about its lateral axis, leaning back), and placed with its root on a path:
 *
 * - `dive`: a crouch with the feet planted, then a flight whose hips move
 *   `REACH` statures to the side on a parabola `APEX` statures above the
 *   line from take-off to landing, the body turning a quarter about its
 *   forward axis on the way, then lying on its side where it landed. The
 *   flight is the one airborne part, on that one axis.
 * - `slide`: the body leans back and sinks onto its hip while its hips
 *   slide `REACH` statures forward and slowing to rest, the lead leg reaching
 *   ahead and the trailing one bent under, never off the floor.
 *
 * Landed, the root is placed so the lowest joint centre lies at the
 * ankle's standing height above the floor, as on the feet.
 *
 * Contact windows: the feet plant through the crouch; landed, the seat lies
 * on the floor (the hip) and, in a dive, the lower hand plants beside it.
 *
 * First pass: the take-off is not driven by the legs' push, the landing
 * does not absorb the fall through the arm, and a slide from a run starts
 * from the run's posture at rest, not its speed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two kinds, the root's path, the one airborne axis, the landing and the contacts, and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A shape of the joints, a turn about one body axis and a root path, with the landed body read off its own lowest point.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the shapes, four constants, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The flight turns about one axis only, as stated; no tumble is faked.
 */
export namespace dive {
  /** The action's name. */
  export const name: HumanActionKey = "dive";

  /** Cancel table: a dive or slide is left once it has come to rest. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    any: [{ window: ["landed", 1], kind: "inertialize", entry: 0 }],
  };

  /** The kinds. */
  export type Kind = "dive" | "slide";

  /** Each kind's joint angles at full extent, clinical degrees, for a dive to the performer's left; a dive to the right mirrors the arms (provisional). */
  export const SHAPES: Readonly<
    Record<
      Kind,
      Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>
    >
  > = {
    dive: {
      leftUpperArm: [0, 175, 0],
      rightUpperArm: [10, 160, 0],
      leftLowerArm: [10, 0, 0],
      rightLowerArm: [10, 0, 0],
      leftUpperLeg: [20, 10, 0],
      rightUpperLeg: [10, 0, 0],
      leftLowerLeg: [20, 0, 0],
      rightLowerLeg: [30, 0, 0],
    },
    slide: {
      spine: [-5, 0, 0],
      leftUpperLeg: [60, 0, 0],
      leftLowerLeg: [5, 0, 0],
      rightUpperLeg: [55, 0, 0],
      rightLowerLeg: [60, 0, 0],
      leftUpperArm: [-10, 30, 0],
      rightUpperArm: [-20, 30, 0],
      leftLowerArm: [60, 0, 0],
      rightLowerArm: [70, 0, 0],
    },
  };

  /** How far the hips joint travels, statures: to the side in a dive, ahead in a slide (provisional). */
  export const REACH: Readonly<Record<Kind, number>> = {
    dive: 0.8,
    slide: 0.7,
  };

  /** How high the dive's flight rises above its chord, statures (provisional). */
  export const APEX: number = 0.12;

  /** The turn about the kind's axis when landed, degrees (provisional): a quarter onto the side in a dive, leaning back in a slide. */
  export const TURN: Readonly<Record<Kind, number>> = { dive: 90, slide: -55 };

  /** Seconds of each phase (provisional): the crouch, the flight or the slide, and the rest on the floor. */
  export const PHASES: Readonly<
    Record<Kind, readonly [number, number, number]>
  > = { dive: [0.3, 0.45, 0.6], slide: [0.2, 0.8, 0.5] };

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The kind and, for a dive, its side.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Closed unions.
   */
  export interface IParams {
    /** A dive to the side or a slide forward; `dive` when absent. */
    kind?: Kind;

    /** The side a dive goes to; `left` when absent; unread by a slide. */
    side?: "left" | "right";
  }

  /**
   * Plan a dive or a slide.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the entry is not on both feet.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The crouch keeps the ankles where they stood; the flight's root is a parabola over the chord from take-off to the landed root, which is read off the landed body's lowest joint; the turn is about the one axis the kind names.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The shape, the landed root, the three phases, the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A body not on both feet is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two posture resolves at plan time and up to two per frame.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the posture resolver's heading and the entry's feet.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the landed root.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body = context.body;
    const kind: Kind = context.params.kind ?? "dive";
    const toLeft: number = (context.params.side ?? "left") === "left" ? 1 : -1;
    const feet = context.entry.feet;
    if (!(feet.left.planted && feet.right.planted))
      throw new HumanRefusal({
        kind: "base",
        axis: "base",
        value: "not on both feet",
        feasible: { kind: "alternatives", values: ["standing"] },
        reason: `a ${kind} starts from both feet on the floor`,
        fix: "stand before it",
      });
    const entry: IHumanPosture = context.entry.posture;
    const stature: number = body.measure.stature;
    const [crouch, travel, rest] = PHASES[kind];
    const ankles: IAutoMovieVector3 = {
      x: (feet.left.ankle.x + feet.right.ankle.x) / 2,
      y: (feet.left.ankle.y + feet.right.ankle.y) / 2,
      z: (feet.left.ankle.z + feet.right.ankle.z) / 2,
    };
    const frame: HumanFrame.IFrame = {
      origin: { x: 0, y: 0, z: 0 },
      yaw: entry.yaw,
    };
    const away: IAutoMovieVector3 = HumanFrame.point(
      frame,
      kind === "dive" ? { x: toLeft, y: 0, z: 0 } : { x: 0, y: 0, z: 1 },
    );

    // The joints a share of the way to the kind's shape, mirrored for a
    // dive to the right, turned about the kind's axis.
    const shape = (share: number, turn: number): IHumanPosture => {
      const joints: IHumanPosture["joints"] = { ...entry.joints };
      for (const [bone, angles] of Object.entries(SHAPES[kind]) as [
        AutoMovieHumanoidBone,
        readonly [number, number, number],
      ][]) {
        const mirrored: AutoMovieHumanoidBone =
          kind === "dive" && toLeft < 0
            ? ((bone.startsWith("left")
                ? bone.replace(/^left/, "right")
                : bone.replace(/^right/, "left")) as AutoMovieHumanoidBone)
            : bone;
        const was: readonly [number, number, number] = entry.joints[
          mirrored
        ] ?? [0, 0, 0];
        joints[mirrored] = [
          was[0] + (angles[0] - was[0]) * share,
          was[1] + (angles[1] - was[1]) * share,
          was[2] + (angles[2] - was[2]) * share,
        ];
      }
      return {
        ...entry,
        root: { x: 0, y: 0, z: 0 },
        joints,
        limbs: {},
        ...(kind === "dive"
          ? { roll: entry.roll - toLeft * turn }
          : { pitch: entry.pitch + turn }),
      };
    };
    const centres = (posture: IHumanPosture): IAutoMovieVector3[] =>
      [...poseBones(body, resolveHumanPosture(body, posture)).values()].map(
        (b) => b.worldPosition,
      );
    const ankleMid = (posture: IHumanPosture): IAutoMovieVector3 => {
      const bones = poseBones(body, resolveHumanPosture(body, posture));
      const l: IAutoMovieVector3 = bones.get("leftFoot")!.worldPosition;
      const r: IAutoMovieVector3 = bones.get("rightFoot")!.worldPosition;
      return { x: (l.x + r.x) / 2, y: (l.y + r.y) / 2, z: (l.z + r.z) / 2 };
    };

    // Take-off: crouched on the feet, a third of the way into the shape.
    const crouched = (share: number): IHumanPosture => {
      const posture: IHumanPosture = shape(share / 3, 0);
      const local: IAutoMovieVector3 = ankleMid(posture);
      return {
        ...posture,
        root: {
          x: ankles.x - local.x,
          y: ankles.y - local.y - 0.05 * stature * share,
          z: ankles.z - local.z,
        },
      };
    };
    const off: IAutoMovieVector3 = crouched(1).root;

    // Landed: the full shape, its lowest joint at the ankles' height, the
    // hips joint `REACH` statures from where it took off (the turn moves the
    // hips about the root, so the root is placed for the hips).
    const landedShape: IHumanPosture = shape(1, TURN[kind]);
    const lowest: number = Math.min(
      ...centres(landedShape).map((p: IAutoMovieVector3): number => p.y),
    );
    const hips = (posture: IHumanPosture): IAutoMovieVector3 =>
      poseBones(body, resolveHumanPosture(body, posture)).get("hips")!
        .worldPosition;
    const startHips: IAutoMovieVector3 = hips(crouched(1));
    const landedHips: IAutoMovieVector3 = hips(landedShape);
    const landed: IAutoMovieVector3 = {
      x: startHips.x + away.x * REACH[kind] * stature - landedHips.x,
      y: ankles.y - lowest,
      z: startHips.z + away.z * REACH[kind] * stature - landedHips.z,
    };

    const duration: number = crouch + travel + rest;
    const share = (seconds: number): number => seconds / duration;
    const contacts: IHumanContactWindow[] = [
      ...(["leftFoot", "rightFoot"] as const).map(
        (part: "leftFoot" | "rightFoot"): IHumanContactWindow => ({
          part,
          kind: "plant",
          from: 0,
          to: share(crouch),
          support: { kind: "ground" },
        }),
      ),
      {
        part: "seat",
        kind: "lie",
        from: share(kind === "dive" ? crouch + travel : crouch + 0.3 * travel),
        to: 1,
        support: { kind: "ground" },
      },
      ...(kind === "dive"
        ? [
            {
              part: toLeft > 0 ? ("leftHand" as const) : ("rightHand" as const),
              kind: "plant" as const,
              from: share(crouch + travel),
              to: 1,
              support: { kind: "ground" as const },
            },
          ]
        : []),
    ];
    return {
      duration,
      events: [
        { name: "takeOff", share: share(crouch) },
        { name: "landed", share: share(crouch + travel) },
      ],
      contacts,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        if (t <= crouch) return crouched(minimumJerk(t / crouch).s);
        if (t >= crouch + travel) return { ...landedShape, root: landed };
        const u: number = (t - crouch) / travel;
        const s: number = kind === "dive" ? u : minimumJerk(u).s;
        const posture: IHumanPosture = shape(
          1 / 3 + (2 / 3) * s,
          TURN[kind] * s,
        );
        const rise: number =
          kind === "dive" ? 4 * APEX * stature * u * (1 - u) : 0;
        return {
          ...posture,
          root: {
            x: off.x + (landed.x - off.x) * s,
            y: off.y + (landed.y - off.y) * s + rise,
            z: off.z + (landed.z - off.z) * s,
          },
        };
      },
    };
  }
}
