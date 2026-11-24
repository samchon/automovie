import type {
  IAutoMoviePhysicalBalance,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSupportPatch,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMoviePhysicalBalanceTrace } from "./IAutoMoviePhysicalBalanceTrace";
import { physicalAuthoredCapture } from "./physicalAuthoredCapture";
import type { physicalBalanceSense } from "./physicalBalanceSense";
import type { physicalBalanceStance } from "./physicalBalanceStance";
import { physicalPlanarPolygon as Polygon } from "./physicalPlanarPolygon";
import { physicalSupportSpanContacts as Contacts } from "./physicalSupportSpanContacts";

/**
 * The balance controller's plan phase (`advancePhysicalBalance`), one for every
 * body whatever its contacts: the pendulum's rate, the plan's capture point and
 * the assessment the settle phase reads. A step out of a fall is the prepared
 * disturbance response's (`preparePhysicalDisturbanceSpan`), never this
 * phase's.
 *
 * - The pendulum's rate is IHMC's omega0, sqrt(g / z0), z0 the authored centre of
 *   mass's height over the floor at the controller's first update, held for the
 *   run as IHMC holds it from its nominal height (201903
 *   `HighLevelHumanoidControllerToolbox` l.155, l.204;
 *   `WalkingControllerParameters.getOmega0` l.45-51), the authored motion being
 *   this engine's nominal.
 * - The plan's capture point is the authored motion's
 *   (`physicalAuthoredCapture`), the authored motion playing the planner's
 *   role, which the root's capture-point controller tracks
 *   (`physicalBipedPressure`).
 * - The assessment is the capture point against the planted contacts' hull
 *   (`physicalSupportSpanContacts.hull`).
 *
 * @param input The recovery's state after the ramp phase, the body's readings,
 *   the stance read from that state and the trace to record into, if any.
 * @returns The state after the plan, a new one; no held goals; and the
 *   assessment the settle phase reads. The input is never written.
 */
export function physicalBalancePlan(input: {
  state: Readonly<IAutoMoviePhysicalRecoveryState>;
  sense: physicalBalancePlan.ISense;
  stance: Pick<physicalBalanceStance.IStance, "planted" | "plane" | "tilt">;
  trace?: IAutoMoviePhysicalBalanceTrace[];
}): physicalBalancePlan.IResult {
  const { sense, stance } = input;
  const state: IAutoMoviePhysicalRecoveryState = { ...input.state };
  const omega: number = (state.omega ??= physicalBalancePlan.omega(
    sense,
    state,
  ));
  state.desired = physicalAuthoredCapture(sense, state, omega);
  const capture: IAutoMovieVector3 = {
    x: sense.center.x + sense.velocity.x / omega,
    y: stance.plane,
    z: sense.center.z + sense.velocity.z / omega,
  };
  const hull: Polygon.IPoint[] = Contacts.hull(
    stance.planted.map(
      (patch: IAutoMoviePhysicalSupportPatch): Contacts.IContact => ({
        bone: patch.bone,
        points: patch.points.map((p: IAutoMovieVector3) => ({
          x: p.x,
          z: p.z,
        })),
      }),
    ),
  );
  const point: Polygon.IPoint = Polygon.local(Contacts.WORLD, capture);
  const outside: number =
    hull.length === 0
      ? Infinity
      : Math.max(0, Polygon.signedDistance(hull, point));
  // Back over its planted support, the body has recovered: the supported
  // state clears the outside clock and a failed landing, as the push
  // recovery's double-support update does when the capture point is inside
  // (`physicalPushRecovery.doubleSupport` l.137-183).
  if (hull.length > 0 && outside === 0) {
    delete state.outsideSince;
    delete state.failedLanding;
  }
  state.last = state.failedLanding ? "unrecoverable" : "supported";
  const assessment: IAutoMoviePhysicalBalance.IResult = {
    state: state.last,
    capturePoint: capture,
    polygon: hull.map((p: Polygon.IPoint): IAutoMovieVector3 => {
      const at: { x: number; z: number } = Polygon.world(Contacts.WORLD, p);
      return { x: at.x, y: stance.plane, z: at.z };
    }),
    outside,
  };
  input.trace?.push({
    kind: "assess",
    seconds: sense.seconds,
    capture: { x: capture.x, z: capture.z },
    spin: { x: 0, z: 0 },
    outside,
    past: false,
    state: state.last,
    ...(state.outsideSince !== undefined ? { since: state.outsideSince } : {}),
    tipping: false,
    tilt: stance.tilt,
  });
  return {
    state,
    goals: Object.create(null) as Record<string, IAutoMovieVector3>,
    assessment,
  };
}

/** The plan phase's result and pendulum rate. */
export namespace physicalBalancePlan {
  /** What the plan reads of the body's readings. */
  export type ISense = physicalAuthoredCapture.ISense &
    Pick<
      physicalBalanceSense.ISense,
      "center" | "velocity" | "gravity" | "floor" | "seconds"
    >;

  /** The plan's result. */
  export interface IResult {
    /** The state after the plan. */
    state: IAutoMoviePhysicalRecoveryState;

    /** The endpoint goals the plan holds, world metres, by bone; none here. */
    goals: Record<string, IAutoMovieVector3>;

    /** The stance's assessment, which the settle phase's policies read. */
    assessment: IAutoMoviePhysicalBalance.IResult;
  }

  /**
   * The pendulum's rate, IHMC's omega0: sqrt(g / z0), z0 the authored centre of
   * mass's height over the floor (`physicalAuthoredCapture.center`).
   *
   * @param sense The body's readings.
   * @param state The recovery's state.
   * @returns The rate, per second.
   */
  export function omega(
    sense: ISense,
    state: Readonly<IAutoMoviePhysicalRecoveryState>,
  ): number {
    return Math.sqrt(
      sense.gravity /
        Math.max(
          1e-6,
          physicalAuthoredCapture.center(sense, state).y - sense.floor,
        ),
    );
  }
}
