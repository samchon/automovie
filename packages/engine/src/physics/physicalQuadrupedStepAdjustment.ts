// Ported from IHMC Open Robotics Software, tag 201903_Stable (Apache-2.0):
// ihmc-quadruped-robotics/src/main/java/us/ihmc/quadrupedRobotics/
// controlModules/QuadrupedStepAdjustmentController.java l.36, l.43-47,
// l.67-85, completedStep l.96-101 and computeStepAdjustment l.103-176;
// planning/QuadrupedStepCrossoverProjection.java l.26-27 and project l.37-61;
// ihmc-robotics-toolkit/.../math/filters/RateLimitedYoFrameVector.java
// l.75-78 and update l.102-119; ihmc-robotics-toolkit/.../math/
// DeadbandTools.java l.39-53; euclid 0.11.0 tuple3D/interfaces/
// Vector3DBasics.java l.39 and clipToMaxLength l.113-128. See NOTICE.
import { physicalQuadrupedStep as Step } from "./physicalQuadrupedStep";

/**
 * One update of IHMC's quadruped step adjustment: each swinging step's goal
 * moves along the DCM error by that error's growth to touchdown, rate limited,
 * then is kept from crossing the other leg of its end
 * (`QuadrupedStepAdjustmentController.computeStepAdjustment`).
 *
 * The target is recomputed when adjustment is on, the DCM error passes its
 * threshold or the step was already adjusted, and the error passes its deadband
 * (l.137-141); it is kept when only the deadband fails and zeroed when the
 * first test fails (l.159-162). With the error e = xi_d - xi, the minimum
 * multiplier m and T seconds left to touchdown, the horizontal target is
 * (l.143-150)
 *
 *     delta = -gain (m + (1 - m) exp(omega T)) e
 *
 * The applied adjustment moves toward the target by at most the rate limit
 * times the update period, starting from zero at each step (l.129-133,
 * `RateLimitedYoFrameVector`). The adjusted goal is projected by
 * {@link physicalQuadrupedStepAdjustment.project}.
 *
 * The adjusted flag is the last deadband test's outcome among the steps
 * (l.152-156), as the reference keeps it. The controller's shift of the next
 * queued step by a landed adjustment (QuadrupedStepMessageHandler l.170-180) is
 * a known non-port, listed with the DCM planner's.
 *
 * @param input The adjustment's state, the swinging steps, the DCM setpoint and
 *   estimate, metres, the controller's time, seconds, the pendulum's natural
 *   frequency, per second, the update period, seconds, the soles and the body's
 *   z-up frame for the projection, and the parameters, the reference's by
 *   default.
 * @returns The state after the update, the steps with adjusted goals, and
 *   whether a step was adjusted.
 */
export function physicalQuadrupedStepAdjustment(input: {
  state: Readonly<physicalQuadrupedStepAdjustment.IState>;
  steps: readonly Step.IStep[];
  desired: Step.IPoint;
  estimate: Step.IPoint;
  time: number;
  omega: number;
  dt: number;
  soles: Readonly<Record<Step.Quadrant, Step.IPoint>>;
  body: Step.IPose;
  parameters?: Partial<physicalQuadrupedStepAdjustment.IParameters>;
}): physicalQuadrupedStepAdjustment.IResult {
  const p: physicalQuadrupedStepAdjustment.IParameters = {
    ...physicalQuadrupedStepAdjustment.DEFAULTS,
    ...input.parameters,
  };
  const error: Step.IPoint = subtract(input.desired, input.estimate);
  const state: physicalQuadrupedStepAdjustment.IState = { ...input.state };
  const steps: Step.IStep[] = [];
  let adjusted: boolean = false;

  for (const step of input.steps) {
    const quadrant: Step.Quadrant = step.quadrant;
    let leg: physicalQuadrupedStepAdjustment.ILeg = { ...state[quadrant] };

    // A step not yet adjusted starts its applied adjustment at zero: the
    // limiter's update from a target that is not a number leaves not a
    // number, which the reference then zeroes (l.129-133).
    if (nan(leg.instantaneous))
      leg = { ...leg, limited: { ...ZERO }, called: true };

    if (
      p.useStepAdjustment &&
      (length(error) > p.dcmErrorThresholdForStepAdjustment ||
        length(leg.instantaneous) > 0.0)
    ) {
      // DeadbandTools.applyDeadband gates on the error's length only; the
      // target uses the raw error (l.139-150).
      if (!(length(error) < p.dcmErrorDeadbandForStepAdjustment)) {
        const remaining: number = Math.max(step.end - input.time, 0.0);
        const recursion: number = Math.exp(remaining * input.omega);
        const multiplier: number =
          p.dcmStepAdjustmentGain *
          (p.minimumFootstepMultiplier +
            (1.0 - p.minimumFootstepMultiplier) * recursion);
        leg = {
          ...leg,
          instantaneous: {
            x: error.x * -multiplier,
            y: error.y * -multiplier,
            z: 0,
          },
        };
        adjusted = true;
      } else adjusted = false;
    } else leg = { ...leg, instantaneous: { ...ZERO } };

    leg = { ...leg, ...limit(leg, p.maxStepAdjustmentRate * input.dt) };
    state[quadrant] = leg;
    steps.push({
      ...step,
      goal: physicalQuadrupedStepAdjustment.project({
        goal: add(step.goal, leg.limited),
        quadrant,
        soles: input.soles,
        body: input.body,
        parameters: p,
      }),
    });
  }
  return { state, steps, adjusted };
}

