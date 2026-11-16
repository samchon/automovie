import { Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import type { tags } from "typia";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import type { HumanUnit } from "../law/HumanUnit";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanLadder } from "./HumanLadder";

/**
 * Climbing a vertical fixed ladder from the floor before it, in the
 * four-beat ipsilateral pattern: right hand, right foot, left hand, left
 * foot, one limb moving at a time, so three limbs always hold the ladder
 * (Jensen and Holland 2020, Int J Environ Res Public Health 17:2897).
 *
 * The goals are rungs: the ladder is a prop of the scene, a fixture
 * (`IHumanProp.fixed`) that the hands grip and never carry, and its rungs are
 * its own `rung1` upward (`createLadder`'s affordances), read where the
 * ladder stands at the action's start. The rungs' spacing must lie in OSHA
 * 1910.23(b)(2)'s 25 to 36 cm and their line be upright; the climber stands
 * before the ladder, facing it within `FACING` degrees, the toes within
 * `NEAR` of the rungs and between the rails. A ladder that is no fixture,
 * leans, has too few rungs above the hands, or one the climber stands away
 * from, is refused. Each foot stands with its ball on a rung's top,
 * and each hand grips a rung (Jensen and Holland found rungs used in 59 of
 * 80 tasks) at the rung nearest the shoulder's height above the feet. First
 * both hands reach their rungs, then every beat moves one limb up one rung:
 * a foot on a minimum-jerk arc that clears the rung below by `CLEARANCE`, a
 * hand on a minimum-jerk path. The pelvis stays `BACK` leg lengths behind
 * the rungs and rises with the feet, lowered wherever a planted leg could
 * not reach. Each beat takes `BEAT` seconds (provisional), scaled by the
 * manner's tempo. Events: `handsOn`, then per beat `<limb>Release<n>` and
 * `<limb>Contact<n>`, the limb one of `rightHand`, `rightFoot`, `leftHand`,
 * `leftFoot`.
 *
 * Not yet: the two-beat patterns, rail grips, climbing down, the top-out,
 * and hanging, traversing, mantling and vaulting (the rest of #3238); the
 * A8 `bar` and `ledge` kinds the core owns.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the pattern with its source, the ladder's geometry and band, the holds, the timing, the events and what is missing.
 * @evidence contracts/development/design.md#principled-representation A law record of one whole-body row over a beat schedule on one clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the constants, the rung geometry and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The ladder is the author's architecture; every hold follows from it and the body's measure.
 */
export namespace climbLadder {
  /** The action's name. */
  export const name: HumanActionName = "climbLadder";

  /** Cancel table: none yet; the climber holds the ladder at the end. */
  export const interrupts: IHumanActionLaw["interrupts"] = {};

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and default.
   * @evidence contracts/development/design.md#principled-representation The ladder as the scene's prop, and how far to climb.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No hold is typed.
   */
  export interface IParams {
    /** The ladder's prop subject: a fixture whose rungs are its `rung1` upward. */
    ladder: string;

    /** How many rungs the feet climb; 3 when absent. */
    rungs?: number & tags.Type<"uint32"> & tags.Minimum<1> & HumanUnit<"">;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /** One beat's seconds (provisional). */
  export const BEAT: number = 0.8;

  /** How far a swinging foot clears its path's straight line, metres (provisional). */
  export const CLEARANCE: number = 0.06;

  /** How far the hip joints stay behind the rungs, in leg lengths (provisional). */
  export const BACK: number = 0.35;

  /** The most the climber's heading may differ from facing the ladder, degrees (provisional). */
  export const FACING: number = 30;

  /** The farthest the toes may stand from the rungs, metres (provisional): a step from the ladder. */
  export const NEAR: number = 0.5;

  /** The beat order of the four-beat ipsilateral pattern. */
  export const ORDER: readonly Limb[] = [
    "rightHand",
    "rightFoot",
    "leftHand",
    "leftFoot",
  ];

  /** A limb of the climb. */
  export type Limb = "leftHand" | "rightHand" | "leftFoot" | "rightFoot";

  /** A ladder as the plan resolved it (`HumanLadder.ILadder`). */
  export type ILadder = HumanLadder.ILadder;

