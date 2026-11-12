import { Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanClearance } from "../compose/AutoMovieMotionHumanClearance";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { climbStairsFlight } from "./climbStairsFlight";

/**
 * Climbing a flight of stairs up or down from standing before its first
 * nosing, step over step (one foot per tread) or step by step (both feet on
 * each tread), ending with both feet on the last tread.
 *
 * The flight lies ahead along the heading: its first nosing `start` metres
 * ahead of the toes, `count` treads of `riser` and `tread` metres, rising for
 * `up` and falling below the floor for `down`. The goals are footprints: each
 * foot lands with the middle of its sole on the middle of its tread, at its
 * standing lateral place; a sole too long to keep `EDGE` from both edges
 * there hangs its heel over the nosing ascending and its toes over the next
 * one descending, as a long foot stands on a short tread, and on the landing
 * stands `EDGE` past the last nosing. A swinging foot
 * takes the shortest path over the flight that keeps every point of its sole
 * above the surface under it and `CLEARANCE` above each edge it passes
 * (`AutoMovieMotionHumanClearance`): ascending it lifts beside the riser and
 * follows the line of the nosings, descending it moves forward and lowers
 * once its heel is past the nosing. The pelvis moves between the stances on
 * minimum-jerk progress over the middle of the two feet. Its height at a
 * stance is the highest from which both legs reach their feet, so the lower
 * foot's leg is straight and the upper one's bent; it changes while a foot
 * swings and holds in double support, and is lowered wherever either leg,
 * planted or swinging, could not reach its foot.
 *
 * The cadence is 90 steps a minute (Mian, Narici, Minetti and Baltzopoulos
 * 2007, Gait Posture 26:463), scaled by the square root of the hip height
 * (Alexander 1984) and by the manner's tempo; each swing takes 0.8 of a step
 * and the double support the rest (provisional). Risers from 100 to 180 mm and
 * treads from 280 mm are the 2010 ADA ranges (504.2), the defaults 170 and
 * 280 mm; a riser above 0.35 of the hip height or a tread shorter than 0.6
 * of the foot is refused with the body's feasible range (provisional limits).
 * Events: `toeOff<n>` and `treadContact<n>` per step, numbered from 1.
 *
 * Not yet: handrail use (no `bar` affordance exists, A8), landing turns,
 * ramps and slopes, which belong to the walk on a sloped support.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the flight, the footprints, the swing rule, the timing with sources, the refusals and what is missing.
 * @evidence contracts/development/design.md#principled-representation A law record composed of one body row over a step schedule on one clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the constants, the plan and the surface height its capture reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The flight is the author's architecture; every footprint is read from it and the body's measure.
 */
export namespace climbStairs {
  /** The action's name. */
  export const name: HumanActionName = "climbStairs";

  /** Cancel table: the climb ends into standing or walking once both feet are on the last tread. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [
      { window: ["arrived", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
    walk: [
      { window: ["arrived", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
  };

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and default.
   * @evidence contracts/development/design.md#principled-representation The flight's architecture and the stepping pattern.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Seven members, all read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No footprint is typed; they follow from the flight.
   */
  export interface IParams extends climbStairsFlight.IStairs {
    /** One foot per tread, or both feet on each; `stepOverStep` when absent. */
    pattern?: "stepOverStep" | "stepByStep";

    /** The foot that steps first; `right` when absent. */
    lead?: "left" | "right";

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /** How far above an edge a swinging sole passes it, metres (provisional; the issue's 20 mm toe clearance is the bound the capture checks). */
  export const CLEARANCE: number = 0.05;

  /** The least distance along the flight a planted sole's heel and toe keep from an edge, metres (provisional). */
  export const EDGE: number = 0.025;

  /** Steps a minute (Mian et al. 2007). */
  export const CADENCE: number = 90;

  /** The share of a step the foot swings (provisional). */
  export const SWING: number = 0.8;

  /** A flight as the plan resolved it (`climbStairsFlight.IFlight`). */
  export type IFlight = climbStairsFlight.IFlight;

