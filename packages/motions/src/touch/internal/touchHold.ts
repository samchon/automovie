import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanAuditTangleModel,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieMotionHumanTouchForm,
  IAutoMovieMotionHumanTouchSite,
  IAutoMovieMotionTarget,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel } from "../../audit/internal/AutoMovieMotionHumanAuditTangleModel";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTouchEffector } from "../../compose/internal/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchForm } from "../../compose/internal/AutoMovieMotionHumanTouchForm";
import { AutoMovieMotionHumanTouchPath } from "../../compose/internal/AutoMovieMotionHumanTouchPath";
import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";
import { HumanPerception } from "../../law/internal/HumanPerception";
import { HumanColliders } from "../../posture/internal/HumanColliders";
import { StrikingBody } from "../../striking/internal/StrikingBody";
import { touchHoldRests } from "./touchHoldRests";
import { touchLimb } from "./touchLimb";
import { touchRegion } from "./touchRegion";

/*
 * How a touch reads the person it touches: as perceived on the way to them, and
 * as they are while the hand is on them.
 *
 * Before the hand arrives (`ready`) and after it leaves (`relax`), the partner
 * is a tracked person, read where the performer saw them a reaction time
 * earlier (`HumanPerception.REACTION`). Between, the hand lies on the partner's
 * body and rides it, as the hand of a clinch, a carry or a handshake does, so
 * the partner's region and colliders are read where the partner was a held
 * limb's feedback delay before (`HumanPerception.HELD`): the hand follows the
 * partner by touch, not by sight, and two people each with a hand on the other
 * would otherwise each read the posture the other is still solving. Read as
 * perceived, the palm of a shove trailed the chest it pushed by up to 0.2 m as
 * the receiver staggered away; felt, it trails by the chest's travel over the
 * feedback delay. The arrival itself (`ready` and `relax`, the instants a touch
 * plans its clearing course against) is still read as perceived, so a course
 * planned on the way never reads the partner at a contact still to come.
 */
export namespace touchHold {
  /*
   * Whether the hand lies on its region at a second.
   * Parameter clock: The touch's clock.
   * Parameter seconds: Seconds since the action's start.
   * Returns: True strictly between `ready` and `relax`.
   */
  export function holding(
    clock: IAutoMovieMotionClock,
    seconds: number,
  ): boolean {
    return seconds > clock.at("ready") && seconds < clock.at("relax");
  }

  /*
   * The context whose aim reads a person as they are, for the hold.
   * Parameter context: The action's context.
   * Returns: The same context with a person's region placed on their bones a
   * held limb's feedback delay before the second; every other target aimed as
   * before.
   */
  export function felt<
    Context extends Pick<IAutoMovieMotionHumanActionContext, Felt>,
  >(context: Context): Context {
    return {
      ...context,
      aim: (target: IAutoMovieMotionTarget, seconds: number): IFeltResult => {
        if (target.kind !== "person") return context.aim(target, seconds);
        const other: IAutoMovieMotionHumanPerformerReader = context.performer(
          target.subject,
        );
        return StrikingBody.region(
          other.body,
          other.bones(
            seconds - HumanPerception.HELD,
            new Set<AutoMovieHumanoidBone>([
              other.body.surfaces.regions[target.region].bone,
            ]),
          ),
          target.region,
        );
      },
    };
  }

