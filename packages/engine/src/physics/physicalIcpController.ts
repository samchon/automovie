// Ported from IHMC Open Robotics Software (Apache-2.0), develop:
// ihmc-common-walking-control-modules/src/main/java/us/ihmc/
// commonWalkingControlModules/capturePoint/controller/ICPController.java
// fields l.111-138, initialize() l.232-236, compute() l.280-337,
// applyDeadbandToICPError l.339-351, submitSolverTaskConditions l.353-416,
// solveQP l.418-434, computeUnconstrainedFeedbackCMP l.436-445,
// extractSolutionsFromSolver l.447-460, computeFeedForwardAndFeedBackAlphas
// l.462-488, computeCMPPositions l.490-504 and scaleFeedbackWeightWithGain
// l.506-519; ICPControllerHelper.java l.20-81; CapturePointTools.java
// computeCenterOfMassVelocity l.378-383; parameters from
// zulu/.../ZuluICPControllerParameters.java l.9-114, ICPControllerParameters.java
// l.38-41, l.61-64, l.118-129 and l.145-148, ICPControlGains.java l.10-13,
// IntegratorGains.java (ihmc-robotics-toolkit) l.7-9 and
// WalkingControllerParameters.java l.616-619. See NOTICE.
import { physicalAngularMomentumIntegrator as Integrator } from "./physicalAngularMomentumIntegrator";
import { physicalIcpControllerQp as Qp } from "./physicalIcpControllerQp";
import type { physicalPlanarPolygon as Polygon } from "./physicalPlanarPolygon";

/**
 * One update of IHMC's capture-point feedback controller (`ICPController`): the
 * centre of pressure and the centroidal moment pivot that return the capture
 * point to its plan, from one small quadratic program over the centre of
 * pressure's feedback dCoP and the pivot's offset from it dCMP
 * (`physicalIcpControllerQp`), with Zulu's parameters by default.
 *
 * - Feed-forward: with no planned centre of pressure the perfect pivot is xi_d -
 *   xi_d' / omega and the perfect centre of pressure lies on it, the planned
 *   pivot offset being zero (l.295-308). Zulu's alpha calculators are null, so
 *   the feed-forward and feedback alphas are zero (l.462-488) and the
 *   feed-forward is the perfect point itself (l.372-375).
 * - Error: xi - xi_d, dead-banded along itself (l.315-351); an error within the
 *   band, an exactly zero error under Zulu's zero band included, is zero, the
 *   band's limit there, where the reference divides 0 / 0. A zero error gives a
 *   zero feedback direction, so the program fails and the last solution stays,
 *   as in the reference.
 * - Gains: K = 1 + K_p along and across the plan's motion, carried into the
 *   caller's frame; a plan at rest takes the across gain both ways
 *   (`ICPControllerHelper` l.30-57). The CoP weight is the forward and lateral
 *   weights in the same frame, over the gains' magnitude (l.506-519).
 * - Limits: the feedback's magnitude and rate bounds apply unless the controller
 *   was just initialized or the program has failed five times (l.385-408);
 *   Zulu's gains leave both unbounded (`ICPControlGains` l.10-13). The pivot is
 *   unconstrained, Zulu's distance outside the support not being a number
 *   (`WalkingControllerParameters` l.616-619, `ICPControllerQPSolver`
 *   l.705-727).
 * - Output: the centre of pressure, feed-forward plus dCoP, and the pivot, that
 *   plus dCMP and the smart integral (l.490-504).
 *
 * Points are in one horizontal frame of the caller's, metres; the controller is
 * invariant under its rotations and reflections.
 *
 * @param input The controller's state; the support polygon's vertices, in any
 *   order; the planned capture point and its rate; the capture point and the
 *   centre of mass; the pendulum's rate omega, per second; the control period,
 *   seconds; and the parameters.
 * @returns The state after the update, which holds the program's feedback pair,
 *   the commanded centre of pressure and pivot, and whether the program was
 *   solved.
 */
