import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { carryHumanPosture } from "../posture/carryHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";

/**
 * The advance of a stroke: how the body goes with a held tool's cut, thrust
 * or presentation. The leading foot, the one on the tool's side, leaves the
 * floor, lands its travel ahead along a line and comes back; the pelvis is
 * carried a share of that travel and lowered until both legs reach their
 * feet. A lunge's full travel is `LUNGE` of the stature and a step's `STEP`
 * (both provisional: fencing studies report lunge lengths, and none was
 * read for this pass); a stroke takes less when its target needs less, as
 * fencing measure works (`HumanSword.aim`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what moves, by how much and that the lengths are provisional.
 * @evidence contracts/development/design.md#principled-representation The root decided once from the advance: one posture function of the foot's travel, and a base plan that runs it on a phrase clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The closed union of advances, their lengths, the posture of an advance and the base plan; read by the stroke planner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Lengths are shares of the stature; no tool is named.
 */
export namespace StrikingAdvance {
  /** How the body goes with a stroke. */
  export type Advance = "none" | "step" | "lunge";

  /** The leading foot's travel in a lunge, a share of the stature (provisional). */
  export const LUNGE: number = 0.45;

  /** The leading foot's travel in a step, a share of the stature (provisional). */
  export const STEP: number = 0.2;

  /** The pelvis's travel as a share of the leading foot's (provisional). */
  export const CARRY: number = 0.55;

  /** The leading foot's full travel of an advance, metres. */
  export const travel = (
    context: Pick<IHumanActionContext, "body">,
    advance: Advance,
  ): number =>
    advance === "none"
      ? 0
      : (advance === "lunge" ? LUNGE : STEP) * context.body.measure.stature;

  /** The base of a stroke on a phrase clock: the entry's posture, or the advance of the leading foot from `strokeStart` to `stroke` (its `travel`, metres, the advance's full travel when absent) and, unless the stroke stays, its recovery from `relax` to the end. */
  export const base = (
    context: IHumanActionContext,
    stroke: {
      clock: AutoMovieMotionClock.IClock;
      advance: Advance;
      travel?: number;
      line: IAutoMovieVector3;
      stay: boolean;
      tool: { side: "left" | "right" };
    },
  ): IHumanActionPlan => {
    const clock: AutoMovieMotionClock.IClock = stroke.clock;
    const duration: number = clock.duration;
    if (stroke.advance === "none")
      return AutoMovieMotionHumanBase.under(context, duration);
    const length: number = stroke.travel ?? travel(context, stroke.advance);
    const lead: "left" | "right" = stroke.tool.side;
    const rear: "left" | "right" = lead === "left" ? "right" : "left";
    const lift: number = 0.02 * context.body.measure.stature;
    const out = (seconds: number): number =>
      clock.progress("strokeStart", "stroke", seconds);
    const back = (seconds: number): number =>
      stroke.stay ? 0 : clock.progress("relax", "end", seconds);
    const share = (at: string): number => clock.at(at) / duration;
    const plant = (
      part: "leftFoot" | "rightFoot",
      from: number,
      to: number,
    ): IHumanContactWindow => ({
      part,
      kind: "plant",
      from,
      to,
      support: { kind: "ground" },
    });
    return {
      duration,
      events: [],
      contacts: [
        plant(`${rear}Foot`, 0, 1),
        plant(`${lead}Foot`, 0, share("strokeStart")),
        ...(stroke.stay
          ? [plant(`${lead}Foot`, share("stroke"), 1)]
          : [plant(`${lead}Foot`, share("stroke"), share("relax"))]),
      ],
      posture: (seconds: number): IHumanPosture => {
        const going: number = out(seconds);
        const coming: number = back(seconds);
        const along: number = going - coming;
        const swinging: boolean =
          (going > 0 && going < 1) || (coming > 0 && coming < 1);
        const u: number = going < 1 ? going : coming;
        return stood(
          context,
          lead,
          stroke.line,
          length * along,
          swinging ? lift * 4 * u * (1 - u) : null,
        );
      },
    };
  };

  /** The body with its leading foot a distance along a line from where it stood: the pelvis carried a share of that, the root lowered until both legs reach. `raised` is the swinging foot's height, or null when it is planted. */
  export const stood = (
    context: Pick<IHumanActionContext, "body" | "entry">,
    lead: "left" | "right",
    line: IAutoMovieVector3,
    along: number,
    raised: number | null,
  ): IHumanPosture => {
    const entry: IHumanPosture = context.entry.posture;
    const rear: "left" | "right" = lead === "left" ? "right" : "left";
    const feet: Record<"left" | "right", HumanFoot.IPlacement> =
      StrikingTarget.feet(context.entry);
    const placed: Record<"left" | "right", HumanFoot.IPlacement> = {
      ...feet,
      [lead]: {
        ankle: Vector3.add(feet[lead].ankle, {
          x: line.x * along,
          y: raised ?? 0,
          z: line.z * along,
        }),
        rotation: feet[lead].rotation,
      },
    };
    const identity: IAutoMovieQuaternion = Quaternion.identity();
    const carried: IHumanPosture = carryHumanPosture(
      entry,
      { position: entry.root, rotation: identity },
      {
        position: Vector3.add(entry.root, Vector3.scale(line, CARRY * along)),
        rotation: identity,
      },
    );
    return resolveHumanPosture.lower(
      context.body,
      {
        ...carried,
        limbs: {
          ...carried.limbs,
          ...StrikingStance.legs(context.body, placed, {
            [lead]: raised === null,
            [rear]: true,
          } as Record<"left" | "right", boolean>),
        },
      },
      5,
    );
  };
}