  /** A rung's centre at a lateral place (`HumanLadder.rung`). */
  export const rung: typeof HumanLadder.rung = HumanLadder.rung;

  /** A rung's radius when the ladder declares none (`HumanLadder.RUNG`). */
  export const RUNG: number = HumanLadder.RUNG;

  /**
   * Plan a ladder climb.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the ladder is no fixture, leans, spaces its rungs outside the OSHA band or has too few above the hands, the climber does not stand before it facing it, or the rung count is not a positive integer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The namespace gives the four-beat pattern, rung geometry, timing and refusals; this entry prepares the fixed supports and limb clocks.
   * @evidence contracts/development/implementation.md#principled-implementation Preserves each original minimum-jerk limb move and rung contact, the pelvis height and lowering, and initial hand reach from the entry arms.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Body/ladder admission precedes fixed footprint/handhold preparation and per-limb beat arrays; separate support and arm primitives let root/leg demand omit arm work.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The authored rung count, beat order, clearance, approach bounds and contact windows retain their original formulas.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear preparation/storage in climbed rungs; fixed foot rotations/socket offsets, adjacent-footprint quaternion arcs and directional heading prepare once. Each pose uses four logarithmic limb lookups and the original fixed-size lowering and hand/leg goal computations.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed body, still base and ladder share rung geometry, foot-placement/arc preparation, root line and entry arms. A completed two-foot contact state shares its exact root/leg goals, and a stationary hand at that state shares its exact rung goal; a moving foot or hand always recomputes its dependent result.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Plan-owned rung/beat arrays and completed support/hand contact states grow with the authored beat sequence and release with the plan; arbitrary queried seconds are not retained.
   */
  export function plan(context: IHumanActionContext<IParams>): IPlan {
    const body: IHumanBody = context.body;
    const m: IHumanBody["measure"] = body.measure;
    const count: number = context.params.rungs ?? 3;
    HumanBound.whole("rungs", count);
    const ladder: ILadder = HumanLadder.of(context, context.params.ladder);
    const spacing: number = ladder.spacing;
    const frame: HumanFrame.IFrame = ladder.frame;
    const yaw: number = frame.yaw;
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);
    const standing: IHumanPosture = stand
      .plan({ ...context, params: { seconds: 1 } })
      .posture(0);
    const flatOf: (side: "left" | "right") => HumanFoot.IPlacement = (side: "left" | "right"): HumanFoot.IPlacement => {
      const goal: IHumanPosture.IGoal = standing.limbs[`${side}Leg`]!;
      return {
        ankle: goal.point,
        rotation: goal.rotation ?? HumanFrame.turn(standing.yaw),
      };
    };
    const flats: Record<"left" | "right", HumanFoot.IPlacement> = {
      left: flatOf("left"), right: flatOf("right"),
    };
    const flat: (side: "left" | "right") => HumanFoot.IPlacement = (side: "left" | "right"): HumanFoot.IPlacement => flats[side];

    // The climber stands before the ladder, facing it, the toes near the
    // rungs and the feet between the rails.
    const turned: number = Math.abs(
      ((((standing.yaw - yaw) % 360) + 540) % 360) - 180,
    );
    HumanBound.within("facing", turned, 0, FACING, "degrees");
    const toe: number = Math.max(
      ...(["left", "right"] as const).map(
        (side: "left" | "right"): number =>
          HumanFrame.local(
            frame,
            HumanFoot.point(body, side, "toe", flat(side)),
          ).z,
      ),
    );
    HumanBound.within("toes", -toe, 0, NEAR, "m");
    const laterals: Record<"left" | "right", number> = {
      left: HumanFrame.local(frame, flats.left.ankle).x,
      right: HumanFrame.local(frame, flats.right.ankle).x,
    };
    const lateral: (side: "left" | "right") => number = (side: "left" | "right"): number => laterals[side];
    HumanBound.within(
      "beside",
      Math.abs((lateral("left") + lateral("right")) / 2),
      0,
      ladder.width / 2,
      "m",
    );
    const reach: number = Math.round(
      (m.shoulderHeight - 0.5 * m.upperArm) / spacing,
    );
    HumanBound.within("rungs", reach + count, 1, ladder.count, "");