export function physicalIcpController(input: {
  state: Readonly<physicalIcpController.IState>;
  support: readonly Polygon.IPoint[];
  desired: Polygon.IPoint;
  desiredVelocity: Polygon.IPoint;
  capture: Polygon.IPoint;
  center: Polygon.IPoint;
  omega: number;
  dt: number;
  parameters?: Partial<physicalIcpController.IParameters>;
}): physicalIcpController.IResult {
  const p: physicalIcpController.IParameters = {
    ...physicalIcpController.ZULU,
    ...input.parameters,
  };
  const velocity: Polygon.IPoint = input.desiredVelocity;

  // The centre of mass's velocity omega (xi - c) (l.302;
  // CapturePointTools l.378-383).
  const comVelocity: Polygon.IPoint = {
    x: (input.capture.x - input.center.x) * input.omega,
    y: (input.capture.y - input.center.y) * input.omega,
  };

  // The perfect pivot x_ICP - x_ICP' / omega0 and centre of pressure with no
  // planned centre of pressure and a zero offset (l.304-308).
  const perfectCop: Polygon.IPoint = {
    x: velocity.x * (-1 / input.omega) + input.desired.x,
    y: velocity.y * (-1 / input.omega) + input.desired.y,
  };

  // The dead-banded error (l.315-317, l.339-351).
  const raw: Polygon.IPoint = {
    x: input.capture.x - input.desired.x,
    y: input.capture.y - input.desired.y,
  };
  const magnitude: number = Math.hypot(raw.x, raw.y);
  const error: Polygon.IPoint =
    magnitude <= p.deadband
      ? { x: 0, y: 0 }
      : {
          x: raw.x * ((magnitude - p.deadband) / magnitude),
          y: raw.y * ((magnitude - p.deadband) / magnitude),
        };

  // Gains, weights and the motion-frame transform (l.319, l.361-366,
  // l.506-519); the unconstrained feedback K e (l.436-445).
  const gains: Qp.IMatrix = fromMotion(
    velocity,
    p.kpParallel + 1.0,
    p.kpOrthogonal + 1.0,
  );
  const weight: Qp.IMatrix = fromMotion(
    velocity,
    p.forwardWeight,
    p.lateralWeight,
  );
  const scale: number = p.scaleWeightWithGain
    ? 1.0 /
      (stationary(velocity)
        ? Math.sqrt(2.0 * (p.kpOrthogonal + 1.0) * (p.kpOrthogonal + 1.0))
        : Math.hypot(p.kpParallel + 1.0, p.kpOrthogonal + 1.0))
    : 1.0;
  const feedback: Polygon.IPoint = {
    x: gains[0][0] * error.x + gains[0][1] * error.y,
    y: gains[1][0] * error.x + gains[1][1] * error.y,
  };

  // The feedback limits unless just initialized or failing (l.385-408).
  const limited: boolean =
    !input.state.ignoreRateLimit && input.state.failures < 5;
  const solution: Qp.ISolution | null = Qp({
    error,
    feedForwardCop: perfectCop,
    gains,
    copWeight: [
      [weight[0][0] * scale, weight[0][1] * scale],
      [weight[1][0] * scale, weight[1][1] * scale],
    ],
    cmpWeight: p.cmpWeight,
    dynamicsWeight: p.dynamicsWeight,
    direction: feedback,
    directionWeight: p.directionWeight,
    rateWeight: p.rateWeight / (input.dt * input.dt),
    copCmpRateWeight: p.copCmpRateWeight / (input.dt * input.dt),
    previous: { cop: input.state.copDelta, cmp: input.state.cmpDelta },
    support: input.support,
    safeDistance: p.safeCopDistance,
    maximum: limited
      ? {
          transform: toMotion(velocity),
          x: stationary(velocity)
            ? p.maxFeedbackOrthogonal
            : p.maxFeedbackParallel,
          y: p.maxFeedbackOrthogonal,
        }
      : { transform: IDENTITY, x: Infinity, y: Infinity },
    rate: { limit: limited ? p.maxFeedbackRate : Infinity, dt: input.dt },
  });

  // The new solution only when solved (l.418-434, l.447-460), and the
  // integrator after the solve.
  const copDelta: Polygon.IPoint = solution
    ? solution.cop
    : { ...input.state.copDelta };
  const cmpDelta: Polygon.IPoint = solution
    ? solution.cmp
    : { ...input.state.cmpDelta };
  const integrator: Integrator.IState = Integrator({
    state: input.state.integrator,
    desiredVelocity: velocity,
    velocity: comVelocity,
    error,
    dt: input.dt,
    gains: {
      smart: p.smartIntegrator,
      ki: p.ki,
      threshold: p.stuckThreshold,
      leak: p.integralLeak,
      maximum: p.maxIntegral,
    },
  });

  // The outputs with zero alphas (l.490-504).
  const cop: Polygon.IPoint = {
    x: perfectCop.x + copDelta.x,
    y: perfectCop.y + copDelta.y,
  };
  const cmp: Polygon.IPoint = {
    x: cop.x + cmpDelta.x + integrator.integral.x,
    y: cop.y + cmpDelta.y + integrator.integral.y,
  };
  return {
    state: {
      copDelta,
      cmpDelta,
      integrator,
      ignoreRateLimit: false,
      failures: solution ? input.state.failures : input.state.failures + 1,
    },
    cop,
    cmp,
    converged: solution !== null,
  };
}