  /** The flight's surface height under a point (`climbStairsFlight.surface`). */
  export const surface = climbStairsFlight.surface;

  /** The flight a set of parameters describes (`climbStairsFlight.flight`). */
  export const flight = climbStairsFlight.flight;

  /**
   * Plan a climb.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When `flight` refuses the stairs.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const m = body.measure;
    const p: IParams = context.params;
    const lead: "left" | "right" = p.lead ?? "right";
    const trail: "left" | "right" = lead === "left" ? "right" : "left";
    const standing: IHumanPosture = stand
      .plan({ ...context, params: { seconds: 1 } })
      .posture(0);
    const yaw: number = standing.yaw;
    const stairs: IFlight = flight(body, standing, p);
    const sign: number = stairs.direction === "up" ? 1 : -1;
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);

    // Footprints: the sole on its tread at the standing lateral place.
    const flat = (side: "left" | "right"): HumanFoot.IPlacement => {
      const goal: IHumanPosture.IGoal = standing.limbs[`${side}Leg`]!;
      return {
        ankle: goal.point,
        rotation: goal.rotation ?? HumanFrame.turn(yaw),
      };
    };
    // The sole's heel, ball and toe about the ankle of a flat foot, along
    // the flight and in height.
    const sole = (
      side: "left" | "right",
    ): AutoMovieMotionHumanClearance.IPoint[] =>
      (["heel", "ball", "toe"] as const).map((point) => {
        const at: IAutoMovieVector3 = HumanFoot.point(
          body,
          side,
          point,
          flat(side),
        );
        return {
          z:
            HumanFrame.local(stairs.frame, at).z -
            HumanFrame.local(stairs.frame, flat(side).ankle).z,
          y: at.y - flat(side).ankle.y,
        };
      });
    const print = (side: "left" | "right", level: number): IPrint => {
      if (level === 0) return { placement: flat(side), level: 0 };
      const [heel, , toe] = sole(side);
      const length: number = toe!.z - heel!.z;
      const edge: number = stairs.first + (level - 1) * stairs.tread;
      // The last tread is the landing: it has no far edge to keep from.
      const heelAt: number =
        length <= stairs.tread - 2 * EDGE
          ? edge + (stairs.tread - length) / 2
          : level === stairs.count
            ? edge + EDGE
            : sign > 0
              ? edge - EDGE
              : edge + stairs.tread + EDGE - length;
      const ankle: IAutoMovieVector3 = flat(side).ankle;
      return {
        placement: {
          ankle: HumanFrame.point(stairs.frame, {
            x: HumanFrame.local(stairs.frame, ankle).x,
            y: ankle.y + sign * level * stairs.riser,
            z: heelAt - heel!.z,
          }),
          rotation: flat(side).rotation,
        },
        level,
      };
    };

    // The height asked of a swinging ankle along the flight: every sole
    // point on or above the surface under it, and `CLEARANCE` above an edge
    // it is passing.
    const profile = (z: number): number => {
      let height: number = surface(stairs, z);
      for (let i: number = 0; i < stairs.count; i++) {
        const edge: number = stairs.first + i * stairs.tread;
        if (Math.abs(z - edge) <= EDGE - 0.003)
          height = Math.max(
            height,
            Math.max(
              surface(stairs, edge - 0.001),
              surface(stairs, edge + 0.001),
            ) + CLEARANCE,
          );
      }
      return height;
    };
    const required =
      (side: "left" | "right") =>
      (z: number): number =>
        Math.max(...sole(side).map((s) => profile(z + s.z) - s.y));

    // The step schedule: which foot goes to which tread, in order.
    const steps: { side: "left" | "right"; level: number }[] = [];
    if ((p.pattern ?? "stepOverStep") === "stepOverStep") {
      for (let i: number = 1; i <= stairs.count; i++)
        steps.push({ side: i % 2 === 1 ? lead : trail, level: i });
      steps.push({
        side: stairs.count % 2 === 1 ? trail : lead,
        level: stairs.count,
      });
    } else
      for (let i: number = 1; i <= stairs.count; i++)
        steps.push({ side: lead, level: i }, { side: trail, level: i });

    // The clock: a step period per swing, the swing at its end, and a settle.
    const period: number = (60 / CADENCE) * Math.sqrt(m.hipHeight / 0.93);
    const instants: AutoMovieMotionClock.IInstant[] = [];
    steps.forEach((_, j: number): void => {
      instants.push(
        { name: `toeOff${j + 1}`, seconds: (j + 1 - SWING) * period },
        { name: `treadContact${j + 1}`, seconds: (j + 1) * period },
      );
    });
    instants.push({ name: "arrived", seconds: steps.length * period });
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.of((steps.length + 0.3) * period, instants),
      modifiers,
      { holds: [] },
    );
    const duration: number = clock.duration;

    // Each foot's prints in order, with the step that brings it there.
    const prints: Record<"left" | "right", { print: IPrint; step: number }[]> =
      {
        left: [{ print: print("left", 0), step: 0 }],
        right: [{ print: print("right", 0), step: 0 }],
      };
    steps.forEach((s, j: number): void => {
      prints[s.side].push({ print: print(s.side, s.level), step: j + 1 });
    });

    // The stances: both feet after each step, and the root over their
    // middle as high as both legs reach from it.
    const reached = (
      posture: IHumanPosture,
      feet: Record<"left" | "right", HumanFoot.IPlacement>,
    ): IAutoMovieVector3 =>
      resolveHumanPosture.lower(body, {
        ...posture,
        limbs: {
          ...posture.limbs,
          leftLeg: AutoMovieMotionHumanLeg.goal(
            body,
            posture,
            "left",
            feet.left,
            true,
          ),
          rightLeg: AutoMovieMotionHumanLeg.goal(
            body,
            posture,
            "right",
            feet.right,
            true,
          ),
        },
      }).root;
    const stance: IAutoMovieVector3[] = [standing.root];
    {
      const now: Record<"left" | "right", IPrint> = {
        left: print("left", 0),
        right: print("right", 0),
      };
      for (const s of steps) {
        now[s.side] = print(s.side, s.level);
        const root: IAutoMovieVector3 = stand.root(
          body,
          { left: now.left.placement.ankle, right: now.right.placement.ankle },
          yaw,
        );
        stance.push(
          reached(
            {
              ...standing,
              root: {
                ...root,
                y:
                  root.y +
                  Math.max(sign * now.left.level, sign * now.right.level) *
                    stairs.riser,
              },
            },
            { left: now.left.placement, right: now.right.placement },
          ),
        );
      }
    }

    // A swinging foot's path: the shortest one over the flight's profile,
    // travelled on minimum-jerk progress.
    const swing = (
      side: "left" | "right",
      a: HumanFoot.IPlacement,
      b: HumanFoot.IPlacement,
    ): ((s: number) => HumanFoot.IPlacement) => {
      const from: IAutoMovieVector3 = HumanFrame.local(stairs.frame, a.ankle);
      const to: IAutoMovieVector3 = HumanFrame.local(stairs.frame, b.ankle);
      const path = AutoMovieMotionHumanClearance.path(
        { z: from.z, y: a.ankle.y },
        { z: to.z, y: b.ankle.y },
        required(side),
      );
      return (s: number): HumanFoot.IPlacement => {
        const at = path(minimumJerk(Math.min(1, Math.max(0, s))).s);
        return {
          ankle: HumanFrame.point(stairs.frame, {
            x:
              from.x +
              ((to.x - from.x) * (at.z - from.z)) /
                Math.max(1e-9, to.z - from.z),
            y: at.y,
            z: at.z,
          }),
          rotation: b.rotation,
        };
      };
    };
    const swings: Record<
      "left" | "right",
      ((s: number) => HumanFoot.IPlacement)[]
    > = { left: [], right: [] };
    for (const side of ["left", "right"] as const)
      for (let i: number = 1; i < prints[side].length; i++)
        swings[side].push(
          swing(
            side,
            prints[side][i - 1]!.print.placement,
            prints[side][i]!.print.placement,
          ),
        );
    const footAt = (
      side: "left" | "right",
      seconds: number,
    ): { placement: HumanFoot.IPlacement; planted: boolean } => {
      const list = prints[side];
      for (let i: number = 1; i < list.length; i++) {
        const j: number = list[i]!.step;
        const off: number = clock.at(`toeOff${j}`);
        const on: number = clock.at(`treadContact${j}`);
        if (seconds < off)
          return { placement: list[i - 1]!.print.placement, planted: true };
        if (seconds < on)
          return {
            placement: swings[side][i - 1]!(
              clock.linear(`toeOff${j}`, `treadContact${j}`, seconds),
            ),
            planted: false,
          };
      }
      return { placement: list.at(-1)!.print.placement, planted: true };
    };
    const rootAt = (seconds: number): IAutoMovieVector3 => {
      for (let j: number = 1; j <= steps.length; j++) {
        const end: number = clock.at(`treadContact${j}`);
        if (seconds <= end) {
          const begin: number = j === 1 ? 0 : clock.at(`treadContact${j - 1}`);
          const u: number = minimumJerk(
            Math.min(1, Math.max(0, (seconds - begin) / (end - begin))),
          ).s;
          // The height changes while the foot swings: in double support
          // both planted legs hold it.
          const lift: number = minimumJerk(
            clock.linear(`toeOff${j}`, `treadContact${j}`, seconds),
          ).s;
          return {
            ...Vector3.lerp(stance[j - 1]!, stance[j]!, u),
            y: stance[j - 1]!.y + (stance[j]!.y - stance[j - 1]!.y) * lift,
          };
        }
      }
      return stance.at(-1)!;
    };

    const climb: IAutoMovieMotionHumanPrimitive = {
      channels: ["root", "leftLeg", "rightLeg"],
      from: 0,
      to: duration,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const placed: IHumanPosture = {
          ...posture,
          root: rootAt(seconds),
          yaw,
        };
        // The root stays where the swinging leg reaches its foot too, so
        // the foot keeps its clearing path.
        const feet = {
          left: footAt("left", seconds),
          right: footAt("right", seconds),
        };
        const root: IAutoMovieVector3 = reached(placed, {
          left: feet.left.placement,
          right: feet.right.placement,
        });
        // A swinging foot keeps its ball on the path: where the ankle's
        // range keeps the sole from lying flat (a deep step up), the heel
        // rises about the ball and the forefoot leads onto the tread.
        const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
        for (const side of ["left", "right"] as const)
          limbs[`${side}Leg`] = {
            ...AutoMovieMotionHumanLeg.goal(
              body,
              { root, yaw },
              side,
              feet[side].placement,
              feet[side].planted,
            ),
            contact: HumanFoot.offset(body, side, "mtp"),
          };
        return { ...placed, root, limbs };
      },
    };

    // Plant windows between each foot's swings, on the floor or on the flight.
    const contacts: IHumanContactWindow[] = [];
    for (const side of ["left", "right"] as const) {
      const list = prints[side];
      for (let i: number = 0; i < list.length; i++) {
        const from: number =
          i === 0 ? 0 : clock.at(`treadContact${list[i]!.step}`) / duration;
        const to: number =
          i + 1 < list.length
            ? clock.at(`toeOff${list[i + 1]!.step}`) / duration
            : 1;
        contacts.push({
          part: side === "left" ? "leftFoot" : "rightFoot",
          kind: "plant",
          from,
          to,
          support:
            list[i]!.print.level === 0
              ? { kind: "ground" }
              : { kind: "prop", subject: "stairs" },
        });
      }
    }

    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(duration, standing, contacts),
      clock,
      contact: "arrived",
      primitives: [climb],
    });
  }

  /** A footprint: the foot's placement and the tread it is on, 0 for the floor. */
  interface IPrint {
    placement: HumanFoot.IPlacement;
    level: number;
  }
}