    // A foot's placement on a rung: the ball on the rung's top.
    const onRung: Record<"left" | "right", ReturnType<typeof HumanFoot.prepareAt>> = {
      left: HumanFoot.prepareAt(body, "left", "ball", HumanFoot.heading(flats.left.rotation), 0),
      right: HumanFoot.prepareAt(body, "right", "ball", HumanFoot.heading(flats.right.rotation), 0),
    };
    const footOn: (side: "left" | "right", index: number) => HumanFoot.IPlacement = (
      side: "left" | "right",
      index: number,
    ): HumanFoot.IPlacement =>
      index === 0
        ? flat(side)
        : onRung[side](
            Vector3.add(rung(ladder, index, lateral(side)), {
              x: 0,
              y: ladder.radius,
              z: 0,
            }),
          );
    const footprints: Record<"left" | "right", HumanFoot.IPlacement[]> = {
      left: Array.from({ length: count + 1 }, (_: unknown, i: number): HumanFoot.IPlacement => footOn("left", i)),
      right: Array.from({ length: count + 1 }, (_: unknown, i: number): HumanFoot.IPlacement => footOn("right", i)),
    };
    const footArcs: Record<"left" | "right", ReturnType<typeof AutoMovieMotionHumanLeg.prepareArc>[]> = {
      left: footprints.left.slice(1).map((to: HumanFoot.IPlacement, i: number): ReturnType<typeof AutoMovieMotionHumanLeg.prepareArc> => AutoMovieMotionHumanLeg.prepareArc(footprints.left[i]!, to, CLEARANCE)),
      right: footprints.right.slice(1).map((to: HumanFoot.IPlacement, i: number): ReturnType<typeof AutoMovieMotionHumanLeg.prepareArc> => AutoMovieMotionHumanLeg.prepareArc(footprints.right[i]!, to, CLEARANCE)),
    };
    const handholds: Record<"left" | "right", IAutoMovieVector3[]> = {
      left: Array.from({ length: count + 1 }, (_: unknown, i: number): IAutoMovieVector3 => rung(ladder, reach + i, lateral("left"))),
      right: Array.from({ length: count + 1 }, (_: unknown, i: number): IAutoMovieVector3 => rung(ladder, reach + i, lateral("right"))),
    };
    const direction: HumanFrame.IFrame = { origin: { x: 0, y: 0, z: 0 }, yaw };
    const directional: HumanFrame.IPrepared = HumanFrame.prepare(direction);
    const normal: IAutoMovieVector3 = HumanFrame.point(direction, { x: 0, y: 0, z: -1 });
    const hands: Record<"left" | "right", ReturnType<typeof AutoMovieMotionHumanTarget.prepareHand>> = {
      left: AutoMovieMotionHumanTarget.prepareHand(body, "left", normal, { surface: "grip", shape: "relaxed", curl: 50 }),
      right: AutoMovieMotionHumanTarget.prepareHand(body, "right", normal, { surface: "grip", shape: "relaxed", curl: 50 }),
    };
    const rootAlong: IAutoMovieVector3 = HumanFrame.point(frame, {
      x: 0, y: 0, z: ladder.ahead - BACK * (m.thigh + m.shank),
    });
    const entryArms: Parameters<typeof AutoMovieMotionHumanArm.carry>[2] = {
      left: AutoMovieMotionHumanArm.angles(context.entry.pose, "left"),
      right: AutoMovieMotionHumanArm.angles(context.entry.pose, "right"),
    };

