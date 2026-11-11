import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanGoal } from "../compose/AutoMovieMotionHumanGoal";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";

/**
 * The fighting stance taken and held: from whatever the performer stands in,
 * each foot steps to its stance place in turn (the rear foot first, so the
 * lead foot stays a support), the root sinks until both knees soften and
 * turns to the stance heading, and the gloves come up to the guard, then the
 * stance holds with a light bounce through the knees.
 *
 * The stance itself is {@link StrikingStance}: measured on the body, so any
 * stature takes its own. A foot already within 1 cm of its place stays
 * planted. The line faces the `facing` target when one is given (read at
 * the start), otherwise it keeps the entry's line: a performer already in a
 * stance keeps its line, and one standing square faces straight ahead.
 *
 * The bounce: kickboxers keep a rhythmic bounce between exchanges; its
 * height is a third of the stance's sink and its rate two bounces a second,
 * provisional readings of coaching footage (the kickboxing research's
 * rhythm share) with no located measurement.
 *
 * The action is rows over the entry's posture: one clock with the feet's
 * landings and the `set` instant, a stance row that carries the root, the
 * trunk and the two legs together (the root is lowered onto the planted
 * feet, so the three are one movement), and an arm row that raises the
 * gloves. The manner's tempo scales the time the stance takes to set and
 * its extent scales the bounce.
 */
export namespace guard {
  /** The action's name. */
  export const name: HumanActionName = "guard";

  /** Cancel table: from a guard every striking action may start at any time. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    guard: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.15 }],
    punch: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.1 }],
    kick: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.1 }],
    defend: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.1 }],
    step: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.1 }],
  };

  /** Parameters. */
  export interface IParams {
    /** How long, seconds; 1 when absent and at least the time the stance takes to set. */
    seconds?: number;

    /** Which side leads; the entry's leading side when absent. */
    stance?: "orthodox" | "southpaw";

    /** What to face; the entry's line when absent. */
    facing?: AutoMovieMotionTarget;

    /** How it is performed: the tempo scales the setting, the extent the bounce. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /** Seconds to step into the stance at a neutral manner. */
  export const SET: number = 0.6;

  /** Bounce rate, per second (provisional). */
  export const BOUNCE_RATE: number = 2;

  /** The bounce's fade before the end, seconds. */
  export const FADE: number = 0.2;

