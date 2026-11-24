import type {
  IAutoMoviePhysicalBalance,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSupportPatch,
  IAutoMovieStepPlanner,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMoviePhysicalBalanceTrace } from "./IAutoMoviePhysicalBalanceTrace";
import { physicalAuthoredCapture } from "./physicalAuthoredCapture";
import type { physicalBalanceSense } from "./physicalBalanceSense";
import type { physicalBalanceStance } from "./physicalBalanceStance";
import { physicalGlitchFilter as Glitch } from "./physicalGlitchFilter";
import { physicalPlanarPolygon as Polygon } from "./physicalPlanarPolygon";
import { physicalPushRecovery as Recovery } from "./physicalPushRecovery";
import { physicalQuadFrame as Frame } from "./physicalQuadFrame";
import { physicalQuadrupedDcmPlanner as DcmPlanner } from "./physicalQuadrupedDcmPlanner";
import { physicalQuadrupedStep as Step } from "./physicalQuadrupedStep";
import { physicalQuadrupedStepAdjustment as Adjustment } from "./physicalQuadrupedStepAdjustment";
import { physicalQuadrupedXGaitPlanner as XGait } from "./physicalQuadrupedXGaitPlanner";
import { physicalRecoverySwing } from "./physicalRecoverySwing";

/**
 * The quadruped controller's plan phase (`advancePhysicalBalance`), IHMC
 * 201903's quadruped step controller (`QuadrupedStepController`) entered by
 * the biped's push recovery trigger.
 *
 * The LIPM height is the desired centre of mass's over the support frame
 * (`QuadrupedBalanceManager.compute` l.297-305, `updateLipmHeightFromDesireds`
 * l.76, `QuadrupedCenterOfMassHeightManager.getDesiredHeight` l.314-318),
 * the desired being the authored centre of mass here (`physicalAuthoredCapture
 * .center`), and omega = sqrt(g / height) (`LinearInvertedPendulumModel`),
 * written to the state for the root's demand. Standing, the DCM setpoint is
 * the authored capture point (`physicalAuthoredCapture`): IHMC's standing
 * setpoint is the support frame's origin (`DCMPlanner.computeDcmSetpoints`
 * l.251-257), and the authored motion plays the planner here as it does for
 * the biped.
 *
 * - Standing: IHMC 201903's quadruped has no push recovery, so the biped's
 *   trigger is reused over the planted feet (`physicalPushRecovery
 *   .doubleSupport`, `PushRecoveryControlModule.updateForDoubleSupport`
 *   l.137-183): the capture point outside the support polygon and over 0.05 m
 *   from its plan enters stepping (`QuadrupedStepController.onEntry` l.50-70):
 *   the xGait stream from the support frame, its stance the feet's
 *   (`physicalQuadrupedXGaitPlanner.entry`), whose first step lifts 0.5 s
 *   later (`QuadrupedStepTeleopManager` l.60), a known risk the reference
 *   carries: the stream is the 201903 quadruped's only path that starts
 *   steps; every foot in support, its first trigger to come
 *   (`QuadrupedFeetManager.reset`, `requestFullContact`); and the DCM planner
 *   stepping from the setpoint so far (`QuadrupedBalanceManager
 *   .initializeForStepping` l.282-290). The setpoint this update is still the
 *   standing one, as IHMC's state machine enters a state after the update's
 *   action.
 * - Stepping (`QuadrupedStepController.doAction` l.72-102): the stream
 *   updated and its steps sorted by touchdown, those starting past a halt
 *   pruned (`QuadrupedStepMessageHandler.process` l.68-75,
 *   `handleQuadrupedTimedStepListCommand` l.97, `pruneHaltedSteps`
 *   l.147-155); each step under way lifts its leg when the foot is in
 *   support and its trigger is valid, the foot's first or after 0.15 s of
 *   support (`QuadrupedFeetManager.triggerSteps`, `QuadrupedFootControlModule
 *   .triggerStep` l.145-166); the DCM planner's setpoint over the legs'
 *   contact (`QuadrupedBalanceManager.compute` l.297-322); and the steps
 *   under way adjusted and projected against crossing, an adjusted swing's
 *   target following (l.89-97, `QuadrupedStepAdjustmentController`). The
 *   biped's back-to-safe rule halts the gait (`PushRecoveryControlModule`
 *   l.101, `WalkingHighLevelHumanoidController` l.625-628,
 *   `QuadrupedStepMessageHandler.halt` l.182-189 with no transition, l.40),
 *   and the gait ends with its last step (`isDoneWithStepSequence`
 *   l.162-166), the push recovery reset as the biped's standing state resets
 *   it (`StandingState` l.90).
 *
 * The policy's reaction time, failed-landing retry and authored reservations
 * gate the trigger and each lift as product policy, as the biped's do. The
 * known non-ports of the 201903 controller are the DCM planner's: the swing
 * speed-up, the step message handler's shift and the body ICP offset.
 *
 * @param input The recovery's state after the touchdown and ramp phases, the
 *   body's readings, the stance read from that state and the trace to record
 *   into, if any.
 * @returns The state after the plan, a new one; no held goals; and the
 *   assessment the settle phase reads. The input is never written.
 */
