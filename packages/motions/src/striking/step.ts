import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { tags } from "typia";

import type { HumanActionName } from "../HumanActionName";
import { HumanBound } from "../law/HumanBound";
import type { HumanUnit } from "../law/HumanUnit";
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
 * Fighting-stance footwork: steps that keep the stance, the foot on the side
 * of travel moving first and the other following to restore the stance
 * without crossing (IBA coaching manual pp. 36 to 39: forward, the lead foot
 * then the rear; back, the rear then the lead; sideways, the near foot then
 * the far).
 *
 * Each step moves the whole stance by its length along the direction in the
 * body's line frame: the first foot swings in the first half of the step, the
 * second follows in the second, each on a minimum-jerk path lifted clear of
 * the floor, while the root carries the body on its own minimum-jerk profile
 * and the guard rides on the trunk. The step length defaults to half a
 * stance length (the kickboxing research's step share) and the step period to
 * 0.35 s, about three steps a second, inside the 2 to 3.5 steps a second of
 * the ring-movement reading (provisional).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the foot order with its coaching source, the paths, the defaults and which are provisional.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table, parameters with a closed direction union, and a pure plan of postures in world metres and seconds with plant windows.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the timing constants and the plan the law table dispatches through.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the stance, posture and plan types; the step scales with each body's stance.
 */
export namespace step {
  /** The action's name. */
  export const name: HumanActionName = "step";

  /** Cancel table: footwork chains into strikes, defences and more footwork at any time. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    step: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.1 }],
    guard: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.15 }],
    punch: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.1 }],
    kick: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.1 }],
    defend: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.1 }],
  };

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame, unit and default.
   * @evidence contracts/development/design.md#principled-representation A closed union of directions in the stance's frame, a whole step count and a length in metres, both checked when planning.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IParams {
    /** The direction in the stance's own frame. */
    direction: "forward" | "back" | "left" | "right";

    /** How many steps; 1 when absent. */
    steps?: number & tags.Type<"uint32"> & tags.Minimum<1> & HumanUnit<"">;

    /** Each step's length, metres; half a stance length when absent. */
    length?: number;
  }

  /** Seconds per step (provisional). */
  export const PERIOD: number = 0.35;

  /** Share of a stance length one step covers (IBA: the following foot restores the stance without crossing). */
  export const STEP_SHARE: number = 0.5;

  /**
   * Plan footwork.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the step count is not a whole number of at least one, or the length leaves (0, one stance length].
   *
   * @evidence contracts/development/common.md#meaningful-documentation States its input, its plan and its refusals; the namespace states the method.
   * @evidence contracts/development/implementation.md#principled-implementation The coached foot order in the stance's line frame, each foot on a lifted minimum-jerk path in its half step, the root on its own minimum-jerk profile, the legs and guard solved by the shared fit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Validation, the line frame and the feet's schedule once, then each posture in closed form.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Invalid counts and lengths throw; the period is a named provisional value.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per posture beyond the limb fits.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The plan reads nothing that can change; each posture is computed from its inputs.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Its closures hold only the instance's own inputs and are released with the plan.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const count: number = p.steps ?? 1;
    HumanBound.whole("steps", count);
    const body = context.body;
    const length: number = p.length ?? STEP_SHARE * StrikingStance.length(body);
    HumanBound.within(
      "length",
      length,
      0,
      StrikingStance.length(body),
      "m",
      "minimum",
    );
    const duration: number = count * PERIOD;
    const entry: IHumanPosture = context.entry.posture;
    const lead: "left" | "right" = StrikingTarget.lead(context.entry);
    const rear: "left" | "right" = StrikingStance.rear({ lead });

    // The line frame: the stance's line is the heading turned back by the
    // stance turn; the direction is read in it.
    const line: number =
      entry.yaw +
      (lead === "left" ? StrikingStance.TURN : -StrikingStance.TURN);
    const r: number = (line * Math.PI) / 180;
    const forward: IAutoMovieVector3 = { x: Math.sin(r), y: 0, z: Math.cos(r) };
    const left: IAutoMovieVector3 = { x: Math.cos(r), y: 0, z: -Math.sin(r) };
    const unit: IAutoMovieVector3 =
      p.direction === "forward"
        ? forward
        : p.direction === "back"
          ? Vector3.scale(forward, -1)
          : p.direction === "left"
            ? left
            : Vector3.scale(left, -1);
    const first: "left" | "right" =
      p.direction === "forward"
        ? lead
        : p.direction === "back"
          ? rear
          : p.direction === "left"
            ? "left"
            : "right";
    const feet: Record<"left" | "right", HumanFoot.IPlacement> =
      StrikingTarget.feet(context.entry);
    const lift: number = 0.015 * body.measure.stature;
    const windows: Record<"left" | "right", readonly [number, number]> =
      first === "left"
        ? { left: [0, 0.5], right: [0.45, 0.95] }
        : { left: [0.45, 0.95], right: [0, 0.5] };

    // A foot's progress: whole steps done plus the current step's share.
    const progress = (
      side: "left" | "right",
      t: number,
    ): { travelled: number; swinging: boolean; s: number } => {
      const k: number = Math.min(count - 1, Math.floor(t / PERIOD));
      const local: number = (t - k * PERIOD) / PERIOD;
      const [a, b] = windows[side];
      const s: number = minimumJerk((local - a) / (b - a)).s;
      return {
        travelled: (k + s) * length,
        swinging: local > a && local < b,
        s,
      };
    };
    const contacts: IHumanContactWindow[] = [];
    for (let k: number = 0; k < count; k++)
      for (const side of ["left", "right"] as const) {
        const [a, b] = windows[side];
        const start: number = k === 0 ? 0 : (k - 1 + windows[side][1]) / count;
        contacts.push({
          part: `${side}Foot`,
          kind: "plant",
          from: start,
          to: (k + a) / count,
          support: { kind: "ground" },
        });
        if (k === count - 1)
          contacts.push({
            part: `${side}Foot`,
            kind: "plant",
            from: (k + b) / count,
            to: 1,
            support: { kind: "ground" },
          });
      }
    const events: IAutoMovieMotionEvent[] = Array.from(
      { length: count },
      (_: unknown, k: number): IAutoMovieMotionEvent => ({
        name: `step${k + 1}`,
        share: (k + 1) / count,
      }),
    );
    return {
      duration,
      events,
      contacts,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const placed = {} as Record<"left" | "right", HumanFoot.IPlacement>;
        const down = {} as Record<"left" | "right", boolean>;
        for (const side of ["left", "right"] as const) {
          const g = progress(side, t);
          placed[side] = {
            ankle: Vector3.add(feet[side].ankle, {
              x: unit.x * g.travelled,
              y: g.swinging ? lift * 4 * g.s * (1 - g.s) : 0,
              z: unit.z * g.travelled,
            }),
            rotation: feet[side].rotation,
          };
          down[side] = !g.swinging;
        }
        const carried: number = count * length * minimumJerk(t / duration).s;
        const posture: IHumanPosture = resolveHumanPosture.lower(
          body,
          {
            root: Vector3.add(entry.root, Vector3.scale(unit, carried)),
            yaw: entry.yaw,
            pitch: entry.pitch,
            roll: entry.roll,
            joints: { ...entry.joints, ...StrikingStance.joints() },
            limbs: StrikingStance.legs(body, placed, down),
          },
          5,
        );
        return {
          ...posture,
          limbs: {
            ...posture.limbs,
            ...StrikingStance.guard(body, posture, { lead }),
          },
        };
      },
    };
  }
}