  /**
   * Plan a guard.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the manner is out of range.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    const set: number = SET * modifiers.tempo;
    const duration: number = Math.max(set, p.seconds ?? 1);
    const body = context.body;
    const entry: IHumanPosture = context.entry.posture;
    const lead: "left" | "right" =
      p.stance === undefined
        ? StrikingTarget.lead(context.entry)
        : p.stance === "orthodox"
          ? "left"
          : "right";
    const rear: "left" | "right" = lead === "left" ? "right" : "left";

    // The rear foot swings first and the lead foot follows, overlapping it.
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(
      duration,
      [
        { name: "leadUp", seconds: (0.25 / SET) * set },
        { name: "rearDown", seconds: (0.3 / SET) * set },
        { name: "leadDown", seconds: (0.55 / SET) * set },
        { name: "set", seconds: set },
        { name: "stroke", seconds: set },
        { name: "relax", seconds: Math.max(set, duration - FADE) },
      ],
    );
    const START: string = AutoMovieMotionClock.START;
    const END: string = AutoMovieMotionClock.END;
    const swing: Record<"left" | "right", readonly [string, string]> =
      lead === "left"
        ? { left: ["leadUp", "leadDown"], right: [START, "rearDown"] }
        : { left: [START, "rearDown"], right: ["leadUp", "leadDown"] };

    let built: IGeometry | undefined;
    const geometry = (): IGeometry =>
      (built ??= build(context, lead, entry));
    const down = (side: "left" | "right", seconds: number): boolean =>
      !geometry().moves[side] ||
      seconds <= clock.at(swing[side][0]) ||
      seconds >= clock.at(swing[side][1]);
    const foot = (
      side: "left" | "right",
      seconds: number,
    ): HumanFoot.IPlacement => {
      const g: IGeometry = geometry();
      if (!g.moves[side]) return g.from[side];
      const s: number = clock.progress(swing[side][0], swing[side][1], seconds);
      const ankle: IAutoMovieVector3 = Vector3.lerp(
        g.from[side].ankle,
        g.to[side].ankle,
        s,
      );
      return {
        ankle: { ...ankle, y: ankle.y + g.lift * 4 * s * (1 - s) },
        rotation: Quaternion.slerp(g.from[side].rotation, g.to[side].rotation, s),
      };
    };

    // The root, the trunk and the legs: the root travels to the stance
    // centre, sinks, turns and bounces, and is lowered until each planted leg
    // reaches its foot.
    const stance: IAutoMovieMotionHumanPrimitive = {
      channels: ["root", "trunk", "leftLeg", "rightLeg"],
      from: 0,
      to: duration,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const g: IGeometry = geometry();
        const s: number = clock.progress(START, "set", seconds);
        const fade: number = s * (1 - clock.progress("relax", END, seconds));
        const hop: number =
          g.bounce *
          modifiers.extent *
          fade *
          0.5 *
          (1 -
            Math.cos(2 * Math.PI * BOUNCE_RATE * Math.max(0, seconds - set)));
        return resolveHumanPosture.lower(
          body,
          {
            ...posture,
            root: {
              x: entry.root.x + (g.root.x - entry.root.x) * s,
              y: entry.root.y + (g.sunk - entry.root.y) * s - hop,
              z: entry.root.z + (g.root.z - entry.root.z) * s,
            },
            yaw: entry.yaw + angle(g.heading - entry.yaw) * s,
            pitch: entry.pitch * (1 - s),
            roll: entry.roll * (1 - s),
            limbs: {
              ...posture.limbs,
              ...StrikingStance.legs(
                body,
                { left: foot("left", seconds), right: foot("right", seconds) },
                { left: down("left", seconds), right: down("right", seconds) },
              ),
            },
          },
          5,
        );
      },
    };

    // The gloves rise from the entry's hand goals to the guard on the trunk
    // the stance row has placed; an entry without world hand goals takes the
    // guard at once.
    const arms: IAutoMovieMotionHumanPrimitive = {
      channels: ["leftArm", "rightArm"],
      from: 0,
      to: duration,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const hands = StrikingStance.guard(body, posture, { lead });
        const s: number = clock.progress(START, "set", seconds);
        const raised = (arm: "leftArm" | "rightArm"): IHumanPosture.IGoal => {
          const from: IHumanPosture.IGoal | undefined = entry.limbs[arm];
          return from === undefined || from.on !== undefined
            ? hands[arm]!
            : AutoMovieMotionHumanGoal.mix(from, hands[arm]!, s);
        };
        return {
          ...posture,
          limbs: {
            ...posture.limbs,
            leftArm: raised("leftArm"),
            rightArm: raised("rightArm"),
          },
        };
      },
    };

    const composed: IHumanActionPlan = composeAutoMovieMotionHumanAction({
      base: {
        ...AutoMovieMotionHumanBase.still(duration, {
          root: entry.root,
          yaw: entry.yaw,
          pitch: entry.pitch,
          roll: entry.roll,
          joints: { ...entry.joints, ...StrikingStance.joints() },
          limbs: {},
        }),
        settle: (): void => {
          built = undefined;
        },
      },
      clock,
      primitives: [stance, arms],
    });
    return {
      ...composed,
      get contacts(): IHumanContactWindow[] {
        const g: IGeometry = geometry();
        return (["left", "right"] as const).flatMap((side: "left" | "right"): IHumanContactWindow[] =>
            !g.moves[side]
              ? [
                  {
                    part: `${side}Foot`,
                    kind: "plant",
                    from: 0,
                    to: 1,
                    support: { kind: "ground" },
                  },
                ]
              : [
                  {
                    part: `${side}Foot`,
                    kind: "plant",
                    from: 0,
                    to: clock.at(swing[side][0]) / duration,
                    support: { kind: "ground" },
                  },
                  {
                    part: `${side}Foot`,
                    kind: "plant",
                    from: clock.at(swing[side][1]) / duration,
                    to: 1,
                    support: { kind: "ground" },
                  },
                ],
          );
      },
    };
  }

  /** What a guard reads from the entry and the line, once per run. */
  interface IGeometry {
    /** Where each foot starts. */
    from: Record<"left" | "right", HumanFoot.IPlacement>;
    /** Where each foot stands in the stance. */
    to: Record<"left" | "right", HumanFoot.IPlacement>;
    /** Whether each foot has to move. */
    moves: Record<"left" | "right", boolean>;
    /** The root's floor place in the stance. */
    root: IAutoMovieVector3;
    /** The root's height in the stance, metres. */
    sunk: number;
    /** The stance's heading, degrees. */
    heading: number;
    /** A swinging foot's lift, metres. */
    lift: number;
    /** The bounce's height, metres. */
    bounce: number;
  }