/** The adjustment's state, parameters and entries. */
export namespace physicalQuadrupedStepAdjustment {
  /** One leg's adjustment between updates. */
  export interface ILeg {
    /**
     * The target adjustment, metres; not a number until the leg's step is first
     * updated.
     */
    instantaneous: Step.IPoint;

    /** The applied, rate-limited adjustment, metres. */
    limited: Step.IPoint;

    /** Whether the limiter has been updated since construction. */
    called: boolean;
  }

  /** Every leg's adjustment. */
  export type IState = Record<Step.Quadrant, ILeg>;

  /** An update's outputs. */
  export interface IResult {
    /** The state after the update, a new one. */
    state: IState;

    /** The swinging steps in input order, goals adjusted and projected. */
    steps: Step.IStep[];

    /** Whether the last deadband test passed. */
    adjusted: boolean;
  }

  /** The adjustment's and the projection's parameters. */
  export interface IParameters {
    /** The applied adjustment's rate limit, metres per second (l.36). */
    maxStepAdjustmentRate: number;

    /** The adjustment's gain (l.43). */
    dcmStepAdjustmentGain: number;

    /** The multiplier's share that does not grow with time left (l.44). */
    minimumFootstepMultiplier: number;

    /** The DCM error that starts adjusting a step, metres (l.45). */
    dcmErrorThresholdForStepAdjustment: number;

    /** The DCM error below which nothing is adjusted, metres (l.46). */
    dcmErrorDeadbandForStepAdjustment: number;

    /** Whether steps are adjusted at all (l.47). */
    useStepAdjustment: boolean;

    /** The least lateral stride from the other leg of the end, metres. */
    minimumStepClearance: number;

    /** The longest stride from the other leg of the end per axis, metres. */
    maximumStepStride: number;
  }

  /**
   * The reference's defaults: a 5 m/s rate limit, a gain of 1, no minimum
   * multiplier, threshold or deadband, adjustment on (l.36, l.43-47), and the
   * projection's 0.075 m clearance and 1 m stride (crossover l.26-27).
   */
  export const DEFAULTS: Readonly<IParameters> = {
    maxStepAdjustmentRate: 5.0,
    dcmStepAdjustmentGain: 1.0,
    minimumFootstepMultiplier: 0.0,
    dcmErrorThresholdForStepAdjustment: 0.0,
    dcmErrorDeadbandForStepAdjustment: 0.0,
    useStepAdjustment: true,
    minimumStepClearance: 0.075,
    maximumStepStride: 1.0,
  };

  /**
   * The adjustment as constructed (l.67-85): no target, no applied adjustment,
   * the limiter not yet updated.
   *
   * @returns The state.
   */
  export function initial(): IState {
    const leg: () => ILeg = (): ILeg => ({
      instantaneous: { x: Number.NaN, y: Number.NaN, z: Number.NaN },
      limited: { ...ZERO },
      called: false,
    });
    return {
      frontLeft: leg(),
      frontRight: leg(),
      hindRight: leg(),
      hindLeft: leg(),
    };
  }

  /**
   * A leg's adjustment cleared at its touchdown (`completedStep`, l.96-101).
   *
   * @param state The state.
   * @param quadrant The leg that landed.
   * @returns The state with that leg cleared, a new one.
   */
  export function completed(
    state: Readonly<IState>,
    quadrant: Step.Quadrant,
  ): IState {
    return {
      ...state,
      [quadrant]: {
        ...state[quadrant],
        instantaneous: { x: Number.NaN, y: Number.NaN, z: Number.NaN },
        limited: { ...ZERO },
      },
    };
  }