  /*
   * A region read as perceived outside the hold and as felt inside it.
   * Parameter clock: The touch's clock.
   * Parameter perceived: The region as the touch reads it on the way.
   * Parameter held: The region as the touch reads it while the hand is on it.
   * Returns: The region at a posture and a second since the action's start.
   */
  export function region(
    clock: IAutoMovieMotionClock,
    perceived: IAutoMovieMotionHumanTouch.ITouch["region"],
    held: IAutoMovieMotionHumanTouch.ITouch["region"],
  ): IAutoMovieMotionHumanTouch.ITouch["region"] {
    const ready: number = clock.at("ready");
    const relax: number = clock.at("relax");
    return (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      resolution?: Parameters<IAutoMovieMotionHumanTouch.ITouch["region"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanTouch.ITouch["region"]>[3],
    ): IAutoMovieMotionHumanTouchSite.IFrame =>
      seconds > ready && seconds < relax
        ? held(posture, seconds, resolution, projection)
        : perceived(posture, seconds, resolution, projection);
  }

  /*
   * The partner's colliders a touch keeps its arm clear of, and the ones it
   * lays the hand on: the segments of the bone that carries the touched region
   * and of the bones jointed to it (`HumanPosture.IGoal.rests`), whose surfaces
   * a hand laid on the region meets, apart from the rest
   * (`HumanPosture.IGoal.clear`).
   * Parameter context: The action's context.
   * Parameter target: The partner and the region the hand is laid on.
   * Parameter clock: The touch's clock.
   * Returns: The colliders at a second since the action's start, `clear` and
   * `rests`: where the partner was a feedback delay before during the hold,
   * where the performer saw them a reaction time earlier otherwise.
   */
  export function others(
    context: Pick<IAutoMovieMotionHumanActionContext, OthersContext>,
    target: IOthersTarget,
    clock: IAutoMovieMotionClock,
  ): (posture: IAutoMovieMotionHumanPosture, seconds: number) => IOthersResult {
    const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
      target.subject,
    );
    const resting: ReturnType<typeof touchHoldRests> = touchHoldRests(
      partner.body,
      target.region,
      context.body.measure.hand,
    );
    const requested: ReadonlySet<AutoMovieHumanoidBone> = HumanColliders.bones(
      partner.body,
    );
    const ready: number = clock.at("ready");
    const relax: number = clock.at("relax");
    return (
      _: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IOthersResult2 => {
      const bones: ReturnType<typeof partner.bones> = partner.bones(
        context.start +
          seconds -
          (seconds > ready && seconds < relax
            ? HumanPerception.HELD
            : HumanPerception.REACTION),
        requested,
      );
      const placed: IAutoMovieMotionHumanColliders.IPlaced[] =
        HumanColliders.placed(partner.body, bones);
      const rests: (
        segment: IAutoMovieMotionHumanColliders.IPlaced,
      ) => boolean = resting(bones);
      const clear: IAutoMovieMotionHumanColliders.IPlaced[] = [];
      const lying: IAutoMovieMotionHumanColliders.IPlaced[] = [];
      for (const segment of placed)
        (rests(segment) ? lying : clear).push(segment);
      return { clear, rests: lying };
    };
  }

  /*
   * The region and the colliders of a touch of a person as its plan perceives
   * them: where the performer saw the person when the touch starts, a reaction
   * time behind its `start`, whatever second the plan reads them at, so no plan
   * reads the person ahead of the second it is made at
   * (`AutoMovieMotionHumanArm.ICarry.perceived`).
   * Parameter context: The action's context.
   * Parameter target: The person and the region the hand is laid on.
   * Parameter clock: The touch's clock.
   * Parameter perceived: The region as the touch reads it on the way.
   * Returns: The region and the colliders at the touch's start, at any posture
   * and second.
   */
  export function perceived(
    context: Pick<IAutoMovieMotionHumanActionContext, PerceivedContext>,
    target: IPerceivedTarget,
    clock: IAutoMovieMotionClock,
    perceived: IAutoMovieMotionHumanTouch.ITouch["region"],
  ): IPerceivedResult {
    const at: number = clock.at("start");
    const colliders: ReturnType<typeof others> = others(context, target, clock);
    return {
      region: (
        posture: IAutoMovieMotionHumanPosture,
        _seconds: number,
        resolution?: Parameters<IAutoMovieMotionHumanTouch.ITouch["region"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanTouch.ITouch["region"]>[3],
      ): IAutoMovieMotionHumanTouchSite.IFrame =>
        perceived(posture, at, resolution, projection),
      others: (posture: IAutoMovieMotionHumanPosture): IPerceivedResult2 =>
        colliders(posture, at),
    };
  }

  /*
   * How a touch lays its hand on its region: its along axis on the arm's own
   * direction across the region (`AutoMovieMotionHumanTouchPath.lay`), or the
   * forefinger end on (`reach`), and the tangent its travel runs on: the row's,
   * else `up`. A hand on the performer's own region whose travel up and down
   * sinks it into another part of the body travels across instead when that
   * sinks it less, as a person rubs a nape side to side: rubbed up and down its
   * 48 mm, the hand went 39.6 mm into the upper back at the foot of the stroke,
   * and rubbed across the nape not at all.
   * Parameter context: The touch's context: the body, the entry and the row's kind,
   * manner, tangent, touching surface and elbow.
   * Parameter bones: The entry's resolved bones.
   * Parameter effector: The touching surface.
   * Parameter placed: The touch's region reader (`touchRegion.reader`).
   * Returns: Each hand's lay and travel's tangent, given the hand and its
   * target.
   */
  export function lay(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTouch.IParams>,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
    placed: ReturnType<typeof touchRegion.reader>,
  ): Lay {
    const p: IAutoMovieMotionHumanTouch.IParams = context.params;
    const travel: number =
      AutoMovieMotionHumanTouchForm.FORMS[p.kind ?? "pat"].travel *
      context.body.measure.hand *
      AutoMovieMotionManner(context, p.manner).extent;
    return (
      side: AutoMovieHumanSide,
      target: IAutoMovieMotionTarget,
    ): ILaid => {
      const tangent: IAutoMovieMotionHumanTouchForm.Tangent = p.tangent ?? "up";
      const reach: boolean = p.effector === "forefinger";
      // A hand laid on another person's limb lies along it (`limb`): a flat
      // hand across a curved segment sinks its fingers into it.
      const limb: IAutoMovieVector3 | undefined =
        reach || target.kind !== "person"
          ? undefined
          : touchLimb.axis(context, target);
      const laid: ILaid =
        limb === undefined
          ? { lay: reach ? "reach" : "arm", tangent }
          : { lay: "limb", tangent, axis: limb };
      if (
        reach ||
        (target.kind !== "self" && target.kind !== "person") ||
        p.tangent !== undefined ||
        effector.tool !== undefined ||
        travel === 0
      )
        return laid;
      // The travel's tangent is the one along which the hand sinks least
      // into the other parts: the performer's own, or the partner's.
      return {
        ...laid,
        tangent: rubbed(
          context.body,
          touchLimb.others(context, bones, side, target),
          context.entry.posture,
          side,
          effector,
          placed(target, false)(context.entry.posture, 0),
          travel,
          p.elbow,
        ),
      };
    };
  }

  /*
   * What a touch lays its effector's along axis on: the arm, the reach or a
   * partner's limb.
   */
  export type Lying = "arm" | "reach" | "limb";

  /*
   * Each hand's lay, given the hand and its target (`lay`).
   */
  export type Lay = (
    side: AutoMovieHumanSide,
    target: IAutoMovieMotionTarget,
  ) => ILaid;

  /*
   * How a touch lays its hand (`lay`).
   */
  export interface ILaid {
    /*
     * What the effector's along axis lies on
     * (`AutoMovieMotionHumanTouch.ITouch.lay`).
     */
    lay: Lying;

    /*
     * With `limb`, the touched limb's long axis, world.
     */
    axis?: IAutoMovieVector3;

    /*
     * The travel's tangent.
     */
    tangent: IAutoMovieMotionHumanTouchForm.Tangent;
  }
}

/*
 * The record of `IPerceivedResult2`'s site.
 */
type IPerceivedResult2 = {
  clear: IAutoMovieMotionHumanColliders.IPlaced[];
  rests: IAutoMovieMotionHumanColliders.IPlaced[];
};

/*
 * The record of `IPerceivedResult`'s site.
 */
type IPerceivedResult = {
  region: IAutoMovieMotionHumanTouch.ITouch["region"];
  others: (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ) => IPerceivedOthersResult;
};

/*
 * The record of `IPerceivedOthersResult`'s site.
 */
type IPerceivedOthersResult = {
  clear: IAutoMovieMotionHumanColliders.IPlaced[];
  rests: IAutoMovieMotionHumanColliders.IPlaced[];
};

/*
 * The record of `IPerceivedTarget`'s site.
 */
type IPerceivedTarget = { subject: string; region: AutoMovieHumanoidRegion };

/*
 * The alternatives of `PerceivedContext`'s site.
 */
type PerceivedContext = "performer" | "start" | "body";

/*
 * The record of `IOthersResult2`'s site.
 */
type IOthersResult2 = {
  clear: IAutoMovieMotionHumanColliders.IPlaced[];
  rests: IAutoMovieMotionHumanColliders.IPlaced[];
};

/*
 * The record of `IOthersResult`'s site.
 */
type IOthersResult = {
  clear: IAutoMovieMotionHumanColliders.IPlaced[];
  rests: IAutoMovieMotionHumanColliders.IPlaced[];
};

/*
 * The record of `IOthersTarget`'s site.
 */
type IOthersTarget = { subject: string; region: AutoMovieHumanoidRegion };

/*
 * The alternatives of `OthersContext`'s site.
 */
type OthersContext = "performer" | "start" | "body";

/*
 * The record of `IFeltResult`'s site.
 */
type IFeltResult = { point: IAutoMovieVector3; normal: IAutoMovieVector3 };

/*
 * The alternatives of `Felt`'s site.
 */
type Felt = "aim" | "performer";
/*
 * The alternatives of `RubbedPlace`'s site.
 */
type RubbedPlace = "point" | "normal";

/*
 * The tangent a hand on the performer's own region travels on
 * (`touchHold.lay`).
 */
function rubbed(
  body: IAutoMovieMotionHumanBody,
  parts: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  posture: IAutoMovieMotionHumanPosture,
  side: AutoMovieHumanSide,
  effector: IAutoMovieMotionHumanTouchEffector.IEffector,
  place: Pick<IAutoMovieMotionHumanTarget.IPlace, RubbedPlace>,
  travel: number,
  elbow: IAutoMovieMotionHumanTouch.IParams["elbow"],
): IAutoMovieMotionHumanTouchForm.Tangent {
  const model: IAutoMovieMotionHumanAuditTangleModel.IModel = body.tangle;
  const hand: IAutoMovieMotionHumanAuditTangleModel.IPart | undefined =
    model.parts.find(
      (part: IAutoMovieMotionHumanAuditTangleModel.IPart): boolean =>
        part.bone === `${side}Hand`,
    );
  if (hand === undefined) return "up";
  const normal: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(place.normal);
  const hang: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
    body,
    posture,
    side,
  );
  // How deep the hand goes into the other parts at the ends and the middle
  // of its travel on a tangent, laid along the arm's direction as the
  // stroke's goal lays it there.
  const sink = (tangent: IAutoMovieMotionHumanTouchForm.Tangent): number => {
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
      const goal: IAutoMovieHumanLimbGoal =
        AutoMovieMotionHumanTouchEffector.goal(
          body,
          side,
          effector,
          AutoMovieEngineVector3.add(place.point, AutoMovieEngineVector3.scale(way, share * travel)),
          normal,
          along,
          hang,
        );
      const posed: IAutoMovieMotionHumanColliders.IPlaced[] =
        HumanColliders.placed(
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

/*
 * Where along its travel the hand is read, shares of the travel each way.
 */
const SWEEP: readonly number[] = [-1, -0.5, 0, 0.5, 1];
