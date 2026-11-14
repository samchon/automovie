import { type IAutoMovieResolvedBone, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import type { IHumanBody } from "../body/IHumanBody";
import type { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTouchEffector } from "../compose/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchForm } from "../compose/AutoMovieMotionHumanTouchForm";
import { AutoMovieMotionHumanTouchPath } from "../compose/AutoMovieMotionHumanTouchPath";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { HumanPerception } from "../law/HumanPerception";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanColliders } from "../posture/HumanColliders";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingBody } from "../striking/StrikingBody";
import { StrikingTarget } from "../striking/StrikingTarget";
import type { touch } from "./touch";
import type { touchRegion } from "./touchRegion";
import type { touchSite } from "./touchSite";

/**
 * How a touch reads the person it touches: as perceived on the way to them,
 * and as they are while the hand is on them.
 *
 * Before the hand arrives (`ready`) and after it leaves (`relax`), the
 * partner is a tracked person, read where the performer saw them a reaction
 * time earlier (`HumanPerception.REACTION`). Between, the hand lies on the
 * partner's body and rides it, as the hand of a clinch, a carry or a
 * handshake does, so the partner's region and colliders are read where the
 * partner was one frame before (`StrikingTarget.LOOK`), the look-back every
 * plan reads another performer through: two people each with a hand on the
 * other would otherwise each read the posture the other is still solving.
 * Read as perceived, the palm of a shove trailed the chest it pushed by up
 * to 0.2 m as the receiver staggered away; a frame behind, it trails by the
 * chest's travel over 1/24 s. The
 * arrival itself (`ready` and `relax`, the instants a touch plans its
 * clearing course against) is still read as perceived, so a course planned
 * on the way never reads the partner at a contact still to come.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two readings, the window that separates them, why the hand rides the partner a frame behind and the measured fault.
 * @evidence contracts/development/design.md#principled-representation The hold is the open span between the arrival and the departure on the touch's own clock; inside it the partner is read as a held contact is, outside it as a tracked person.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The window, the context that reads a person as they are, the region reader, the colliders a touch keeps clear of and both as a plan perceives them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No person or action is named; the window is the touch's own clock.
 */
export namespace touchHold {
  /**
   * Whether the hand lies on its region at a second.
   *
   * @param clock The touch's clock.
   * @param seconds Seconds since the action's start.
   * @returns True strictly between `ready` and `relax`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the window and that its ends are excluded.
   * @evidence contracts/development/implementation.md#principled-implementation The clock's arrival and departure bound the hold; at each end the course planned on the way is read.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One comparison.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function holding(
    clock: AutoMovieMotionClock.IClock,
    seconds: number,
  ): boolean {
    return seconds > clock.at("ready") && seconds < clock.at("relax");
  }

  /**
   * The context whose aim reads a person as they are, for the hold.
   *
   * @param context The action's context.
   * @returns The same context with a person's region placed on their bones one frame before the second; every other target aimed as before.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what changes and what is kept.
   * @evidence contracts/development/implementation.md#principled-implementation A person's region placed on the bones `context.performer` gives one frame before the second, which a performer that names itself reads as it entered.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One aim replaced.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only a person is read differently.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One bone read and one placement per aim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `StrikingBody.region`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The context closes over the given one.
   */
  export function felt<
    Context extends Pick<IHumanActionContext, "aim" | "performer">,
  >(context: Context): Context {
    return {
      ...context,
      aim: (
        target: AutoMovieMotionTarget,
        seconds: number,
      ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } => {
        if (target.kind !== "person") return context.aim(target, seconds);
        const other: IHumanActionContext.IPerformer = context.performer(
          target.subject,
        );
        return StrikingBody.region(
          other.body,
          other.bones(seconds - StrikingTarget.LOOK),
          target.region,
        );
      },
    };
  }