  /**
   * IHMC's crossover projection (`QuadrupedStepCrossoverProjection.project`,
   * l.37-61): in the body's z-up frame, the goal's stride from the current sole
   * of the other leg of its end is clamped to the maximum stride along and
   * across the body, and across the body to at least the minimum clearance
   * toward the goal leg's own side, so the feet cannot cross. The goal's height
   * is kept.
   *
   * @param input The goal, metres, the stepping leg, the current soles, the
   *   body's z-up frame, and the clearance and stride, the reference's by
   *   default.
   * @returns The projected goal.
   */
  export function project(input: {
    goal: Step.IPoint;
    quadrant: Step.Quadrant;
    soles: Readonly<Record<Step.Quadrant, Step.IPoint>>;
    body: Step.IPose;
    parameters?: Partial<
      Pick<IParameters, "minimumStepClearance" | "maximumStepStride">
    >;
  }): Step.IPoint {
    const clearance: number =
      input.parameters?.minimumStepClearance ?? DEFAULTS.minimumStepClearance;
    const stride: number =
      input.parameters?.maximumStepStride ?? DEFAULTS.maximumStepStride;
    const goal: Step.IPoint = toBody(input.body, input.goal);
    const across: Step.IPoint = toBody(
      input.body,
      input.soles[Step.across(input.quadrant)],
    );
    let x: number = goal.x - across.x;
    let y: number = goal.y - across.y;

    // The clamps in the reference's order; the side's sign is
    // negateIfRightSide (l.49-56).
    const sign: number = Step.left(input.quadrant) ? 1 : -1;
    if (x > stride) x = stride;
    if (x < -stride) x = -stride;
    if (sign * y > stride) y = sign * stride;
    if (sign * y < clearance) y = sign * clearance;
    return fromBody(input.body, {
      x: across.x + x,
      y: across.y + y,
      z: goal.z,
    });
  }
}

/** The zero vector. */
const ZERO: Readonly<Step.IPoint> = { x: 0, y: 0, z: 0 };

/** `RateLimitedYoFrameVector.update` toward the leg's target (l.102-119). */
function limit(
  leg: Readonly<physicalQuadrupedStepAdjustment.ILeg>,
  maxLength: number,
): Pick<physicalQuadrupedStepAdjustment.ILeg, "limited" | "called"> {
  const raw: Step.IPoint = leg.instantaneous;
  const value: Step.IPoint =
    !leg.called || nan(leg.limited) ? { ...raw } : leg.limited;
  if (maxLength < 0)
    throw new Error(
      "The maxRate parameter in the RateLimitedYoFrameVector cannot be negative.",
    );

  // Euclid's clipToMaxLength (l.113-128): below 1e-7 the step is zeroed.
  let difference: Step.IPoint = subtract(raw, value);
  if (maxLength < 1.0e-7) difference = { ...ZERO };
  else {
    const squared: number = dot(difference, difference);
    if (!(squared < maxLength * maxLength)) {
      const scale: number = maxLength / Math.sqrt(squared);
      difference = {
        x: difference.x * scale,
        y: difference.y * scale,
        z: difference.z * scale,
      };
    }
  }
  return { limited: add(value, difference), called: true };
}

/** A point in the body's z-up frame. */
function toBody(body: Step.IPose, point: Step.IPoint): Step.IPoint {
  const dx: number = point.x - body.position.x;
  const dy: number = point.y - body.position.y;
  const cos: number = Math.cos(body.yaw);
  const sin: number = Math.sin(body.yaw);
  return {
    x: cos * dx + sin * dy,
    y: -sin * dx + cos * dy,
    z: point.z - body.position.z,
  };
}

/** A point from the body's z-up frame to the world. */
function fromBody(body: Step.IPose, point: Step.IPoint): Step.IPoint {
  const cos: number = Math.cos(body.yaw);
  const sin: number = Math.sin(body.yaw);
  return {
    x: body.position.x + cos * point.x - sin * point.y,
    y: body.position.y + sin * point.x + cos * point.y,
    z: body.position.z + point.z,
  };
}

/** Whether a vector has a component that is not a number. */
function nan(point: Step.IPoint): boolean {
  return (
    Number.isNaN(point.x) || Number.isNaN(point.y) || Number.isNaN(point.z)
  );
}

/** The Euclidean length. */
function length(point: Step.IPoint): number {
  return Math.sqrt(dot(point, point));
}

/** The dot product. */
function dot(a: Step.IPoint, b: Step.IPoint): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/** The sum. */
function add(a: Step.IPoint, b: Step.IPoint): Step.IPoint {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

/** The difference a - b. */
function subtract(a: Step.IPoint, b: Step.IPoint): Step.IPoint {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
