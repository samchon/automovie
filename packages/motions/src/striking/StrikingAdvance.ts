import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingAdvance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { carryHumanPosture } from "../posture/carryHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";

/**
 * The advance of a stroke: how the body goes with a held tool's cut, thrust or
 * presentation. The leading foot, the one on the tool's side, leaves the floor,
 * lands its travel ahead along a line and comes back; the pelvis is carried a
 * share of that travel and lowered until both legs reach their feet. A lunge's
 * full travel is `LUNGE` of the stature and a step's `STEP` (both provisional:
 * fencing studies report lunge lengths, and none was read for this pass); a
 * stroke takes less when its target needs less, as fencing measure works
 * (`HumanSword.aim`).
 */
export namespace StrikingAdvance {
  /** The leading foot's travel in a lunge, a share of the stature (provisional). */
  export const LUNGE: number = 0.45;

  /** The leading foot's travel in a step, a share of the stature (provisional). */
  export const STEP: number = 0.2;

  /** The pelvis's travel as a share of the leading foot's (provisional). */
  export const CARRY: number = 0.55;

  /** The leading foot's full travel of an advance, metres. */
  export const travel = (
    context: Pick<IAutoMovieMotionHumanActionContext, "body">,
    advance: IAutoMovieMotionHumanStrikingAdvance.Advance,
  ): number =>
    advance === "none"
      ? 0
      : (advance === "lunge" ? LUNGE : STEP) * context.body.measure.stature;

  /**
   * The entry base, or the lead foot's advance on the stroke's phrase clock.
   * Travel is metres from strokeStart to stroke, followed by the original
   * relax-to-end recovery unless stay keeps the landed foot.
   */
  export const base = (
    context: IAutoMovieMotionHumanActionContext,
    stroke: IAutoMovieMotionHumanStrikingAdvance.IBaseStroke,
  ): IAutoMovieMotionHumanActionPlan => {
    const clock: IAutoMovieMotionClock = stroke.clock;
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
    ): IAutoMovieMotionHumanContactWindow => ({
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
      posture: (
        seconds: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      ): IAutoMovieMotionHumanPosture => {
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
          resolution,
        );
      },
    };
  };

  /**
   * The body with its lead foot advanced along the given world line. The pelvis
   * follows CARRY of the foot's travel and the original native lower keeps both
   * legs in reach; raised is metres or null for planting.
   *
   * @param context The current native body and entry posture/feet.
   * @param lead The advancing foot.
   * @param line The world horizontal travel direction.
   * @param along Metres of lead-foot travel.
   * @param raised Swinging foot height in metres, or null when planted.
   * @param resolution Optional exact FK source borrowed only for this
   *   synchronous same-body evaluation.
   * @returns The original carried and lowered posture with both actual leg
   *   goals.
   */
  export const stood = (
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "entry">,
    lead: "left" | "right",
    line: IAutoMovieVector3,
    along: number,
    raised: number | null,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieMotionHumanPosture => {
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const rear: "left" | "right" = lead === "left" ? "right" : "left";
    const feet: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement> =
      StrikingTarget.feet(context.entry);
    const placed: Record<
      "left" | "right",
      IAutoMovieMotionHumanFoot.IPlacement
    > = {
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
    const carried: IAutoMovieMotionHumanPosture = carryHumanPosture(
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
      resolveHumanPosture.KNEE,
      resolution,
    );
  };
}