  /**
   * A region read as perceived outside the hold and as felt inside it.
   *
   * @param clock The touch's clock.
   * @param perceived The region as the touch reads it on the way.
   * @param held The region as the touch reads it while the hand is on it.
   * @returns The region at a posture and a second since the action's start.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which reading applies when.
   * @evidence contracts/development/implementation.md#principled-implementation The window decides the reading at each second.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work beyond the reading.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader closes over its two readings.
   */
  export function region(
    clock: AutoMovieMotionClock.IClock,
    perceived: (posture: IHumanPosture, seconds: number) => touchSite.IFrame,
    held: (posture: IHumanPosture, seconds: number) => touchSite.IFrame,
  ): (posture: IHumanPosture, seconds: number) => touchSite.IFrame {
    return (posture: IHumanPosture, seconds: number): touchSite.IFrame =>
      holding(clock, seconds)
        ? held(posture, seconds)
        : perceived(posture, seconds);
  }

  /**
   * The partner's colliders a touch keeps its arm clear of, and the ones it
   * lays the hand on: the segments of the bone that carries the touched
   * region (`IHumanPosture.IGoal.rests`), whose surface the goal puts the hand
   * on, apart from the rest (`IHumanPosture.IGoal.clear`).
   *
   * @param context The action's context.
   * @param target The partner and the region the hand is laid on.
   * @param clock The touch's clock.
   * @returns The colliders at a second since the action's start, `clear` and `rests`: where the partner was one frame before during the hold, where the performer saw them a reaction time earlier otherwise.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both readings and the split.
   * @evidence contracts/development/implementation.md#principled-implementation The partner's bones read `LOOK` before the second during the hold and `REACTION` before it outside, placed by their collider profile, and split by the bone the body's surface table names for the region.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch on the window and one partition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every segment is kept, in one list or the other.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One collider placement per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanColliders.placed` and the body's surface table.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The function closes over the context, the target and the clock.
   */
  export function others(
    context: Pick<IHumanActionContext, "performer" | "start">,
    target: { subject: string; region: AutoMovieHumanoidRegion },
    clock: AutoMovieMotionClock.IClock,
  ): (
    posture: IHumanPosture,
    seconds: number,
  ) => {
    clear: HumanColliders.IPlaced[];
    rests: HumanColliders.IPlaced[];
  } {
    return (
      _: IHumanPosture,
      seconds: number,
    ): { clear: HumanColliders.IPlaced[]; rests: HumanColliders.IPlaced[] } => {
      const partner: IHumanActionContext.IPerformer = context.performer(
        target.subject,
      );
      const bone: AutoMovieHumanoidBone | undefined =
        partner.body.surfaces.regions[target.region]?.bone;
      const placed: HumanColliders.IPlaced[] = HumanColliders.placed(
        partner.body,
        partner.bones(
          context.start +
            seconds -
            (holding(clock, seconds)
              ? StrikingTarget.LOOK
              : HumanPerception.REACTION),
        ),
      );
      return {
        clear: placed.filter(
          (segment: HumanColliders.IPlaced): boolean => segment.bone !== bone,
        ),
        rests: placed.filter(
          (segment: HumanColliders.IPlaced): boolean => segment.bone === bone,
        ),
      };
    };
  }

