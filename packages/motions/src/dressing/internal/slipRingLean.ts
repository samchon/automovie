import { Quaternion, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSlipRing,
} from "@automovie/interface";

import { AutoMovieMotionHumanPartnerClear } from "../../compose/AutoMovieMotionHumanPartnerClear";
import { HumanTrunkLean } from "../../handling/HumanTrunkLean";

/**
 * A ring dresser's leaned and cleared plan (`slipRing`): a presented hand
 * beyond the standing arms reached by the least hinge at the hips that brings
 * both wrists within their arms at the stroke's end, eased in and out with the
 * steadying hand, and the partner's body made both arms' obstacle but the
 * presented hand, its fingers and its forearm, the steadying arm's rests. Read
 * from the plan's context, body, composition, clock, arms and partner.
 *
 * @param scope What the plan leans and clears.
 * @returns The cleared plan.
 */
export function slipRingLean(
  scope: slipRingLean.IScope,
): IAutoMovieMotionHumanActionPlan {
  const {
    context,
    body,
    plan,
    clock,
    side,
    steady,
    grasping,
    partner,
    hand,
  }: slipRingLean.IScope = scope;
  // A presented hand beyond the standing arms (a small partner's hand
  // before a tall dresser, or the forearm the steadying palm takes) is
  // reached by the least hinge at the hips that brings both wrists the
  // plan asks at the stroke's end within their arms (`HumanTrunkLean`),
  // as `dressPartner` reaches a region, eased in over the reach and out
  // over the return on the minimum-jerk profile (Flash and Hogan 1985):
  // the dresser keeps its standoff instead of an arm held past its reach.
  const asked: IAutoMovieMotionHumanPosture = plan.posture(
    clock.at("strokeEnd"),
  );
  const wrists: HumanTrunkLean.IWrist[] = [side, steady].flatMap(
    (arm: AutoMovieHumanSide): HumanTrunkLean.IWrist[] => {
      const goal: IAutoMovieHumanLimbGoal | undefined =
        asked.limbs[`${arm}Arm`];
      return goal === undefined || goal.on !== undefined
        ? []
        : [
            {
              side: arm,
              point: goal.point,
              rotation: goal.rotation ?? Quaternion.identity(),
            },
          ];
    },
  );
  const forward: number =
    wrists.length === 0 ? 0 : HumanTrunkLean.least(context, wrists);
  // The hinge comes in with the steadying hand's reach and goes out with
  // its return, the first and last arm to move.
  const hinge: (seconds: number) => number = (seconds: number): number =>
    forward *
    (seconds <= grasping.relax
      ? AutoMovieEngineMotionSampling.minimumJerkShare(
          grasping.ready > 0
            ? Math.min(1, Math.max(0, seconds / grasping.ready))
            : 1,
        )
      : 1 -
        AutoMovieEngineMotionSampling.minimumJerkShare(
          Math.min(
            1,
            Math.max(
              0,
              (seconds - grasping.relax) / (grasping.end - grasping.relax),
            ),
          ),
        ));
  const leaned: IAutoMovieMotionHumanActionPlan =
    forward > 0
      ? {
          ...HumanTrunkLean.moving(plan, forward),
          posture: (
            seconds: number,
            channels?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[1],
            resolution?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[2],
            projection?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[3],
          ): IAutoMovieMotionHumanPosture =>
            HumanTrunkLean.lean(
              body,
              plan.posture(seconds, channels, resolution, projection),
              hinge(seconds),
            ),
        }
      : plan;
  // The partner's body is both arms' obstacle (`AutoMovieMotionHumanPartnerClear`),
  // except the presented hand, its fingers and its forearm, which the
  // ring goes onto and the steadying palm lies under: those are the
  // steadying arm's rests and no obstacle to the ring hand.
  const presented: (bone: AutoMovieHumanoidBone) => boolean = (
    bone: AutoMovieHumanoidBone,
  ): boolean =>
    bone === `${hand}Hand` ||
    bone === `${hand}LowerArm` ||
    (bone.startsWith(hand) && /(Thumb|Index|Middle|Ring|Little)/.test(bone));
  const cleared: IAutoMovieMotionHumanActionPlan = {
    ...leaned,
    posture: (
      seconds: number,
      channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture => {
      const segments: IAutoMovieMotionHumanColliders.IPlaced[] =
        AutoMovieMotionHumanPartnerClear.at(partner, context.start + seconds);
      const clear: IAutoMovieMotionHumanColliders.IPlaced[] = segments.filter(
        (s: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
          !presented(s.bone),
      );
      const rests: IAutoMovieMotionHumanColliders.IPlaced[] = segments.filter(
        (s: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
          presented(s.bone),
      );
      return AutoMovieMotionHumanPartnerClear.onto(
        AutoMovieMotionHumanPartnerClear.onto(
          leaned.posture(seconds, channels, resolution, projection),
          `${side}Arm`,
          clear,
        ),
        `${steady}Arm`,
        clear,
        rests,
      );
    },
  };

  return cleared;
}

/** What a ring dresser's leaned plan reads. */
export namespace slipRingLean {
  /** What a ring plan leans and clears. */
  export interface IScope {
    /** The action's context. */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSlipRing>;

    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The composed plan. */
    plan: IAutoMovieMotionHumanActionPlan;

    /** The ring hand's clock. */
    clock: IAutoMovieMotionClock;

    /** The ring hand. */
    side: AutoMovieHumanSide;

    /** The steadying hand. */
    steady: AutoMovieHumanSide;

    /** The steadying hand's span. */
    grasping: IAutoMovieMotionHumanArmPlanned.ISpan;

    /** The partner. */
    partner: IAutoMovieMotionHumanPerformerReader;

    /** The partner's presented hand. */
    hand: AutoMovieHumanSide;
  }
}