export function physicalQuadPlan(input: {
  state: Readonly<IAutoMoviePhysicalRecoveryState>;
  sense: physicalBalanceSense.ISense;
  stance: physicalBalanceStance.IStance;
  trace?: IAutoMoviePhysicalBalanceTrace[];
}): physicalQuadPlan.IResult {
  const { sense, stance } = input;
  const state: IAutoMoviePhysicalRecoveryState = { ...input.state };
  let push: Recovery.IState = state.push ?? Recovery.initial();
  const quadrants: Record<string, Step.Quadrant> | undefined =
    state.gait?.quadrants ?? Frame.quadrants(sense);
  const soles: Record<Step.Quadrant, Step.IPoint> | undefined = quadrants
    ? Frame.soles(sense, quadrants)
    : undefined;
  const support: Step.IPose | undefined = soles
    ? Step.support(soles)
    : undefined;

  // The LIPM height, the desired centre of mass's over the support frame:
  // IHMC's desired height is its nominal one held in the support frame
  // (`QuadrupedCenterOfMassHeightManager.initialize` l.203-217, `update`
  // l.246-249), here the authored centre of mass's over the authored soles'
  // support frame; and its rate.
  const ground: number = support?.position.z ?? stance.plane;
  const nominal: number = quadrants
    ? Step.support(Frame.soles(sense, quadrants, true)).position.z
    : stance.plane;
  const height: number = Math.max(
    1e-6,
    physicalAuthoredCapture.center(sense, state).y - nominal,
  );
  const omega: number = Math.sqrt(sense.gravity / height);
  state.omega = omega;

  // The DCM estimate and the planted support, in a world-aligned frame.
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
  const feet: { bone: string; centroid: Polygon.IPoint }[] = stance.planted.map(
    (patch: IAutoMoviePhysicalSupportPatch) => ({
      bone: patch.bone,
      centroid: Polygon.centroid(
        Polygon.hull(
          patch.points.map(
            (p: IAutoMovieVector3): Polygon.IPoint => Polygon.local(WORLD, p),
          ),
        ),
      ),
    }),
  );
  const authored: physicalAuthoredCapture.IDesired = physicalAuthoredCapture(
    sense,
    state,
    omega,
  );
  let desired: physicalAuthoredCapture.IDesired = authored;
  let falling: boolean = false;

  if (!state.gait) {
    const fall: { state: Recovery.IState; swing?: string } =
      Recovery.doubleSupport({
        state: push,
        capture: xi,
        desired: Polygon.local(WORLD, authored.position),
        support: hull,
        feet,
        dt: sense.dt,
        period: physicalQuadPlan.CONTROL_DT,
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
      falling &&
      quadrants &&
      soles &&
      support &&
      (!state.failedLanding || retry) &&
      sense.seconds - state.outsideSince! >= (sense.policy.reactionSeconds ?? 0)
    ) {
      push = Recovery.fall(push);
      state.gait = enter({
        sense,
        quadrants,
        soles,
        support,
        ground,
        height,
        omega,
        previous: input.state.desired ?? authored,
      });
      const first: Step.IStep = XGait.steps(state.gait.stream, sense.seconds)
        .sort(byEnd)[0]!;
      const target: IAutoMovieVector3 = Frame.world(first.goal);
      input.trace?.push({
        kind: "trigger",
        seconds: sense.seconds,
        bone: Frame.bones(quadrants)[first.quadrant],
        capture: { x: capture.x, z: capture.z },
        ...(state.outsideSince !== undefined
          ? { since: state.outsideSince }
          : {}),
        target: { x: target.x, z: target.z },
        duration: first.end - first.start,
        viable: true,
        tipping: false,
      });
      state.failedLanding = undefined;
      state.revision = (state.revision ?? 0) + 1;
    }
  } else {
    const stepped: ReturnType<typeof step> = step({
      state,
      sense,
      gait: state.gait,
      soles: soles!,
      ground,
      height,
      omega,
      capture,
      standing: authored,
      ...(input.trace ? { trace: input.trace } : {}),
    });
    desired = stepped.desired;

    // The back-to-safe rule halts the gait once the capture point has been
    // back near its plan for the safe window.
    push = Recovery.doubleSupport({
      state: push,
      capture: xi,
      desired: Polygon.local(WORLD, desired.position),
      support: hull,
      feet,
      dt: sense.dt,
      period: physicalQuadPlan.CONTROL_DT,
    }).state;
    if (push.safe.value && stepped.gait.halt === undefined)
      stepped.gait.halt = sense.seconds;
    if (stepped.done) {
      delete state.gait;
      push = Recovery.reset(push);
    } else state.gait = stepped.gait;
  }
  state.push = push;
  state.desired = desired;

  // The assessment the settle phase's policies read.
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
    : state.gait || falling
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

/** The quadruped plan's result and constant. */
export namespace physicalQuadPlan {
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
   * How long a foot stays in support after a touchdown before a step can
   * trigger it again, seconds (`QuadrupedFootControlModule
   * .supportToSwingGlitchWindow`, l.48).
   */
  export const GLITCH_WINDOW: number = 0.15;

  /**
   * The generic quadruped's controller period, seconds, over which IHMC's
   * windows count updates (`GenericQuadrupedSimulationFactory.CONTROL_DT`,
   * l.38): the reused safe window here and the touchdown trigger's
   * (`physicalQuadTouchdown`).
   */
  export const CONTROL_DT: number = 0.001;
}

/** The world-aligned frame the plan's polygons use. */
const WORLD: Polygon.IFrame = {
  origin: { x: 0, z: 0 },
  forward: { x: 0, z: 1 },
};

/** Steps in touchdown order (`TimeIntervalTools.endTimeComparator`). */
function byEnd(a: Step.IStep, b: Step.IStep): number {
  return a.end - b.end;
}

/**
 * Stepping's entry (`QuadrupedStepController.onEntry` l.50-70): the stream
 * from the support frame with the stance the soles stand at, measured along
 * and across it as the stream lays its corners, every foot in support with its
 * first trigger to come, the DCM planner stepping from the previous setpoint
 * and rate, and no step adjusted.
 */
function enter(input: {
  sense: physicalBalanceSense.ISense;
  quadrants: Record<string, Step.Quadrant>;
  soles: Record<Step.Quadrant, Step.IPoint>;
  support: Step.IPose;
  ground: number;
  height: number;
  omega: number;
  previous: physicalAuthoredCapture.IDesired;
}): IAutoMoviePhysicalRecoveryState.IGait {
  const { sense, soles, support } = input;
  const cos: number = Math.cos(support.yaw);
  const sin: number = Math.sin(support.yaw);
  const local = (q: Step.Quadrant): { x: number; y: number } => {
    const dx: number = soles[q].x - support.position.x;
    const dy: number = soles[q].y - support.position.y;
    return { x: cos * dx + sin * dy, y: -sin * dx + cos * dy };
  };
  const fl = local("frontLeft");
  const fr = local("frontRight");
  const hr = local("hindRight");
  const hl = local("hindLeft");
  const stream: XGait.IState = XGait.entry({
    time: sense.seconds,
    settings: {
      stanceLength: (fl.x - hl.x + (fr.x - hr.x)) / 2,
      stanceWidth: (fl.y - fr.y + (hl.y - hr.y)) / 2,
    },
    support,
    height: input.ground,
  });
  const contact: Record<Step.Quadrant, boolean> = {
    frontLeft: true,
    frontRight: true,
    hindRight: true,
    hindLeft: true,
  };
  const foot = (): IAutoMoviePhysicalRecoveryState.IGait["feet"]["frontLeft"] => ({
    first: true,
    since: sense.seconds,
    trigger: Glitch.set(),
  });
  return {
    quadrants: input.quadrants,
    stream,
    dcm: DcmPlanner.stepping({
      state: DcmPlanner.standing(),
      steps: XGait.steps(stream, sense.seconds).sort(byEnd),
      soles,
      contact,
      time: sense.seconds,
      comHeight: input.height,
      gravity: sense.gravity,
      position: Frame.ihmc({
        x: input.previous.position.x,
        y: input.ground + input.height,
        z: input.previous.position.z,
      }),
      velocity: Frame.ihmc({
        x: input.previous.velocity.x,
        y: 0,
        z: input.previous.velocity.z,
      }),
    }),
    adjustment: Adjustment.initial(),
    feet: {
      frontLeft: foot(),
      frontRight: foot(),
      hindRight: foot(),
      hindLeft: foot(),
    },
  };
}

/**
 * One stepping update (`QuadrupedStepController.doAction` l.72-102) on the
 * phase's own state: the steps, the lifts, the DCM setpoint and the step
 * adjustment; and whether the step sequence is done
 * (`QuadrupedStepMessageHandler.isDoneWithStepSequence` l.162-166).
 */
function step(input: {
  state: IAutoMoviePhysicalRecoveryState;
  sense: physicalBalanceSense.ISense;
  gait: Readonly<IAutoMoviePhysicalRecoveryState.IGait>;
  soles: Record<Step.Quadrant, Step.IPoint>;
  ground: number;
  height: number;
  omega: number;
  capture: IAutoMovieVector3;
  standing: physicalAuthoredCapture.IDesired;
  trace?: IAutoMoviePhysicalBalanceTrace[];
}): {
  gait: IAutoMoviePhysicalRecoveryState.IGait;
  desired: physicalAuthoredCapture.IDesired;
  done: boolean;
} {
  const { state, sense } = input;
  const now: number = sense.seconds;
  const bones: Record<Step.Quadrant, string> = Frame.bones(input.gait.quadrants);
  const gait: IAutoMoviePhysicalRecoveryState.IGait = {
    ...input.gait,
    stream: XGait({ state: input.gait.stream, time: now, height: input.ground }),
    feet: { ...input.gait.feet },
  };
  const halt: number | undefined = gait.halt;
  const steps: Step.IStep[] = XGait.steps(gait.stream, now)
    .sort(byEnd)
    .filter((s: Step.IStep): boolean => halt === undefined || !(s.start > halt));
  const active: Step.IStep[] = steps.filter(
    (s: Step.IStep): boolean => s.start <= now && now <= s.end,
  );

  // No step left is the controller's done state; the planner is not asked
  // for a plan of one interval, and the standing setpoint serves.
  if (steps.length === 0)
    return { gait, desired: input.standing, done: true };

  // Each step under way lifts its leg, when the foot is in support and its
  // trigger is valid.
  const swings: Record<string, IAutoMovieStepPlanner.IStep> = {
    ...state.swings,
  };
  for (const planned of active) {
    const bone: string = bones[planned.quadrant];
    if (swings[bone]) continue;
    const foot: IAutoMoviePhysicalRecoveryState.IGait["feet"]["frontLeft"] =
      gait.feet[planned.quadrant];
    if (!foot.first && !(now - foot.since > physicalQuadPlan.GLITCH_WINDOW))
      continue;
    if ((sense.unavailable ?? []).includes(bone)) continue;
    const from: IAutoMovieVector3 = sense.actual(bone);
    const goal: IAutoMovieVector3 = Frame.world(planned.goal);
    const lifted: IAutoMovieStepPlanner.IStep = {
      bone,
      kind: "swing",
      start: planned.start,
      end: planned.end,
      from: { point: [from.x, from.z], yaw: 0, pitch: 0, clearance: 0 },
      to: {
        point: [goal.x, goal.z],
        yaw: 0,
        pitch: 0,
        clearance: planned.groundClearance,
      },
    };
    input.trace?.push({
      kind: "lift",
      seconds: now,
      bone,
      load: state.seating?.[bone]?.load ?? 0,
      bearing: state.seating?.[bone]?.bearing ?? 1,
    });
    const seating: NonNullable<IAutoMoviePhysicalRecoveryState["seating"]> = {
      ...state.seating,
    };
    delete seating[bone];
    state.seating = seating;
    swings[bone] = lifted;
    state.steps = [...state.steps, structuredClone(lifted)];
    gait.feet[planned.quadrant] = {
      first: false,
      since: now,
      trigger: Glitch.set(false),
    };
    state.revision = (state.revision ?? 0) + 1;
  }

  // The DCM setpoint over the legs' contact.
  const contact: Record<Step.Quadrant, boolean> = {
    frontLeft: !swings[bones.frontLeft],
    frontRight: !swings[bones.frontRight],
    hindRight: !swings[bones.hindRight],
    hindLeft: !swings[bones.hindLeft],
  };
  const planned: DcmPlanner.IResult = DcmPlanner({
    state: gait.dcm,
    steps,
    soles: input.soles,
    contact,
    time: now,
    comHeight: input.height,
    gravity: sense.gravity,
  });
  gait.dcm = planned.state;
  const position: IAutoMovieVector3 = Frame.world(planned.position);
  const velocity: IAutoMovieVector3 = Frame.world(planned.velocity);

  // The steps under way adjusted and projected; an adjusted swing's target
  // follows (`QuadrupedFeetManager.adjustSteps`).
  const adjusted: Adjustment.IResult = Adjustment({
    state: gait.adjustment,
    steps: active,
    desired: planned.position,
    estimate: Frame.ihmc({
      x: input.capture.x,
      y: sense.center.y + sense.velocity.y / input.omega,
      z: input.capture.z,
    }),
    time: now,
    omega: input.omega,
    dt: sense.dt,
    soles: input.soles,
    body: Frame.body(sense),
  });
  gait.adjustment = adjusted.state;
  if (adjusted.adjusted)
    for (const moved of adjusted.steps) {
      const bone: string = bones[moved.quadrant];
      const swing: IAutoMovieStepPlanner.IStep | undefined = swings[bone];
      if (!swing) continue;
      const goal: IAutoMovieVector3 = Frame.world(moved.goal);
      const to: IAutoMovieStepPlanner.IStep["to"] = {
        ...swing.to,
        point: [goal.x, goal.z],
      };
      swings[bone] = { ...swing, to };
      const at: number = physicalRecoverySwing.record(state.steps, bone);
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
    }
  if (Object.keys(swings).length > 0) state.swings = swings;
  else delete state.swings;
  const last: Step.IStep = steps[steps.length - 1]!;
  return {
    gait,
    desired: {
      position: { x: position.x, z: position.z },
      velocity: { x: velocity.x, z: velocity.z },
    },
    done: last.end < now,
  };
}
