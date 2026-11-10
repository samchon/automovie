import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
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
 * @evidence contracts/development/common.md#meaningful-documentation States how the stance is taken, the line's source, the stay-planted tolerance and the provisional bounce.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table, parameters and a pure plan of postures in world metres and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the timing constants and the plan the law table and the performance dispatch through.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the stance, posture, plan and target types; the stance is measured on each body.
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

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit, minimum or default.
   * @evidence contracts/development/design.md#principled-representation A duration in seconds (raised to the setting time when planning), a closed union of stances, and the interface's motion target to face.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's target union.
   */
  export interface IParams {
    /** How long, seconds; 1 when absent and at least the 0.6 s the stance takes to set. */
    seconds?: number;

    /** Which side leads; the entry's leading side when absent. */
    stance?: "orthodox" | "southpaw";

    /** What to face; the entry's line when absent. */
    facing?: AutoMovieMotionTarget;
  }

  /** Seconds to step into the stance. */
  export const SET: number = 0.6;

  /** Bounce rate, per second (provisional). */
  export const BOUNCE_RATE: number = 2;

  /**
   * Plan a guard.
   *
   * @param context The action's context.
   * @returns The plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States its input and its plan; the namespace states the behaviour.
   * @evidence contracts/development/implementation.md#principled-implementation Each foot steps on a minimum-jerk unit to its measured stance place in turn, the root sinks and turns, the gloves rise to the guard, then a bounce through the knees; the limbs are solved by the shared fit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds the geometry on first use and evaluates each posture from it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A too-short duration is raised to the setting time, as documented; the bounce is a named provisional value.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per posture beyond the leg and arm fits.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The geometry is built once per plan and every posture reads it; settle drops it when the faced target may have moved.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one geometry, cleared by settle and released with the plan.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const duration: number = Math.max(SET, context.params.seconds ?? 1);
    let built: IGeometry | undefined;
    const geometry = (): IGeometry => (built ??= build(context, duration));
    const events: IAutoMovieMotionEvent[] = [
      { name: "set", share: SET / duration },
    ];
    return {
      duration,
      events,
      get contacts(): IHumanContactWindow[] {
        return geometry().contacts;
      },
      posture: (seconds: number): IHumanPosture =>
        geometry().posture(Math.min(duration, Math.max(0, seconds))),
      settle: (): void => {
        built = undefined;
      },
    };
  }

  /** A built guard. */
  interface IGeometry {
    /** The posture at seconds since the start. */
    posture(seconds: number): IHumanPosture;
    /** The feet's contact windows. */
    contacts: IHumanContactWindow[];
  }

  /** Build the stance from the entry and the line. */
  function build(
    context: IHumanActionContext<IParams>,
    duration: number,
  ): IGeometry {
    const body = context.body;
    const entry: IHumanPosture = context.entry.posture;
    const lead: "left" | "right" =
      context.params.stance === undefined
        ? StrikingTarget.lead(context.entry)
        : context.params.stance === "orthodox"
          ? "left"
          : "right";
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
              context.aim(
                context.params.facing,
                context.start - StrikingTarget.LOOK,
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
    const rootAt: IAutoMovieVector3 = { x: centre.x, y: 0, z: centre.z };
    const sunk: number = StrikingStance.sink(body, rootAt, heading, {
      left: to.left.ankle,
      right: to.right.ankle,
    });

    // Each foot's swing window, the rear first; a foot already in place stays.
    const moves = (side: "left" | "right"): boolean =>
      Vector3.length(Vector3.subtract(from[side].ankle, to[side].ankle)) > 0.01;
    const first: readonly [number, number] = [0, 0.3];
    const second: readonly [number, number] = [0.25, 0.55];
    const window: Record<"left" | "right", readonly [number, number]> =
      lead === "left"
        ? { left: second, right: first }
        : { left: first, right: second };
    const lift: number = 0.02 * body.measure.stature;
    const foot = (side: "left" | "right", t: number): HumanFoot.IPlacement => {
      if (!moves(side)) return from[side];
      const [a, b] = window[side];
      const s: number = minimumJerk((t - a) / (b - a)).s;
      const ankle: IAutoMovieVector3 = Vector3.lerp(
        from[side].ankle,
        to[side].ankle,
        s,
      );
      return {
        ankle: { ...ankle, y: ankle.y + lift * 4 * s * (1 - s) },
        rotation: Quaternion.slerp(from[side].rotation, to[side].rotation, s),
      };
    };
    const contacts: IHumanContactWindow[] = (
      ["left", "right"] as const
    ).flatMap((side): IHumanContactWindow[] => {
      if (!moves(side))
        return [
          {
            part: `${side}Foot`,
            kind: "plant",
            from: 0,
            to: 1,
            support: { kind: "ground" },
          },
        ];
      const [a, b] = window[side];
      return [
        {
          part: `${side}Foot`,
          kind: "plant",
          from: 0,
          to: a / duration,
          support: { kind: "ground" },
        },
        {
          part: `${side}Foot`,
          kind: "plant",
          from: b / duration,
          to: 1,
          support: { kind: "ground" },
        },
      ];
    });
    const bounce: number = Math.abs(sunk) / 3;
    return {
      contacts,
      posture: (t: number): IHumanPosture => {
        const s: number = minimumJerk(t / SET).s;
        const fade: number =
          s * (1 - minimumJerk((t - (duration - 0.2)) / 0.2).s);
        const hop: number =
          bounce *
          fade *
          0.5 *
          (1 - Math.cos(2 * Math.PI * BOUNCE_RATE * Math.max(0, t - SET)));
        const posture: IHumanPosture = {
          root: {
            x: entry.root.x + (rootAt.x - entry.root.x) * s,
            y: entry.root.y + (sunk - entry.root.y) * s - hop,
            z: entry.root.z + (rootAt.z - entry.root.z) * s,
          },
          yaw: entry.yaw + angle(heading - entry.yaw) * s,
          pitch: entry.pitch * (1 - s),
          roll: entry.roll * (1 - s),
          joints: { ...entry.joints, ...StrikingStance.joints() },
          limbs: {},
        };
        const feet: Record<"left" | "right", HumanFoot.IPlacement> = {
          left: foot("left", t),
          right: foot("right", t),
        };
        const down = (side: "left" | "right"): boolean =>
          !moves(side) || t <= window[side][0] || t >= window[side][1];
        const legs = StrikingStance.legs(body, feet, {
          left: down("left"),
          right: down("right"),
        });

        // The root lowered until each planted leg reaches its foot, as the
        // stance turns and travels over feet that have not moved yet.
        const lowered: IHumanPosture = resolveHumanPosture.lower(
          body,
          { ...posture, limbs: legs },
          5,
        );
        const hands = StrikingStance.guard(body, lowered, { lead });
        return {
          ...lowered,
          limbs: { ...lowered.limbs, ...blendArms(context, hands, s) },
        };
      },
    };
  }

  /** The entry's arms blended toward the guard by a share: from the hands' entry goals, or the guard alone when the entry wrote none. */
  function blendArms(
    context: IHumanActionContext<IParams>,
    hands: Pick<IHumanPosture["limbs"], "leftArm" | "rightArm">,
    s: number,
  ): Pick<IHumanPosture["limbs"], "leftArm" | "rightArm"> {
    const out: Pick<IHumanPosture["limbs"], "leftArm" | "rightArm"> = {};
    for (const arm of ["leftArm", "rightArm"] as const) {
      const to: IHumanPosture.IGoal = hands[arm]!;
      const from: IHumanPosture.IGoal | undefined =
        context.entry.posture.limbs[arm];
      out[arm] =
        from === undefined
          ? to
          : {
              point: Vector3.lerp(from.point, to.point, s),
              bend: Vector3.lerp(from.bend, to.bend, s),
              ...(from.rotation !== undefined && to.rotation !== undefined
                ? { rotation: Quaternion.slerp(from.rotation, to.rotation, s) }
                : {}),
            };
    }
    return out;
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
