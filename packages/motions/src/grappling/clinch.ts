import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanClinch,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import { poseBones } from "../posture/poseBones";

/**
 * Taking a clinch grip on a partner standing within reach and holding it:
 * the two-handed neck tie of Muay Thai (`plum`), or judo's collar and sleeve
 * grip (`collarSleeve`, kumikata).
 *
 * The goals are the partner's regions, read on the partner's displayed body
 * at every second, so the grip follows the partner. In the plum both palms
 * lie on the back of the partner's neck (the `nape`), one each side of it
 * (`SPREAD` of the half shoulder width, provisional); in the collar and
 * sleeve grip the right hand closes on the partner's left collar (`neckLeft`)
 * and the left hand on the partner's right sleeve at the elbow (`elbowRight`),
 * mirrored for a left-handed grip. Each hand reaches its region in the aimed
 * movement time to a 5 cm grip (McIntosh et al. 2018), holds `hold` seconds
 * and lets go. The feet stay planted. Events: the phrase's `ready` (`grip`,
 * both hands closed), `strokeStart`, `stroke`, `strokeEnd`, `relax`
 * (`release`).
 *
 * With `under` the clinch is a throw's entry (tsukuri): the body lowers
 * through the reach until its fulcrum region stands at the height of the
 * partner's region that lies on it, the contact the throw turns over
 * (#3439); the throw itself is the partner's `perturb` under the pull.
 *
 * Not yet: pummelling, underhooks and overhooks, and the turn-in's own
 * footwork (Koshida et al. 2016).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two grips with their regions, the timing, the events and what is missing.
 * @evidence contracts/development/design.md#principled-representation A law record of two arm visits on the partner's regions over a standing base.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the grip table and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The grip places are the partner's own regions.
 */
export namespace clinch {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "clinch";

  /** Cancel table: a clinch goes into a knee or lets go at any time. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    knee: [
      { window: ["ready", 1], kind: "inertialize", entry: 0, blend: 0.15 },
    ],
    stand: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
  };

  /** How far each plum hand lies from the nape's middle, a share of the partner's half shoulder width (provisional). */
  export const SPREAD: number = 0.35;

  /**
   * The partner's region each hand grips and the sideways offset across it,
   * a share of the partner's half shoulder width toward the partner's left.
   *
   * @param grip The grip.
   * @param collar The collar hand.
   * @returns The region and offset by hand.
   */
  export function regions(
    grip: IAutoMovieMotionHumanClinch.Grip,
    collar: IAutoMovieMotionHumanHand.Side,
  ): IAutoMovieMotionHumanClinch.IRegionsResult {
    if (grip === "plum")
      return {
        left: { region: "nape", across: -SPREAD },
        right: { region: "nape", across: SPREAD },
      };
    const sleeve: IAutoMovieMotionHumanHand.Side =
      collar === "right" ? "left" : "right";
    return {
      [collar]: {
        region: collar === "right" ? "neckLeft" : "neckRight",
        across: 0,
      },
      [sleeve]: {
        region: collar === "right" ? "elbowRight" : "elbowLeft",
        across: 0,
      },
    } as Record<
      IAutoMovieMotionHumanHand.Side,
      { region: AutoMovieHumanoidRegion; across: number }
    >;
  }

