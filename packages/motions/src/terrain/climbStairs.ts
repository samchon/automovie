import { Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
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

/**
 * Climbing a flight of stairs up or down from standing before its first
 * nosing, step over step (one foot per tread) or step by step (both feet on
 * each tread), ending with both feet on the last tread.
 *
 * The flight lies ahead along the heading: its first nosing `start` metres
 * ahead of the toes, `count` treads of `riser` and `tread` metres, rising for
 * `up` and falling below the floor for `down`. The goals are footprints: each
 * foot lands with the middle of its sole on the middle of its tread, at its
 * standing lateral place. A swinging foot ascending lifts first and moves
 * forward once it is over the riser, so its toe does not catch the nosing it
 * stands against; descending it moves forward first and lowers once it is
 * past the nosing it leaves. Each lift overshoots its landing height by
 * `LIFT` (provisional; the issue's 20 mm toe clearance is the bound its
 * capture checks). The pelvis moves between the stances on minimum-jerk
 * progress, over the middle of the two feet at the mean of their heights,
 * lowered wherever a planted leg could not reach its foot.
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
    stand: [{ window: ["arrived", 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    walk: [{ window: ["arrived", 1], kind: "inertialize", entry: 0, blend: 0.3 }],
  };

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and default.
   * @evidence contracts/development/design.md#principled-representation The flight's architecture and the stepping pattern.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Seven members, all read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No footprint is typed; they follow from the flight.
   */
  export interface IParams {
    /** How many treads. */
    count: number;

    /** Each riser's height, metres; 0.17 when absent. */
    riser?: number;

    /** Each tread's depth, metres; 0.28 when absent. */
    tread?: number;

    /** Up the flight or down it; `up` when absent. */
    direction?: "up" | "down";

    /** One foot per tread, or both feet on each; `stepOverStep` when absent. */
    pattern?: "stepOverStep" | "stepByStep";

    /** The first nosing's distance ahead of the toes, metres; 0.05 when absent. */
    start?: number;

    /** The foot that steps first; `right` when absent. */
    lead?: "left" | "right";

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /** How far a swinging foot rises over its landing height, metres (provisional). */
  export const LIFT: number = 0.05;

  /** Steps a minute (Mian et al. 2007). */
  export const CADENCE: number = 90;

  /** The share of a step the foot swings (provisional). */
  export const SWING: number = 0.8;

  /**
   * The flight's surface height under a point, in the performer's floor
   * frame at the start (`z` forward from the toes' middle).
   *
   * @param flight The flight.
   * @param z Metres forward in that frame.
   * @returns The height of the floor, tread or landing there, metres.
   */
  export function surface(flight: IFlight, z: number): number {
    const sign: number = flight.direction === "up" ? 1 : -1;
    if (z < flight.first) return 0;
    const index: number = Math.min(
      flight.count,
      Math.floor((z - flight.first) / flight.tread) + 1,
    );
    return sign * index * flight.riser;
  }

  /**
   * A flight as the plan resolved it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation The flight in the performer's starting floor frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `surface` and the capture.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Plain numbers.
   */
  export interface IFlight {
    /** The frame: origin on the floor under the feet's middle, the heading. */
    frame: HumanFrame.IFrame;

    /** The first nosing's distance ahead in that frame, metres. */
    first: number;

    /** Treads. */
    count: number;

    /** Riser, metres. */
    riser: number;

    /** Tread, metres. */
    tread: number;

    /** Up or down. */
    direction: "up" | "down";
  }

  /**
   * The flight a set of parameters describes for a performer standing as
   * its entry has it.
   *
   * @param body The body.
   * @param posture The standing posture.
   * @param params The parameters.
   * @returns The flight.
   * @throws {Error} When the count is not a positive integer, or the riser or the tread is outside what the body can climb.
   */
  export function flight(
    body: IHumanBody,
    posture: IHumanPosture,
    params: IParams,
  ): IFlight {
    const m = body.measure;
    const riser: number = params.riser ?? 0.17;
    const tread: number = params.tread ?? 0.28;
    if (!(Number.isInteger(params.count) && params.count > 0))
      throw new Error("A flight has a positive whole number of treads");
    if (!(riser > 0 && riser <= 0.35 * m.hipHeight))
      throw new Error(
        `A riser of ${riser.toFixed(3)} m lies outside the 0 to ${(0.35 * m.hipHeight).toFixed(3)} m this body climbs`,
      );
    if (!(tread >= 0.6 * m.footLength))
      throw new Error(
        `A tread of ${tread.toFixed(3)} m is shorter than the ${(0.6 * m.footLength).toFixed(3)} m this body's foot needs`,
      );
    const yaw: number = posture.yaw;
    const feet = (["left", "right"] as const).map((side) => {
      const goal: IHumanPosture.IGoal = posture.limbs[`${side}Leg`]!;
      return {
        ankle: goal.point,
        toe: HumanFoot.point(body, side, "toe", {
          ankle: goal.point,
          rotation: goal.rotation ?? HumanFrame.turn(yaw),
        }),
      };
    });
    const origin: IAutoMovieVector3 = {
      x: (feet[0]!.ankle.x + feet[1]!.ankle.x) / 2,
      y: 0,
      z: (feet[0]!.ankle.z + feet[1]!.ankle.z) / 2,
    };
    const frame: HumanFrame.IFrame = { origin, yaw };
    const toe: number = Math.max(
      ...feet.map((f) => HumanFrame.local(frame, f.toe).z),
    );
    return {
      frame,
      first: toe + (params.start ?? 0.05),
      count: params.count,
      riser,
      tread,
      direction: params.direction ?? "up",
    };
  }

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
    const modifiers: AutoMovieMotionManner.IModifiers = AutoMovieMotionManner.of(
      context,
      p.manner,
    );

    // Footprints: the sole's middle on the tread's middle at the standing lateral place.
    const flat = (side: "left" | "right"): HumanFoot.IPlacement => {
      const goal: IHumanPosture.IGoal = standing.limbs[`${side}Leg`]!;
      return {
        ankle: goal.point,
        rotation: goal.rotation ?? HumanFrame.turn(yaw),
      };
    };
    const print = (side: "left" | "right", level: number): IPrint => {
      if (level === 0) return { placement: flat(side), level: 0 };
      const sole: IAutoMovieVector3 = HumanFoot.point(
        body,
        side,
        "sole",
        flat(side),
      );
      const local: IAutoMovieVector3 = HumanFrame.local(stairs.frame, sole);
      const at: IAutoMovieVector3 = HumanFrame.point(stairs.frame, {
        x: local.x,
        y: sole.y + sign * level * stairs.riser,
        z: stairs.first + (level - 0.5) * stairs.tread,
      });
      return {
        placement: HumanFoot.pivot(
          body,
          side,
          "sole",
          at,
          HumanFoot.heading(flat(side).rotation),
          0,
        ),
        level,
      };
    };

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
      AutoMovieMotionClock.of(
        (steps.length + 0.3) * period,
        instants,
      ),
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

    // The stances: both feet after each step, and the root over them.
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
        stance.push({
          ...root,
          y:
            root.y +
            (sign * (now.left.level + now.right.level) * stairs.riser) / 2,
        });
      }
    }

    // A swinging foot's path: ascending it rises before it moves forward,
    // descending it moves forward before it lowers.
    const swing = (
      a: HumanFoot.IPlacement,
      b: HumanFoot.IPlacement,
      s: number,
    ): HumanFoot.IPlacement => {
      const mj = (from: number, to: number): number =>
        minimumJerk(Math.min(1, Math.max(0, (s - from) / (to - from)))).s;
      const top: number = Math.max(a.ankle.y, b.ankle.y) + LIFT;
      const y: number =
        b.ankle.y >= a.ankle.y
          ? a.ankle.y + (top - a.ankle.y) * mj(0, 0.5) - (top - b.ankle.y) * mj(0.75, 1)
          : a.ankle.y + (top - a.ankle.y) * mj(0, 0.25) - (top - b.ankle.y) * mj(0.45, 1);
      const along: number = b.ankle.y >= a.ankle.y ? mj(0.3, 0.9) : mj(0.1, 0.7);
      const ankle: IAutoMovieVector3 = Vector3.lerp(a.ankle, b.ankle, along);
      return { ankle: { ...ankle, y }, rotation: b.rotation };
    };
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
            placement: swing(
              list[i - 1]!.print.placement,
              list[i]!.print.placement,
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
          return Vector3.lerp(stance[j - 1]!, stance[j]!, u);
        }
      }
      return stance.at(-1)!;
    };

    const climb: IAutoMovieMotionHumanPrimitive = {
      channels: ["root", "leftLeg", "rightLeg"],
      from: 0,
      to: duration,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const placed: IHumanPosture = { ...posture, root: rootAt(seconds), yaw };
        const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
        for (const side of ["left", "right"] as const) {
          const foot = footAt(side, seconds);
          limbs[`${side}Leg`] = AutoMovieMotionHumanLeg.goal(
            body,
            placed,
            side,
            foot.placement,
            foot.planted,
          );
        }
        return resolveHumanPosture.lower(body, { ...placed, limbs });
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
