import type { AutoMovieEnginePhysicalBalanceTypes } from "./AutoMovieEnginePhysicalBalanceTypes";
import { AutoMovieEnginePhysicalDisturbanceForm } from "./AutoMovieEnginePhysicalDisturbanceForm";
import { AutoMovieEnginePhysicalDisturbanceResponse } from "./AutoMovieEnginePhysicalDisturbanceResponse";
import { AutoMovieEnginePhysicalFootstepAdjustor } from "./AutoMovieEnginePhysicalFootstepAdjustor";
import { AutoMovieEnginePhysicalIcpPlanner } from "./AutoMovieEnginePhysicalIcpPlanner";
import type { AutoMovieEnginePhysicalIcpPlannerTools as Tools } from "./AutoMovieEnginePhysicalIcpPlannerTools";
import { AutoMovieEnginePhysicalPlanarPolygon as Polygon } from "./AutoMovieEnginePhysicalPlanarPolygon";
import { AutoMovieEnginePhysicalPushRecovery as Recovery } from "./AutoMovieEnginePhysicalPushRecovery";
import { AutoMovieEnginePhysicalSupportSpanContacts as Contacts } from "./AutoMovieEnginePhysicalSupportSpanContacts";

/**
 * Where a disturbance response's swinging limb can step
 * (`preparePhysicalDisturbanceSpan`): the capture region it can reach, the
 * swing time it prefers, the footstep projected into the region, and the plan
 * to it.
 */
export namespace AutoMovieEnginePhysicalDisturbancePlacement {
  /**
   * The region a swinging limb can step into with a swing time left: the
   * remaining support's one-step capture region cut by the discs it can reach,
   * the maximum endpoint travel about its lift-off place
   * (`IAutoMoviePhysicalBalance.maximumStep`) and, with its leg known, the
   * leg's reach about its hip carried by the centre of mass
   * (`AutoMovieEnginePhysicalSupportSpanContacts.captureRegion`).
   */
  export function reachable(
    scope: IResponse,
    stance: readonly Foot[],
    swing: Foot,
    remaining: number,
  ): Polygon.IPoint[] {
    const reach: Contacts.IReach[] = [
      { center: toLocal(swing.frame.origin), radius: scope.input.maximumStep },
    ];
    if (swing.leg && swing.leg.length > swing.leg.height)
      reach.push({
        center: toLocal(add(scope.state.c, swing.leg.hip)),
        radius: Math.sqrt(
          swing.leg.length * swing.leg.length -
            swing.leg.height * swing.leg.height,
        ),
      });
    return Contacts.captureRegion({
      polygon: AutoMovieEnginePhysicalDisturbanceResponse.supportOf(stance),
      capture: toLocal(scope.state.xi),
      omega: scope.omega,
      remaining,
      reach,
    });
  }

  /**
   * The swing time a recovery prefers: the time left, reduced by tenths of it
   * while the region is empty (`AutoMovieEnginePhysicalPushRecovery.preferredSwingTime`,
   * `computePreferredSwingTimeForRecovering` l.197-220).
   */
  export function preferred(
    scope: IResponse,
    stance: readonly Foot[],
    swing: Foot,
    remaining: number,
  ): number {
    if (remaining <= ZULU.controlDt) return remaining;
    let time: number = remaining;
    for (; time >= 0; time -= remaining / 10)
      if (Polygon.area(reachable(scope, stance, swing, time)) > 0) break;
    return time;
  }

  /**
   * The footstep projected into the region once per recovery, not while the
   * capture point's error is small nor within `MINIMUM_TIME_TO_REPLAN` of
   * touchdown (`AutoMovieEnginePhysicalPushRecovery.checkAndUpdate` l.231-281,
   * `AutoMovieEnginePhysicalFootstepAdjustor`).
   */
  export function place(
    scope: IResponse,
    stance: readonly Foot[],
    swing: Foot,
    from: Tools.IFloor,
    remaining: number,
  ): {
    target: Tools.IFloor;
    viable: boolean;
    adjusted: boolean;
    preferred: number;
  } {
    const time: number = preferred(scope, stance, swing, remaining);
    const region: Polygon.IPoint[] =
      time > 0 ? reachable(scope, stance, swing, time) : [];
    const kept = {
      target: from,
      viable: region.length > 0,
      adjusted: false,
      preferred: time,
    };
    if (
      region.length === 0 ||
      !scope.recovery.large ||
      scope.recovery.recovering ||
      remaining < Recovery.MINIMUM_TIME_TO_REPLAN
    )
      return kept;
    const adjusted: AutoMovieEnginePhysicalFootstepAdjustor.IResult = AutoMovieEnginePhysicalFootstepAdjustor.adjust(
      {
        position: toLocal(from),
        outline: Polygon.hull(
          outline({ ...swing, frame: { ...swing.frame, origin: from } }).map(
            toLocal,
          ),
        ),
        support: Polygon.centroid(
          AutoMovieEnginePhysicalDisturbanceResponse.supportOf(stance),
        ),
        region,
      },
    );
    if (!adjusted.adjusted) return kept;
    scope.recovery = { ...scope.recovery, recovering: true };
    return {
      target: toWorld(adjusted.position),
      viable: true,
      adjusted: true,
      preferred: time,
    };
  }

  /** The single-support plan from a time to a footstep. */
  export function plan(
    scope: IResponse,
    support: Foot,
    swing: Foot,
    target: Tools.IFloor,
    duration: number,
  ): AutoMovieEnginePhysicalIcpPlanner.ISinglePlan {
    const landing: Foot = {
      ...swing,
      frame: { origin: target, forward: swing.frame.forward },
    };
    return AutoMovieEnginePhysicalIcpPlanner.singleSupport({
      support,
      footstep: landing,
      omega: scope.omega,
      parameters: { swing: duration },
    });
  }
}


/*
 * The closed forms a placement reads.
 */
const { ZULU, add, outline, toLocal, toWorld }: typeof AutoMovieEnginePhysicalDisturbanceForm =
  AutoMovieEnginePhysicalDisturbanceForm;

/** A planted foot. */
type Foot = AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanFoot;

/** The response being laid. */
type IResponse = AutoMovieEnginePhysicalDisturbanceResponse.IResponse;
