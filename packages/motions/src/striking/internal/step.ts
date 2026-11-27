import { AutoMovieGravity, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStep,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../../law/internal/HumanBound";
import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { StrikingGuard } from "./StrikingGuard";
import { StrikingStance } from "./StrikingStance";
import { StrikingStepTransition } from "./StrikingStepTransition";
import { StrikingTarget } from "./StrikingTarget";
import { strikingStepSupport } from "./strikingStepSupport";

/*
 * Both canonical feet, in contact publication order.
 */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/*
 * Fighting-stance footwork: steps that keep the stance, the foot on the side of
 * travel moving first and the other following to restore the stance without
 * crossing (IBA coaching manual pp. 36 to 39: forward, the lead foot then the
 * rear; back, the rear then the lead; sideways, the near foot then the far).
 *
 * Each step moves the whole stance by its length along the direction in the
 * body's line frame: the first foot swings in the first half of the step, the
 * second follows in the second, each on a minimum-jerk path lifted clear of the
 * floor, while the root carries the body on its own minimum-jerk profile and
 * the guard rides on the trunk. The step length defaults to half a stance
 * length (the kickboxing research's step share) and the step period scales with
 * the leg by dynamic similarity (`PERIOD`, Alexander 1984): 0.35 s on a 0.93 m
 * hip, about three steps a second, inside the 2 to 3.5 steps a second of the
 * ring-movement reading (provisional).
 *
 * An interrupted step hands its bearing foot and airborne placements to the
 * next one. The inherited swing lands before the bearing foot lifts, using the
 * next step's own clock.
 */
export namespace step {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionName = "step";

  /*
   * Cancel table: footwork chains into strikes, defences and more footwork at
   * any time.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    step: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.1 }],
    guard: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.15 }],
    punch: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.1 }],
    kick: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.1 }],
    defend: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.1 }],
  };

  /*
   * One step's period in pendulum units, `T / sqrt(l / g)` with `l` the hip
   * height: bodies of different size step alike at equal Froude number
   * (Alexander 1984), so a step's time is a share of the leg's own pendulum
   * time, never a fixed second. The value reads the provisional 0.35 s (about
   * three steps a second, inside the 2 to 3.5 of the ring-movement reading) on
   * the 0.93 m hip the gait laws' speeds are measured at (`walk.FROUDE`,
   * Bohannon 1997).
   */
  export const PERIOD: number =
    0.35 / Math.sqrt(0.93 / AutoMovieGravity.STANDARD);

  /*
   * A body's step period, seconds: `PERIOD` pendulum units of its own hip
   * height.
   * Parameter body: The body.
   * Returns: Seconds.
   */
  export function period(
    body: {
      measure: Pick<IAutoMovieMotionHumanActionContext["body"]["measure"], "hipHeight">;
    },
  ): number {
    return (
      PERIOD * Math.sqrt(body.measure.hipHeight / AutoMovieGravity.STANDARD)
    );
  }

  /*
   * Share of a stance length one step covers (IBA: the following foot restores
   * the stance without crossing).
   */
  export const STEP_SHARE: number = 0.5;

  /*
   * Plan footwork.
   * Parameter context: The action's context.
   * Returns: The plan.
   * When count, travel or turn exceeds its documented
   * range.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStep.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanStep.IParams = context.params;
    const count: number = HumanBound.whole("steps", p.steps ?? 1);
    const body = context.body;
    const lead: AutoMovieHumanSide = StrikingTarget.lead(context.entry);
    const turn: number = p.turn ?? 0;
    HumanBound.within("turn", turn, -90 * count, 90 * count, "deg");
    const transition: boolean =
      turn !== 0 || (p.lead !== undefined && p.lead !== lead);
    const length: number =
      p.length ?? (transition ? 0 : STEP_SHARE * StrikingStance.length(body));
    HumanBound.within(
      "length",
      length,
      0,
      StrikingStance.length(body),
      "m",
      transition ? undefined : "minimum",
    );
    const stride: number = period(body);
    const support: strikingStepSupport.ISupport | undefined =
      strikingStepSupport(context);
    if (transition)
      return StrikingStepTransition.plan(context, {
        count,
        stride,
        length,
        turn,
        lead,
        support,
      });

    const duration: number = count * stride;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...entry.joints,
      ...StrikingStance.joints(entry.joints),
    };
    const rear: AutoMovieHumanSide = StrikingStance.rear({ lead });

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
    const first: AutoMovieHumanSide =
      p.direction === "forward"
        ? lead
        : p.direction === "back"
          ? rear
          : p.direction === "left"
            ? "left"
            : "right";
    const feet: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    > = StrikingTarget.feet(context.entry);
    const lift: number = 0.015 * body.measure.stature;
    const planted: IPlants = supportWindows(first, count, support);

    // A foot's progress: whole steps done plus the current step's share.
    const progress = (
      side: AutoMovieHumanSide,
      t: number,
    ): IPlanProgressResult => {
      const k: number = Math.min(count - 1, Math.floor(t / stride));
      const local: number = (t - k * stride) / stride;
      const [a, b] = (k === 0 ? planted.opening : planted.windows)[side];
      const s: number = AutoMovieEngineMotionSampling.minimumJerkShare((local - a) / (b - a));
      return {
        travelled: (k + s) * length,
        swinging:
          local < b &&
          (local > a || (k === 0 && support?.landings[side] !== undefined)),
        share: s,
        first: k === 0,
      };
    };
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
      contacts: planted.contacts,
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const placed: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement> = { ...feet };
        const down: Record<AutoMovieHumanSide, boolean> = { left: true, right: true };
        for (const side of SIDES) {
          const g = progress(side, t);
          const fromY: number = feet[side].ankle.y;
          const toY: number = support?.landings[side]?.ankle.y ?? fromY;
          const landing: number = g.first
            ? (toY - fromY) * g.share
            : toY - fromY;
          placed[side] = {
            ankle: Vector3.add(feet[side].ankle, {
              x: unit.x * g.travelled,
              y:
                landing + (g.swinging ? lift * 4 * g.share * (1 - g.share) : 0),
              z: unit.z * g.travelled,
            }),
            rotation: feet[side].rotation,
          };
          down[side] = !g.swinging;
        }
        const carried: number =
          count * length * AutoMovieEngineMotionSampling.minimumJerkShare(t / duration);
        const posture: IAutoMovieMotionHumanPosture = lowerHumanPosture(
          body,
          {
            root: Vector3.add(entry.root, Vector3.scale(unit, carried)),
            yaw: entry.yaw,
            pitch: entry.pitch,
            roll: entry.roll,
            joints: { ...joints },
            limbs: StrikingStance.legs(body, placed, down),
          },
          lowerHumanPosture.KNEE,
        );
        return {
          ...posture,
          limbs: {
            ...posture.limbs,
            ...StrikingGuard(
              body,
              posture,
              { lead },
              {},
              undefined,
              undefined,
              p.guard,
            ),
          },
        };
      },
    };
  }

  /*
   * Preparation of a straight sequence's swing and support windows.
   */
  export interface IPlants {
    /*
     * Each foot's swing in a regular beat.
     */
    windows: SwingWindows;

    /*
     * Each foot's swing in the first beat, which can finish a cut.
     */
    opening: SwingWindows;

    /*
     * The stationary spans, as shares of the complete sequence.
     */
    contacts: IAutoMovieMotionHumanContactWindow[];
  }

  /*
   * Prepare the stationary intervals between swings. On a cut, the airborne
   * foot finishes landing before the bearing foot lifts. An inherited overlap
   * continues without a bearing foot until the first landing.
   * Parameter first: The foot due to swing first in a regular beat.
   * Parameter count: The positive integer number of beats.
   * Parameter support: The entry's still-airborne feet and any bearing foot.
   * Returns: The regular and opening swing windows and the complementary contacts.
   */
  export function supportWindows(
    first: AutoMovieHumanSide,
    count: number,
    support?: Pick<strikingStepSupport.ISupport, "landings" | "bearing">,
  ): IPlants {
    const windows: SwingWindows = first === "left"
      ? { left: [0, 0.5], right: [0.45, 0.95] }
      : { left: [0.45, 0.95], right: [0, 0.5] };
    const cutFirst: AutoMovieHumanSide = support?.bearing === undefined
      ? first
      : StrikingStance.rear({ lead: support.bearing });
    const cutFollow: readonly [number, number] = [
      support?.bearing === undefined ? 0 : 0.5,
      0.95,
    ];
    const opening: SwingWindows = support === undefined
      ? windows
      : cutFirst === "left"
        ? { left: [0, 0.5], right: cutFollow }
        : { left: cutFollow, right: [0, 0.5] };
    const contacts: IAutoMovieMotionHumanContactWindow[] = [];
    for (let k: number = 0; k < count; k++)
      for (const side of SIDES) {
        const [a, b]: readonly [number, number] = (k === 0 ? opening : windows)[side];
        if (k !== 0 || support?.landings[side] === undefined)
          contacts.push({
            part: `${side}Foot`,
            kind: "plant",
            from: k === 0 ? 0 : (k - 1 + (k === 1 ? opening : windows)[side][1]) / count,
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
    return { windows, opening, contacts };
  }
}

/*
 * The record of `IPlanProgressResult`'s site.
 */
type IPlanProgressResult = {
  travelled: number;
  swinging: boolean;
  share: number;
  first: boolean;
};

/*
 * Each foot's swing interval as shares of one step.
 */
type SwingWindows = Readonly<Record<AutoMovieHumanSide, readonly [number, number]>>;