/** The controller's state, parameters and result. */
export namespace physicalIcpController {
  /** What the controller keeps between updates. */
  export interface IState {
    /**
     * The last solved centre-of-pressure feedback, metres: the controller's
     * `feedbackCoPDelta` and the solver's previous solution, which change
     * together (l.451-457, `ICPControllerQPSolver` l.582-591).
     */
    copDelta: Polygon.IPoint;

    /** The last solved pivot offset from the centre of pressure, metres. */
    cmpDelta: Polygon.IPoint;

    /** The smart integrator's state. */
    integrator: Integrator.IState;

    /** Whether the controller was just initialized (`ignoreRateLimitThisTick`). */
    ignoreRateLimit: boolean;

    /**
     * How many updates the program has failed (`hasNotConvergedCounts`), never
     * reset.
     */
    failures: number;
  }

  /** The controller's parameters. */
  export interface IParameters {
    /** The CoP feedback's weight along the plan's motion. */
    forwardWeight: number;

    /** Its weight across the motion. */
    lateralWeight: number;

    /** The total feedback's rate weight, before division by dt^2. */
    rateWeight: number;

    /** The CoP and CMP feedbacks' own rate weight, before division by dt^2. */
    copCmpRateWeight: number;

    /** K_p along the plan's motion. */
    kpParallel: number;

    /** K_p across it, and both ways while the plan is at rest. */
    kpOrthogonal: number;

    /** The integrator's gain K_i, per second. */
    ki: number;

    /** The dynamics task's weight. */
    dynamicsWeight: number;

    /** The pivot offset's weight, the angular-momentum minimization weight. */
    cmpWeight: number;

    /** Whether the CoP weights are divided by the gains' magnitude. */
    scaleWeightWithGain: boolean;

    /** The feedback direction task's weight; zero drops it. */
    directionWeight: number;

    /** How far inside the support the centre of pressure stays, metres. */
    safeCopDistance: number;

    /** The capture point error's dead band, metres. */
    deadband: number;

    /** Whether the smart integrator runs. */
    smartIntegrator: boolean;

    /** The speed under which the body is stuck, metres per second. */
    stuckThreshold: number;

    /** The total feedback's bound along the plan's motion, metres. */
    maxFeedbackParallel: number;

    /** Its bound across the motion, and both ways at rest, metres. */
    maxFeedbackOrthogonal: number;

    /** The total feedback's rate bound, metres per second. */
    maxFeedbackRate: number;

    /** The integral's leak ratio per second. */
    integralLeak: number;

    /** The integral's largest length, metres. */
    maxIntegral: number;
  }

  /**
   * Zulu's parameters (`ZuluICPControllerParameters`): weights 0.5 forward and
   * lateral (l.12-24), a rate weight of 1e-8 (l.26-31), K_p 2.5 along and 2.0
   * across with K_i 2.0 (l.33-41), a dynamics weight of 1e4 (l.43-47), an
   * angular-momentum weight of 10 (l.49-54), weights scaled by the gain
   * (l.56-60), the smart integrator with a 0.06 m/s threshold (l.86-96) and a
   * direction weight of 1e6 (l.98-102). Zulu keeps the
   * `ICPControllerParameters` defaults for the rest: no CoP-CMP rate weight
   * (l.38-41), no dead band (l.61-64) and a 2 mm safe distance (l.145-148); the
   * CMP feedback and angular momentum are on (l.118-121, Zulu l.68-72), so the
   * program has four variables. The feedback bounds are `ICPControlGains`'
   * unbounded defaults (l.10-13) and the integral's leak and length
   * `IntegratorGains`' (l.7-9).
   */
  export const ZULU: Readonly<IParameters> = {
    forwardWeight: 0.5,
    lateralWeight: 0.5,
    rateWeight: 1e-8,
    copCmpRateWeight: 0.0,
    kpParallel: 2.5,
    kpOrthogonal: 2.0,
    ki: 2.0,
    dynamicsWeight: 10000.0,
    cmpWeight: 10.0,
    scaleWeightWithGain: true,
    directionWeight: 1e6,
    safeCopDistance: 0.002,
    deadband: 0.0,
    smartIntegrator: true,
    stuckThreshold: 0.06,
    maxFeedbackParallel: Number.POSITIVE_INFINITY,
    maxFeedbackOrthogonal: Number.POSITIVE_INFINITY,
    maxFeedbackRate: Number.POSITIVE_INFINITY,
    integralLeak: 1.0,
    maxIntegral: Number.POSITIVE_INFINITY,
  };

