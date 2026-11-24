import type {
  IAutoMoviePhysicalBalance,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSupportPatch,
  IAutoMovieQuaternion,
  IAutoMovieStepPlanner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import type { IAutoMoviePhysicalBalanceTrace } from "./IAutoMoviePhysicalBalanceTrace";
import { physicalAuthoredCapture } from "./physicalAuthoredCapture";
import type { physicalBalanceSense } from "./physicalBalanceSense";
import type { physicalBalanceStance } from "./physicalBalanceStance";
import { physicalBipedDesired } from "./physicalBipedDesired";
import { physicalIcpPlanner } from "./physicalIcpPlanner";
import { physicalPlanarPolygon as Polygon } from "./physicalPlanarPolygon";
import { physicalPushRecovery as Recovery } from "./physicalPushRecovery";
import { physicalRecoverySwing } from "./physicalRecoverySwing";

/**
 * The biped controller's plan phase (`advancePhysicalBalance`), IHMC's push
 * recovery from 201903: in double support the decision to step out of a fall
 * and the footstep, in single support the footstep moved into the one-step
 * capture region as the swing goes (`physicalPushRecovery`).
 *
 * - Double support (`BalanceManager.compute` l.447-451,
 *   `DoubSuppToSingSuppCond4DistRecov`): the capture point xi = c + v / omega,
 *   the plain one IHMC feeds back, against the planned one: the recovery
 *   plan's on the soles as they are now, else the authored motion's
 *   (`physicalBipedDesired`). A fall swings the farther foot at once, with no
 *   transfer: the footstep starts at its present pose and is checked against
 *   the capture region over the default swing time, and the single-support
 *   plan is made from the support foot to the footstep
 *   (`WalkingSingleSupportState` l.204-216, `PushRecoveryControlModule
 *   .packFootstepForRecoveringFromDisturbance` l.283-292).
 * - Single support (`WalkingSingleSupportState.doAction` l.136-163): the error
 *   test, then the footstep checked again with the swing time left, the plan
 *   made again from now when it moves.
 *
 * The capture region is the support sole's: its origin the support limb's
 * endpoint, its forward the foot's heading as latched, the support side the one
 * the swing foot is not on, the foot width the support outline's across its
 * forward, and the reach the policy's maximum step. The policy's reaction time,
 * authored reservations and failed-landing retry gate the step as product
 * policy.
 *
 * @param input The recovery's state after the lift phase, the body's readings,
 *   the stance read from that state and the trace to record into, if any.
 * @returns The state after the plan, a new one, the swing's foot lifted when it
 *   triggers; no held goals; and the assessment the settle phase reads.
 */
export function physicalBipedPlan(input: {
  state: Readonly<IAutoMoviePhysicalRecoveryState>;
  sense: physicalBalanceSense.ISense;
  stance: physicalBalanceStance.IStance;
  trace?: IAutoMoviePhysicalBalanceTrace[];
}): physicalBipedPlan.IResult {
  const { sense, stance } = input;
  const state: IAutoMoviePhysicalRecoveryState = { ...input.state };
  let push: Recovery.IState = state.push ?? Recovery.initial();

  // The pendulum's rate, IHMC's omega0, held from the first update
  // (`physicalBipedPlan.omega`).
  const omega: number = (state.omega ??= physicalBipedPlan.omega(sense, state));

  // The capture point and the support, in a world-aligned frame.
  const capture: IAutoMovieVector3 = {
    x: sense.center.x + sense.velocity.x / omega,
    y: stance.plane,
    z: sense.center.z + sense.velocity.z / omega,
  };
  const xi: Polygon.IPoint = Polygon.local(WORLD, capture);
  const hull: Polygon.IPoint[] = Polygon.hull(
    stance.planted.flatMap(
      (patch: IAutoMoviePhysicalSupportPatch): Polygon.IPoint[] =>
        patch.points.map(
          (p: IAutoMovieVector3): Polygon.IPoint => Polygon.local(WORLD, p),
        ),
    ),
  );

  // The plan's capture point: the recovery plan's while one runs, after its
  // transitions, else the authored motion's (`physicalBipedDesired`). The
  // standing state's entry resets the push recovery (201903 `StandingState`
  // l.90).
  const authored: physicalBipedDesired.IDesired = physicalAuthoredCapture(
    sense,
    state,
    omega,
  );
  const advanced: {
    plan?: physicalBipedDesired.IPlan;
    desired: physicalBipedDesired.IDesired;
  } = physicalBipedDesired.advance({
    ...(state.plan
      ? {
          plan: state.plan,
          soles: physicalBipedDesired.soles(sense, state, state.plan),
        }
      : {}),
    seconds: sense.seconds,
    capture: { x: capture.x, z: capture.z },
    authored,
  });
  if (advanced.plan?.phase === "standing" && state.plan?.phase === "toStanding")
    push = Recovery.reset(push);
  if (advanced.plan) state.plan = advanced.plan;
  else delete state.plan;
  let planned: physicalBipedDesired.IDesired = advanced.desired;
  const desired: Polygon.IPoint = Polygon.local(WORLD, planned.position);

  let falling: boolean = false;
  if (!state.swing) {
    const fall: { state: Recovery.IState; swing?: string } =
      Recovery.doubleSupport({
        state: push,
        capture: xi,
        desired,
        support: hull,
        feet: physicalBipedPlan
          .sides(sense, stance)
          .map(
            (
              patch: IAutoMoviePhysicalSupportPatch,
            ): { bone: string; centroid: Polygon.IPoint } => ({
              bone: patch.bone,
              centroid: Polygon.centroid(
                Polygon.hull(
                  patch.points.map(
                    (p: IAutoMovieVector3): Polygon.IPoint =>
                      Polygon.local(WORLD, p),
                  ),
                ),
              ),
            }),
          ),
      });
    push = fall.state;
    falling = fall.swing !== undefined;
    if (falling) state.outsideSince ??= sense.seconds;
    else {
      state.outsideSince = undefined;
      state.failedLanding = undefined;
    }
    const retry: boolean =
      !!sense.policy.bracing &&
      sense.center.y - sense.floor >= sense.policy.bracing.minimumCenterHeight;
    if (
      fall.swing !== undefined &&
      (!state.failedLanding || retry) &&
      !(sense.unavailable ?? []).includes(fall.swing) &&
      sense.seconds - state.outsideSince! >= (sense.policy.reactionSeconds ?? 0)
    ) {
      push = Recovery.fall(push);
      const bone: string = fall.swing;
      const placed: ReturnType<typeof check> = check(
        state,
        sense,
        stance,
        push,
        bone,
        sense.actual(bone),
        physicalBipedPlan.SWING_TIME,
        xi,
        omega,
      );
      push = placed.state;
      const from: IAutoMovieVector3 = sense.actual(bone);
      const step: IAutoMovieStepPlanner.IStep = {
        bone,
        kind: "swing",
        start: sense.seconds,
        end: sense.seconds + physicalBipedPlan.SWING_TIME,
        from: { point: [from.x, from.z], yaw: 0, pitch: 0, clearance: 0 },
        to: {
          point: [placed.target.x, placed.target.z],
          yaw: 0,
          pitch: 0,
          clearance: 0,
        },
      };
      input.trace?.push({
        kind: "trigger",
        seconds: sense.seconds,
        bone,
        capture: { x: capture.x, z: capture.z },
        ...(state.outsideSince !== undefined
          ? { since: state.outsideSince }
          : {}),
        target: { x: placed.target.x, z: placed.target.z },
        duration: physicalBipedPlan.SWING_TIME,
        viable: placed.region.length > 0,
        tipping: false,
      });

      // The recovery plan begins with the swing: single support from the
      // support foot to the footstep (`initializeICPPlanForSingleSupport`),
      // the swing foot on the support's other side, as a biped's are.
      const supportBone: string | undefined = stance.planted.find(
        (patch: IAutoMoviePhysicalSupportPatch): boolean => patch.bone !== bone,
      )?.bone;
      if (supportBone !== undefined) {
        const supportSide: "left" | "right" = physicalBipedDesired.side(
          sense,
          supportBone,
        );
        state.plan = {
          phase: "single",
          since: sense.seconds,
          feet: [
            physicalBipedDesired.foot(sense, state, supportBone, supportSide),
            physicalBipedDesired.foot(
              sense,
              state,
              bone,
              supportSide === "left" ? "right" : "left",
              { x: placed.target.x, y: stance.plane, z: placed.target.z },
            ),
          ],
          omega,
        };
        planned = start(sense, state, state.plan);
      }

      // The swing begins at once: the foot leaves the support; its switch
      // resets as the touchdown phase next reads it (`physicalBipedTouchdown`).
      const seating: NonNullable<IAutoMoviePhysicalRecoveryState["seating"]> = {
        ...state.seating,
      };
      input.trace?.push({
        kind: "lift",
        seconds: sense.seconds,
        bone,
        load: seating[bone]?.load ?? 0,
        bearing: seating[bone]?.bearing ?? 1,
      });
      delete seating[bone];
      state.seating = seating;
      state.swing = step;
      state.steps = [...state.steps, structuredClone(step)];
      state.failedLanding = undefined;
      state.revision = (state.revision ?? 0) + 1;
    }
  } else if (!state.seating?.[state.swing.bone]) {
    // Single support: the error, then the footstep again (l.136-160).
    push = Recovery.singleSupport({ state: push, capture: xi, desired });
    const swing: IAutoMovieStepPlanner.IStep = state.swing;
    const target: IAutoMovieVector3 = {
      x: swing.to.point[0],
      y: stance.plane,
      z: swing.to.point[1],
    };
    const moved: ReturnType<typeof check> = check(
      state,
      sense,
      stance,
      push,
      swing.bone,
      target,
      swing.end - sense.seconds,
      xi,
      omega,
    );
    push = moved.state;
    if (moved.adjusted) {
      const to: IAutoMovieStepPlanner.IStep["to"] = {
        ...swing.to,
        point: [moved.target.x, moved.target.z],
      };
      state.swing = { ...swing, to };
      const at: number = physicalRecoverySwing.record(state.steps, swing.bone);
      if (at >= 0)
        state.steps = state.steps.map(
          (
            recorded: IAutoMoviePhysicalRecoveryState["steps"][number],
            index: number,
          ): IAutoMoviePhysicalRecoveryState["steps"][number] =>
            index === at
              ? { ...recorded, to: { ...recorded.to, point: [...to.point] } }
              : recorded,
        );
      state.revision = (state.revision ?? 0) + 1;

      // The plan is made again from now with the moved footstep (201903
      // `WalkingSingleSupportState` l.150-163).
      if (state.plan?.phase === "single") {
        state.plan = {
          ...state.plan,
          since: sense.seconds,
          feet: [
            state.plan.feet[0]!,
            physicalBipedDesired.foot(
              sense,
              state,
              swing.bone,
              state.plan.feet[1]!.side,
              { x: moved.target.x, y: stance.plane, z: moved.target.z },
            ),
          ],
        };
        planned = start(sense, state, state.plan);
      }
    }
  }
  state.push = push;
  state.desired = planned;

  // The assessment the settle phase's policies read: the support hull and the
  // capture point against it.
  const polygon: IAutoMovieVector3[] = hull.map(
    (p: Polygon.IPoint): IAutoMovieVector3 => {
      const at: { x: number; z: number } = Polygon.world(WORLD, p);
      return { x: at.x, y: stance.plane, z: at.z };
    },
  );
  const outside: number =
    hull.length === 0
      ? Infinity
      : Math.max(0, Polygon.signedDistance(hull, xi));
  state.last = state.failedLanding
    ? "unrecoverable"
    : state.swing || falling
      ? "recovery"
      : "supported";
  const assessment: IAutoMoviePhysicalBalance.IResult = {
    state: state.last,
    capturePoint: capture,
    polygon,
    outside,
  };
  input.trace?.push({
    kind: "assess",
    seconds: sense.seconds,
    capture: { x: capture.x, z: capture.z },
    spin: { x: 0, z: 0 },
    outside,
    past: falling,
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

/** The biped plan's result, constants, pendulum rate and feet's sides. */
export namespace physicalBipedPlan {
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
   * The biped's pendulum rate, IHMC's omega0: sqrt(g / z0), z0 the authored
   * centre of mass's height over the floor (`physicalAuthoredCapture.center`).
   * IHMC sets omega0 once per robot from its nominal height and never updates
   * it (201903 `HighLevelHumanoidControllerToolbox` l.155, l.204, l.1027-1029;
   * `WalkingControllerParameters.getOmega0` l.45-51, "not computed from the
   * actual CoM height"); the authored motion is this engine's nominal, read on
   * the controller's first update and held in the state for the run. Zulu's
   * 3.0 (`ZuluWalkingControllerParameters` l.147-150) is that robot's height
   * and tuning, not this body's.
   *
   * @param sense The body's readings.
   * @param state The recovery's state.
   * @returns The rate, per second.
   */
  export function omega(
    sense: physicalBalanceSense.ISense,
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

  /**
   * The recovery swing's time, seconds: Zulu's default swing time
   * (ZuluWalkingControllerParameters l.709-712), which IHMC 201903 gives a
   * swing out of a double-support fall (`WalkingSingleSupportState`
   * l.206-216).
   */
  export const SWING_TIME: number = 0.6;

  /**
   * The planted feet, left first, as IHMC's sides list them: left of the
   * stance's heading is up x forward.
   *
   * @param sense The body's readings.
   * @param stance The stance.
   * @returns The planted patches, the leftmost first.
   */
  export function sides(
    sense: physicalBalanceSense.ISense,
    stance: physicalBalanceStance.IStance,
  ): IAutoMoviePhysicalSupportPatch[] {
    const left: { x: number; z: number } = {
      x: stance.heading.z,
      z: -stance.heading.x,
    };
    return [...stance.planted].sort(
      (
        a: IAutoMoviePhysicalSupportPatch,
        b: IAutoMoviePhysicalSupportPatch,
      ): number =>
        b.position.x * left.x +
          b.position.z * left.z -
          (a.position.x * left.x + a.position.z * left.z) ||
        sense.limbs.findIndex(
          (limb: physicalBalanceSense.ILimb): boolean => limb.bone === a.bone,
        ) -
          sense.limbs.findIndex(
            (limb: physicalBalanceSense.ILimb): boolean => limb.bone === b.bone,
          ),
    );
  }
}

/** The world-aligned frame the plan's polygons use. */
const WORLD: Polygon.IFrame = {
  origin: { x: 0, z: 0 },
  forward: { x: 0, z: 1 },
};

/** A plan's capture point and rate as it starts, on the soles as they are. */
function start(
  sense: physicalBalanceSense.ISense,
  state: Readonly<IAutoMoviePhysicalRecoveryState>,
  plan: Readonly<physicalBipedDesired.IPlan>,
): physicalBipedDesired.IDesired {
  const output: physicalIcpPlanner.IOutput = physicalIcpPlanner(
    physicalBipedDesired.build(plan),
    0,
    physicalBipedDesired.soles(sense, state, plan),
  );
  return { position: output.position, velocity: output.velocity };
}

/**
 * The footstep checked against the support foot's one-step capture region
 * (`physicalPushRecovery.checkAndUpdate`), in the support sole's frame.
 */
function check(
  state: Readonly<IAutoMoviePhysicalRecoveryState>,
  sense: physicalBalanceSense.ISense,
  stance: physicalBalanceStance.IStance,
  push: Recovery.IState,
  bone: string,
  position: IAutoMovieVector3,
  remaining: number,
  xi: Polygon.IPoint,
  omega: number,
): {
  state: Recovery.IState;
  target: { x: number; z: number };
  region: Polygon.IPoint[];
  adjusted: boolean;
} {
  const support: IAutoMoviePhysicalSupportPatch | undefined =
    stance.planted.find(
      (patch: IAutoMoviePhysicalSupportPatch): boolean => patch.bone !== bone,
    );
  if (!support)
    return {
      state: push,
      target: { x: position.x, z: position.z },
      region: [],
      adjusted: false,
    };

  // The support sole's frame: its endpoint, its latched heading.
  const origin: IAutoMovieVector3 = sense.actual(support.bone);
  const anchor: IAutoMovieQuaternion | undefined =
    state.seating?.[support.bone]?.anchor?.rotation;
  const turned: IAutoMovieVector3 = anchor
    ? Quaternion.rotateVector(
        Quaternion.multiply(
          anchor,
          Quaternion.inverse(sense.targets[support.bone]!.rotation),
        ),
        { x: 0, y: 0, z: 1 },
      )
    : stance.heading;
  const length: number = Math.hypot(turned.x, turned.z);
  const frame: Polygon.IFrame = {
    origin: { x: origin.x, z: origin.z },
    forward:
      length > 0
        ? { x: turned.x / length, z: turned.z / length }
        : { x: 0, z: 1 },
  };
  const foot: Polygon.IPoint[] = Polygon.hull(
    support.points.map(
      (p: IAutoMovieVector3): Polygon.IPoint => Polygon.local(frame, p),
    ),
  );
  const footWidth: number =
    Math.max(...foot.map((p: Polygon.IPoint): number => p.y)) -
    Math.min(...foot.map((p: Polygon.IPoint): number => p.y));
  const at: Polygon.IPoint = Polygon.local(frame, position);
  const swinging: Polygon.IPoint = Polygon.local(frame, sense.actual(bone));
  const outline: Polygon.IPoint[] = Polygon.hull(
    sense
      .footprint(sense.limb(bone), state, position)
      .points.map(
        (p: IAutoMovieVector3): Polygon.IPoint => Polygon.local(frame, p),
      ),
  );
  const result: ReturnType<typeof Recovery.checkAndUpdate> =
    Recovery.checkAndUpdate({
      state: push,
      remaining,
      dt: sense.dt,
      region: {
        support: swinging.y > 0 ? "right" : "left",
        capture: Polygon.local(frame, Polygon.world(WORLD, xi)),
        omega,
        foot,
        footWidth,
        range: sense.policy.maximumStep,
      },
      position: at,
      outline,
    });
  return {
    ...result,
    target: Polygon.world(frame, result.position),
  };
}