    // The schedule: hands on, then four beats a rung.
    const beat: number = BEAT * modifiers.tempo;
    const instants: AutoMovieMotionClock.IInstant[] = [
      { name: "handsOn", seconds: beat },
    ];
    const moves: Record<Limb, { n: number; from: number; to: number }[]> = {
      leftHand: [], rightHand: [], leftFoot: [], rightFoot: [],
    };
    for (let k: number = 1; k <= count; k++)
      ORDER.forEach((limb: Limb, i: number): void => {
        const from: number = beat * (1 + (k - 1) * 4 + i);
        moves[limb].push({ n: k, from, to: from + beat });
        instants.push(
          { name: `${limb}Release${k}`, seconds: from },
          { name: `${limb}Contact${k}`, seconds: from + beat },
        );
      });
    const duration: number = beat * (2 + count * 4);
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(
      duration,
      instants,
    );
    const reaching: (seconds: number) => number = AutoMovieMotionClock.prepare(clock, "start", "handsOn").progress;

    // Where a limb is at a second: its rung index (fractional while moving).
    function level(
      limb: Limb,
      seconds: number,
    ): { index: number; from: number; u: number; moving: boolean } {
      const base: number = limb.endsWith("Hand") ? reach : 0;
      const own: (typeof moves)[Limb] = moves[limb];
      let low: number = 0;
      let high: number = own.length;
      while (low < high) {
        const middle: number = (low + high) >>> 1;
        if (seconds >= own[middle]!.to) low = middle + 1;
        else high = middle;
      }
      const move: (typeof own)[number] | undefined = own[low];
      if (move !== undefined && seconds > move.from)
        return {
          index: base + move.n,
          from: base + move.n - 1,
          u: minimumJerk.share((seconds - move.from) / (move.to - move.from)),
          moving: true,
        };
      const index: number = base + (own[low - 1]?.n ?? 0);
      return { index, from: index, u: 1, moving: false };
    }

    // The support primitive writes first over a still base, so two planted rung
    // indices fix every input of the root lowering and leg-goal geometry.
    const supports: Map<string, Pick<IHumanPosture, "root" | "limbs">> = new Map();
    const heldArms: Record<"left" | "right", Map<string, IHumanPosture.IGoal>> = {
      left: new Map(), right: new Map(),
    };
    function stance(
      posture: IHumanPosture,
      feet: Record<"left" | "right", HumanFoot.IPlacement>,
      levels: Record<"left" | "right", ReturnType<typeof level>>,
    ): IHumanPosture {
      const key: string | undefined = levels.left.moving || levels.right.moving
        ? undefined : `${levels.left.index}:${levels.right.index}`;
      const held: Pick<IHumanPosture, "root" | "limbs"> | undefined = key === undefined ? undefined : supports.get(key);
      if (held !== undefined) return { ...posture, root: { ...held.root }, yaw, limbs: structuredClone(held.limbs) };
      const rise: number = (feet.left.ankle.y + feet.right.ankle.y) / 2 - m.ankleHeight;
      const root: IAutoMovieVector3 = { ...rootAlong, y: rise - stand.DROP };
      const placed: IHumanPosture = { ...posture, root, yaw };
      const limbs: IHumanPosture["limbs"] = {};
      for (const side of ["left", "right"] as const)
        limbs[`${side}Leg`] = AutoMovieMotionHumanLeg.goal(body, placed, side, feet[side], !levels[side].moving);
      const lowered: IHumanPosture = resolveHumanPosture.lower(body, { ...placed, limbs });
      if (key !== undefined) supports.set(key, { root: { ...lowered.root }, limbs: structuredClone(lowered.limbs) });
      return { ...lowered, root: { ...lowered.root }, limbs: structuredClone(lowered.limbs) };
    }