  /**
   * A partner's region on displayed bones, moved across by a share of the
   * half shoulder width toward the partner's left.
   *
   * @param body The partner's body.
   * @param bones The partner's displayed bones.
   * @param region The region.
   * @param across The share across.
   * @returns The point and outward normal, world.
   */
  export function place(
    body: IAutoMovieMotionHumanBody,
    bones: ReturnType<IAutoMovieMotionHumanActionContext.IPerformer["bones"]>,
    region: AutoMovieHumanoidRegion,
    across: number,
  ): IAutoMovieMotionHumanClinch.IPlaceResult {
    const frame = body.surfaces.regions[region];
    const placed = resolveAutoMovieHumanoidSurfaces.place(
      frame,
      bones.get(frame.bone)!,
    );
    const left: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(
        bones.get("leftUpperArm")!.worldPosition,
        bones.get("rightUpperArm")!.worldPosition,
      ),
    );
    return {
      point: Vector3.add(
        placed.point,
        Vector3.scale(left, across * body.measure.shoulderHalfWidth),
      ),
      normal: placed.normal,
    };
  }

  /**
   * Plan a clinch.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hold is negative.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanClinch.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const hold: number = context.params.hold ?? 2;
    HumanBound.least("hold", hold, 0, "s");
    const grip: IAutoMovieMotionHumanClinch.Grip =
      context.params.grip ?? "plum";
    const table = regions(grip, context.params.hand ?? "right");
    const partner: IAutoMovieMotionHumanActionContext.IPerformer =
      context.performer(context.params.partner);
    const modifiers: IAutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);
    const reach: number = AutoMovieMotionHumanTiming.aimed(
      0.85 * (body.measure.upperArm + body.measure.forearm),
      0.05,
    );
    const clock: IAutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: reach,
        attack: AutoMovieMotionHumanTiming.PAUSES.brief,
        hold,
        retract: reach,
      }),
      modifiers,
      { holds: ["strokeEnd"] },
    );
    const duration: number = clock.duration;
    // The body stands under the clinch, its sway signed in the gripping
    // hand's frame, so a left clinch mirrors a right one (`stand.plan`).
    const base: IAutoMovieMotionHumanActionPlan = stand.plan(
      { ...context, params: { seconds: duration } },
      context.params.hand ?? "right",
    );
    const bones = poseBones(body, context.entry.pose);
    const arm = (side: IAutoMovieMotionHumanHand.Side) =>
      AutoMovieMotionHumanArm.visit({
        body,
        clock,
        side,
        origin: AutoMovieMotionHumanArm.origin(
          body,
          bones,
          {
            origin: context.entry.posture.root,
            yaw: context.entry.posture.yaw,
          },
          side,
          grip === "plum" ? "palm" : "grip",
        ),
        contact: {
          kind: "grip",
          support: {
            kind: "person",
            subject: context.params.partner,
            region: table[side].region,
          },
        },
        target: (posture: IAutoMovieMotionHumanPosture, seconds: number) => {
          const at = place(
            partner.body,
            partner.bones(context.start + seconds),
            table[side].region,
            table[side].across,
          );
          return AutoMovieMotionHumanTarget.hand(body, posture, side, at, {
            surface: grip === "plum" ? "palm" : "grip",
            shape: "relaxed",
            ...(grip === "plum" ? {} : { curl: 40 }),
          });
        },
      });
    const composed: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base,
        clock,
        contact: "stroke",
        primitives: [arm("left"), arm("right")],
      });
    const under: IAutoMovieMotionHumanClinch.IParams["under"] =
      context.params.under;
    if (under === undefined) return composed;

    // The entry: the fulcrum's height over the partner's region's, read on
    // both placed trunks at the start, taken off the root through the reach.
    const height = (
      who: IAutoMovieMotionHumanBody,
      posture: IAutoMovieMotionHumanPosture,
      region: AutoMovieHumanoidRegion,
    ): number => {
      const frame: IAutoMovieMotionHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
        who.surfaces.regions[region];
      return resolveAutoMovieHumanoidSurfaces.place(
        frame,
        HumanTrunk.resolve(who, posture).get(frame.bone)!,
      ).point.y;
    };
    const theirs: IAutoMovieMotionHumanPosture | undefined = partner.posture?.(
      context.start,
    );
    const drop: number =
      theirs === undefined
        ? 0
        : Math.max(
            0,
            height(body, context.entry.posture, under.fulcrum) -
              height(partner.body, theirs, under.on),
          );
    return {
      ...composed,
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const posture: IAutoMovieMotionHumanPosture = composed.posture(seconds);
        const lowered: number =
          drop * clock.progress(AutoMovieMotionClock.START, "ready", seconds);
        return {
          ...posture,
          root: { ...posture.root, y: posture.root.y - lowered },
        };
      },
    };
  }
}