  /** The controller's result. */
  export interface IResult {
    /** The state after the update; its feedback pair is this update's. */
    state: IState;

    /** The commanded centre of pressure, metres. */
    cop: Polygon.IPoint;

    /** The commanded centroidal moment pivot, metres. */
    cmp: Polygon.IPoint;

    /** Whether the program was solved; otherwise the last solution was kept. */
    converged: boolean;
  }

  /**
   * A new controller as constructed (l.111-138): no solution yet, no failure,
   * the rate limit not ignored and the integrator new.
   *
   * @returns The state.
   */
  export function create(): IState {
    return {
      copDelta: { x: 0, y: 0 },
      cmpDelta: { x: 0, y: 0 },
      integrator: Integrator.create(),
      ignoreRateLimit: false,
      failures: 0,
    };
  }

  /**
   * A controller initialized on a walking state's change (l.232-236): the next
   * update ignores the feedback limits and the integrator is reset; the last
   * solution and the failure count are kept.
   *
   * @param state The state to initialize.
   * @returns The state.
   */
  export function initialize(state: Readonly<IState>): IState {
    return {
      copDelta: { ...state.copDelta },
      cmpDelta: { ...state.cmpDelta },
      integrator: Integrator.reset(state.integrator),
      ignoreRateLimit: true,
      failures: state.failures,
    };
  }
}

/** The 2 x 2 identity. */
const IDENTITY: Qp.IMatrix = [
  [1, 0],
  [0, 1],
];

/**
 * Whether the plan's rate is zero: its squared norm under the square of
 * (1e-5)^2 (`ICPControllerHelper.isStationary` l.20, l.78-81).
 */
function stationary(velocity: Polygon.IPoint): boolean {
  const epsilon: number = 1e-5 * 1e-5;
  return velocity.x * velocity.x + velocity.y * velocity.y < epsilon * epsilon;
}

/**
 * The unit frame of the plan's motion: x along its rate, y = z x x
 * (`Vector2dZUpFrame` l.140-158).
 */
function motionAxes(velocity: Polygon.IPoint): {
  x: Polygon.IPoint;
  y: Polygon.IPoint;
} {
  const length: number = Math.hypot(velocity.x, velocity.y);
  const x: Polygon.IPoint = { x: velocity.x / length, y: velocity.y / length };
  return { x, y: { x: -x.y, y: x.x } };
}

/**
 * Diag(along, across) in the plan's motion frame carried to the caller's, R
 * diag R^T with R's columns the motion axes; at rest the across value both ways
 * (`transformFromDynamicsFrame` l.38-57, `transformValues` l.113-124).
 */
function fromMotion(
  velocity: Polygon.IPoint,
  along: number,
  across: number,
): Qp.IMatrix {
  if (stationary(velocity))
    return [
      [across, 0.0],
      [0.0, across],
    ];
  const { x, y } = motionAxes(velocity);
  return [
    [
      along * x.x * x.x + across * y.x * y.x,
      along * x.x * x.y + across * y.x * y.y,
    ],
    [
      along * x.y * x.x + across * y.y * y.x,
      along * x.y * x.y + across * y.y * y.y,
    ],
  ];
}

/**
 * The rotation from the caller's frame into the plan's motion frame, R^T; the
 * identity at rest (`getTransformToDynamicsFrame` l.59-76).
 */
function toMotion(velocity: Polygon.IPoint): Qp.IMatrix {
  if (stationary(velocity)) return IDENTITY;
  const { x, y } = motionAxes(velocity);
  return [
    [x.x, x.y],
    [y.x, y.y],
  ];
}