    const climb: IAutoMovieMotionHumanPrimitive = {
      channels: ["root", "leftLeg", "rightLeg"],
      reads: ["root", "trunk", "leftLeg", "rightLeg"],
      from: 0,
      to: duration,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const feet: Record<"left" | "right", HumanFoot.IPlacement> = {
          left: flat("left"),
          right: flat("right"),
        };
        const footLevels: Record<"left" | "right", ReturnType<typeof level>> = {
          left: level("leftFoot", seconds), right: level("rightFoot", seconds),
        };
        for (const side of ["left", "right"] as const) {
          const at: ReturnType<typeof level> = footLevels[side];
          const b: HumanFoot.IPlacement = footprints[side][at.index]!;
          feet[side] = at.moving
            ? (() => {
                const out: HumanFoot.IPlacement = footArcs[side][at.index - 1]!(at.u);
                // Move back off the rungs and in again so the toe clears them.
                return {
                  ...out,
                  ankle: Vector3.add(
                    out.ankle,
                    directional.point(
                      {
                        x: 0,
                        y: 0,
                        z: -2 * CLEARANCE * Math.sin(Math.PI * at.u),
                      },
                    ),
                  ),
                };
              })()
            : b;
        }

        return stance(posture, feet, footLevels);
      },
    };
    const arms: IAutoMovieMotionHumanPrimitive = {
      channels: ["leftArm", "rightArm"],
      reads: (seconds: number): readonly AutoMovieMotionHumanChannel[] =>
        reaching(seconds) >= 1
          ? ["root", "trunk", "leftArm", "rightArm"]
          : AutoMovieMotionHumanChannel.ORDER,
      from: 0,
      to: duration,
      write: (lowered: IHumanPosture, seconds: number): IHumanPosture => {
        const footLevels: Record<"left" | "right", ReturnType<typeof level>> = {
          left: level("leftFoot", seconds), right: level("rightFoot", seconds),
        };
        const limbs: IHumanPosture["limbs"] = { ...lowered.limbs };

        // Each hand grips its rung, reaching it from where it hung at first.
        const reachShare: number = reaching(seconds);
        for (const side of ["left", "right"] as const) {
          const at: ReturnType<typeof level> = level(`${side}Hand`, seconds);
          const key: string | undefined = at.moving || footLevels.left.moving || footLevels.right.moving
            ? undefined : `${footLevels.left.index}:${footLevels.right.index}:${at.index}`;
          const held: IHumanPosture.IGoal | undefined = key === undefined ? undefined : heldArms[side].get(key);
          if (held !== undefined) { limbs[`${side}Arm`] = structuredClone(held); continue; }
          const grip: IAutoMovieVector3 = Vector3.lerp(
            handholds[side][at.from - reach]!,
            handholds[side][at.index - reach]!,
            at.u,
          );
          const lifted: IAutoMovieVector3 = at.moving
            ? Vector3.add(
                grip,
                directional.point(
                  { x: 0, y: 0, z: -0.08 * Math.sin(Math.PI * at.u) },
                ),
              )
            : grip;
          const target: ReturnType<typeof AutoMovieMotionHumanTarget.hand> = hands[side](lowered, lifted);
          limbs[`${side}Arm`] = AutoMovieMotionHumanArm.goal(
            body,
            side,
            target,
          );
          if (key !== undefined) heldArms[side].set(key, structuredClone(limbs[`${side}Arm`]!));
        }
        const gripped: IHumanPosture = {
          ...lowered,
          limbs: {
            ...lowered.limbs,
            leftArm: limbs.leftArm!,
            rightArm: limbs.rightArm!,
          },
        };
        if (reachShare >= 1) return gripped;
        return AutoMovieMotionHumanArm.carry(
          body,
          gripped,
          entryArms,
          reachShare,
        );
      },
    };

    // Contact windows between each limb's moves.
    const contacts: IHumanContactWindow[] = [];
    for (const limb of ORDER) {
      const own: (typeof moves)[Limb] = moves[limb];
      const hand: boolean = limb.endsWith("Hand");
      let from: number = hand ? beat : 0;
      for (let i: number = 0; i <= own.length; i++) {
        const to: number = i < own.length ? own[i]!.from : duration;
        contacts.push({
          part: limb,
          kind: hand ? "grip" : "plant",
          from: from / duration,
          to: to / duration,
          support:
            !hand && i === 0
              ? { kind: "ground" }
              : { kind: "prop", subject: context.params.ladder },
        });
        if (i < own.length) from = own[i]!.to;
      }
    }

    return {
      ...composeAutoMovieMotionHumanAction({
        base: AutoMovieMotionHumanBase.still(duration, standing, contacts),
        clock,
        contact: "handsOn",
        primitives: [climb, arms],
      }),
      ladder,
    };
  }

  /** A climb's plan: an action plan with the ladder it resolved. */
  export interface IPlan extends IHumanActionPlan {
    /** The ladder. */
    ladder: ILadder;
  }
}
