import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingAdvance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { carryHumanPosture } from "../../posture/internal/carryHumanPosture";
import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";

/** The alternatives of `StoodContext`'s site. */
type StoodContext = "body" | "entry";

/** The alternatives of `BasePlantPart`'s site. */
type BasePlantPart = "leftFoot" | "rightFoot";

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
    context: {
      body: { measure: Pick<IAutoMovieMotionHumanBody["measure"], "stature"> };
    },
    advance: IAutoMovieMotionHumanStrikingAdvance.Advance,
  ): number =>
    advance === "none"
      ? 0
      : (advance === "lunge" ? LUNGE : STEP) * context.body.measure.stature;

  /**
   * An advancing stroke's foot plants: the rear foot throughout; the lead foot
   * until the stroke starts and again from the stroke, to the relax unless the
   * striker stays forward.
   *
   * @param lead The lead side, the advancing foot's.
   * @param clock The stroke's phrase clock.
   * @param stay Whether the striker stays forward.
   * @returns The plants, shares of the stroke.
   */
  export const plants = (
    lead: AutoMovieHumanSide,
    clock: IAutoMovieMotionClock,
    stay: boolean,
  ): IAutoMovieMotionHumanContactWindow[] => {
    const rear: AutoMovieHumanSide = lead === "left" ? "right" : "left";
    const share = (at: string): number => clock.at(at) / clock.duration;
    const plant = (
      part: BasePlantPart,
      from: number,
      to: number,
    ): IAutoMovieMotionHumanContactWindow => ({
      part,
      kind: "plant",
      from,
      to,
      support: { kind: "ground" },
    });
    return [
      plant(`${rear}Foot`, 0, 1),
      plant(`${lead}Foot`, 0, share("strokeStart")),
      plant(`${lead}Foot`, share("stroke"), stay ? 1 : share("relax")),
    ];
  };
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
    const lead: AutoMovieHumanSide = stroke.tool.side;
    const lift: number = 0.02 * context.body.measure.stature;
    const out = (seconds: number): number =>
      clock.progress("strokeStart", "stroke", seconds);
    const back = (seconds: number): number =>
      stroke.stay ? 0 : clock.progress("relax", "end", seconds);
    return {
      duration,
      events: [],
      contacts: plants(lead, clock, stroke.stay),
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
    context: Pick<IAutoMovieMotionHumanActionContext, StoodContext>,
    lead: AutoMovieHumanSide,
    line: IAutoMovieVector3,
    along: number,
    raised: number | null,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieMotionHumanPosture => {
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const rear: AutoMovieHumanSide = lead === "left" ? "right" : "left";
    const feet: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    > = StrikingTarget.feet(context.entry);
    const placed: Record<
      AutoMovieHumanSide,
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
    return lowerHumanPosture(
      context.body,
      {
        ...carried,
        limbs: {
          ...carried.limbs,
          ...StrikingStance.legs(context.body, placed, {
            [lead]: raised === null,
            [rear]: true,
          } as Record<AutoMovieHumanSide, boolean>),
        },
      },
      lowerHumanPosture.KNEE,
      resolution,
    );
  };
}