  /** Build the stance from the entry and the line. */
  function build(
    context: IHumanActionContext<IParams>,
    lead: "left" | "right",
    entry: IHumanPosture,
  ): IGeometry {
    const body = context.body;
    const staggered: boolean =
      Math.abs(
        Vector3.dot(
          Vector3.subtract(
            context.entry.feet.left.ankle,
            context.entry.feet.right.ankle,
          ),
          forwardOf(entry.yaw),
        ),
      ) > 0.05;
    const line: number =
      context.params.facing !== undefined
        ? StrikingTarget.heading(
            StrikingTarget.line(
              entry.root,
              AutoMovieMotionHumanTarget.resolve(
                context,
                context.params.facing,
                context.start - StrikingTarget.LOOK,
                entry,
                AutoMovieMotionHumanTarget.DEFAULTS.ahead,
              ).point,
              entry.yaw,
            ),
          )
        : staggered
          ? entry.yaw +
            (lead === "left" ? StrikingStance.TURN : -StrikingStance.TURN)
          : entry.yaw;
    const stance: StrikingStance.IStance = { lead, line };
    const from: Record<"left" | "right", HumanFoot.IPlacement> =
      StrikingTarget.feet(context.entry);
    const centre: IAutoMovieVector3 = {
      x: (from.left.ankle.x + from.right.ankle.x) / 2,
      y: 0,
      z: (from.left.ankle.z + from.right.ankle.z) / 2,
    };
    const to: Record<"left" | "right", HumanFoot.IPlacement> =
      StrikingStance.feet(body, stance, centre);
    const heading: number = StrikingStance.heading(stance);
    // The pelvis over the stance centre, the feet being symmetric about it on
    // the line.
    const sunk: number = StrikingStance.sink(body, centre, heading, {
      left: to.left.ankle,
      right: to.right.ankle,
    });
    // A foot already in place stays.
    const moves = (side: "left" | "right"): boolean =>
      Vector3.length(Vector3.subtract(from[side].ankle, to[side].ankle)) > 0.01;
    return {
      from,
      to,
      moves: { left: moves("left"), right: moves("right") },
      root: centre,
      sunk,
      heading,
      lift: 0.02 * body.measure.stature,
      bounce: Math.abs(sunk) / 3,
    };
  }

  /** A heading difference wrapped into (-180, 180]. */
  function angle(degrees: number): number {
    return ((((degrees + 180) % 360) + 360) % 360) - 180;
  }

  /** The horizontal forward of a heading. */
  function forwardOf(yaw: number): IAutoMovieVector3 {
    const r: number = (yaw * Math.PI) / 180;
    return { x: Math.sin(r), y: 0, z: Math.cos(r) };
  }
}