  /**
   * The region and the colliders of a touch of a person as its plan
   * perceives them: where the performer saw the person when the touch
   * starts, a reaction time behind its `start`, whatever second the plan
   * reads them at, so no plan reads the person ahead of the second it is
   * made at (`AutoMovieMotionHumanArm.ICarry.perceived`).
   *
   * @param context The action's context.
   * @param target The person and the region the hand is laid on.
   * @param clock The touch's clock.
   * @param perceived The region as the touch reads it on the way.
   * @returns The region and the colliders at the touch's start, at any posture and second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the instant read, why, and what is returned.
   * @evidence contracts/development/implementation.md#principled-implementation A reach is planned from what is perceived when it is planned; every read of the person is then in the past.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Both readers called at one instant.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The second asked is ignored, so no later instant leaks in.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One read per call, as the readers it wraps.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the touch's own region reader and `others`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Closes over the two readers.
   */
  export function perceived(
    context: Pick<IHumanActionContext, "performer" | "start">,
    target: { subject: string; region: AutoMovieHumanoidRegion },
    clock: AutoMovieMotionClock.IClock,
    perceived: (posture: IHumanPosture, seconds: number) => touchSite.IFrame,
  ): {
    region: (posture: IHumanPosture, seconds: number) => touchSite.IFrame;
    others: (posture: IHumanPosture, seconds: number) => { clear: HumanColliders.IPlaced[]; rests: HumanColliders.IPlaced[] };
  } {
    const at: number = clock.at("start");
    const colliders: ReturnType<typeof others> = others(context, target, clock);
    return {
      region: (posture: IHumanPosture): touchSite.IFrame => perceived(posture, at),
      others: (posture: IHumanPosture): { clear: HumanColliders.IPlaced[]; rests: HumanColliders.IPlaced[] } => colliders(posture, at),
    };
  }

  /**
   * How a touch lays its hand on its region: its along axis on the arm's own
   * direction across the region (`AutoMovieMotionHumanTouchPath.lay`), or
   * the forefinger end on (`reach`), and the tangent its travel runs on: the
   * row's, else `up`. A hand on the performer's own region whose travel up
   * and down sinks it into another part of the body travels across instead
   * when that sinks it less, as a person rubs a nape side to side: rubbed up
   * and down its 48 mm, the hand went 39.6 mm into the upper back at the
   * foot of the stroke, and rubbed across the nape not at all.
   *
   * @param context The touch's context: the body, the entry and the row's kind, manner, tangent, touching surface and elbow.
   * @param bones The entry's resolved bones.
   * @param effector The touching surface.
   * @param placed The touch's region reader (`touchRegion.reader`).
   * @returns Each hand's lay and travel's tangent, given the hand and its target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each lay, when the tangent is chosen, how the hand is read and the measured defect.
   * @evidence contracts/development/implementation.md#principled-implementation The hand posed where the stroke's goal lays it at the ends and the middle of its travel, read by the tangle audit's own probes (`AutoMovieMotionHumanAuditTangleModel.depths`) against the skin's give (`BUILT`), as `HumanGraspUse.presented` judges a roll.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two tangents, one sweep each and one choice.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The region's own bone and the touching arm are left out; a row's tangent, a tool, a forefinger and a partner keep their tangent; `up` wins a tie, so a hand that does not sink travels as before.
   * @evidence contracts/development/implementation.md#efficient-algorithms Ten hand placements, once per hand and plan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the arm's lay, the form's tangent and travel, the effector's goal and the tangle model.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function lay(
    context: IHumanActionContext<touch.IParams>,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    effector: AutoMovieMotionHumanTouchEffector.IEffector,
    placed: ReturnType<typeof touchRegion.reader>,
  ): Lay {
    const p: touch.IParams = context.params;
    const travel: number =
      AutoMovieMotionHumanTouchForm.FORMS[p.kind ?? "pat"].travel *
      context.body.measure.hand *
      AutoMovieMotionManner.of(context, p.manner).extent;
    return (side: HumanHand.Side, target: AutoMovieMotionTarget): ILaid => {
      const tangent: AutoMovieMotionHumanTouchForm.Tangent = p.tangent ?? "up";
      const lay: ILaid["lay"] = p.with === "forefinger" ? "reach" : "arm";
      return lay === "reach" ||
        target.kind !== "self" ||
        p.tangent !== undefined ||
        effector.tool !== undefined ||
        travel === 0
        ? { lay, tangent }
        : {
            lay,
            tangent: rubbed(
              context.body,
              bones,
              context.entry.posture,
              side,
              effector,
              target,
              placed(target, false)(context.entry.posture, 0),
              travel,
              p.elbow,
            ),
          };
    };
  }

  /** Each hand's lay, given the hand and its target (`lay`). */
  export type Lay = (
    side: HumanHand.Side,
    target: AutoMovieMotionTarget,
  ) => ILaid;

  /** How a touch lays its hand (`lay`). */
  export interface ILaid {
    /** What the effector's along axis lies on (`AutoMovieMotionHumanTouch.ITouch.lay`). */
    lay: "arm" | "reach";

    /** The travel's tangent. */
    tangent: AutoMovieMotionHumanTouchForm.Tangent;
  }
}

/** The tangent a hand on the performer's own region travels on (`touchHold.lay`). */
function rubbed(
  body: IHumanBody,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  posture: IHumanPosture,
  side: HumanHand.Side,
  effector: AutoMovieMotionHumanTouchEffector.IEffector,
  target: AutoMovieMotionTarget & { kind: "self" },
  place: { point: IAutoMovieVector3; normal: IAutoMovieVector3 },
  travel: number,
  elbow: touch.IParams["elbow"],
): AutoMovieMotionHumanTouchForm.Tangent {
  const model: AutoMovieMotionHumanAuditTangleModel.IModel =
    AutoMovieMotionHumanAuditTangleModel.model(body);
  const hand: AutoMovieMotionHumanAuditTangleModel.IPart | undefined =
    model.parts.find(
      (part: AutoMovieMotionHumanAuditTangleModel.IPart): boolean =>
        part.bone === `${side}Hand`,
    );
  if (hand === undefined) return "up";
  const own: AutoMovieHumanoidBone = body.surfaces.regions[target.region].bone;
  const arm: RegExp = new RegExp(
    `^${side}(UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Little)`,
  );
  const parts: HumanColliders.IPlaced[] = HumanColliders.placed(
    body,
    new Map(
      [...bones].filter(
        ([bone]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): boolean =>
          bone !== own && !arm.test(bone),
      ),
    ),
  );
  const normal: IAutoMovieVector3 = Vector3.normalize(place.normal);
  const hang: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
    body,
    posture,
    side,
  );
  // How deep the hand goes into the other parts at the ends and the middle
  // of its travel on a tangent, laid along the arm's direction as the
  // stroke's goal lays it there.
  const sink = (tangent: AutoMovieMotionHumanTouchForm.Tangent): number => {
    const way: IAutoMovieVector3 = AutoMovieMotionHumanTouchForm.tangent(
      normal,
      posture.yaw,
      tangent,
      side,
    );
    const along: IAutoMovieVector3 = AutoMovieMotionHumanTouchPath.lay(
      body,
      posture,
      side,
      place.point,
      normal,
      way,
      elbow,
    );
    let deepest: number = 0;
    for (const share of SWEEP) {
      const goal: IHumanPosture.IGoal = AutoMovieMotionHumanTouchEffector.goal(
        body,
        side,
        effector,
        Vector3.add(place.point, Vector3.scale(way, share * travel)),
        normal,
        along,
        hang,
      );
      const posed: HumanColliders.IPlaced[] = HumanColliders.placed(
        body,
        new Map([
          [
            hand.bone,
            {
              bone: hand.bone,
              worldPosition: goal.point,
              worldRotation: goal.rotation!,
            } as IAutoMovieResolvedBone,
          ],
        ]),
      );
      for (const at of posed)
        for (const part of parts)
          for (const depth of AutoMovieMotionHumanAuditTangleModel.depths(
            hand.probes,
            at,
            part,
          ))
            deepest = Math.max(deepest, depth);
    }
    return deepest;
  };
  const up: number = sink("up");
  return up > AutoMovieMotionHumanAuditTangleModel.BUILT && sink("across") < up
    ? "across"
    : "up";
}

/** Where along its travel the hand is read, shares of the travel each way. */
const SWEEP: readonly number[] = [-1, -0.5, 0, 0.5, 1];
