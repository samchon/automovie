// Ported from IHMC Open Robotics Software (Apache-2.0), develop:
// ihmc-common-walking-control-modules/src/main/java/us/ihmc/
// commonWalkingControlModules/capturePoint/controller/AngularMomentumIntegrator.java
// constructor l.35-48, reset() l.50-53 and update() l.55-88; parameters from
// zulu/.../ZuluICPControllerParameters.java l.33-41 and l.86-96, and
// ihmc-robotics-toolkit IntegratorGains.java l.7-9; the stuck flag's
// GlitchFilteredYoBoolean.set l.50-57 (ihmc-yovariables).
// See vendor/ihmc/NOTICE.
import type { physicalPlanarPolygon } from "./physicalPlanarPolygon";

/**
 * One update of IHMC's smart capture-point integrator, which adds an integral
 * of the capture point's error to the centroidal moment pivot only while the
 * body is stuck (`physicalIcpController` adds it to the pivot).
 *
 * - A plan moving faster than the threshold clears the stuck flag and the
 *   integral (l.57-63).
 * - Otherwise a centre of mass slower than the threshold sets the flag (l.65-67);
 *   a faster one leaves it as it was, so once stuck the body stays stuck until
 *   the plan moves or `reset`.
 * - While stuck with the smart integrator on, the integral decays by the leak
 *   ratio to the power dt, gathers K_i dt times the error and is held within
 *   the maximum length; a gain under 1e-10 zeroes it (l.69-82). Otherwise it is
 *   zero (l.84-87).
 *
 * The reference keeps the flag in a `GlitchFilteredYoBoolean` with a window of
 * (int) (0.03 / dt) updates (l.40), but only ever calls its `set`, which
 * bypasses the window (l.52, l.60, l.67), so the flag is a plain boolean here.
 *
 * @param input The integrator's state; the planned capture point's rate and the
 *   centre of mass's velocity, metres per second; the capture point's
 *   dead-banded error from its plan, metres; the controller's update period,
 *   seconds; and the gains, Zulu's by default.
 * @returns The state after the update, a new one.
 */
export function physicalAngularMomentumIntegrator(input: {
  state: Readonly<physicalAngularMomentumIntegrator.IState>;
  desiredVelocity: physicalPlanarPolygon.IPoint;
  velocity: physicalPlanarPolygon.IPoint;
  error: physicalPlanarPolygon.IPoint;
  dt: number;
  gains?: Partial<physicalAngularMomentumIntegrator.IGains>;
}): physicalAngularMomentumIntegrator.IState {
  const gains: physicalAngularMomentumIntegrator.IGains = {
    ...physicalAngularMomentumIntegrator.ZULU,
    ...input.gains,
  };
  if (
    Math.hypot(input.desiredVelocity.x, input.desiredVelocity.y) >
    gains.threshold
  )
    return { stuck: false, integral: { x: 0, y: 0 } };
  const stuck: boolean =
    Math.hypot(input.velocity.x, input.velocity.y) < gains.threshold
      ? true
      : input.state.stuck;
  if (!(gains.smart && stuck)) return { stuck, integral: { x: 0, y: 0 } };

  // integral <- integral leak^dt + K_i dt error, held within the maximum
  // length (l.71-80).
  const scale: number = input.dt * gains.ki;
  const leak: number = Math.pow(gains.leak, input.dt);
  let integral: physicalPlanarPolygon.IPoint = {
    x: input.state.integral.x * leak + input.error.x * scale,
    y: input.state.integral.y * leak + input.error.y * scale,
  };
  const length: number = Math.hypot(integral.x, integral.y);
  if (length > gains.maximum)
    integral = {
      x: integral.x * (gains.maximum / length),
      y: integral.y * (gains.maximum / length),
    };
  if (Math.abs(gains.ki) < 1e-10) integral = { x: 0, y: 0 };
  return { stuck, integral };
}

/** The integrator's state and gains. */
export namespace physicalAngularMomentumIntegrator {
  /** The integrator's state. */
  export interface IState {
    /** Whether the body is stuck (`isICPStuck`). */
    stuck: boolean;

    /** The integral added to the pivot (`feedbackCMPIntegral`), metres. */
    integral: physicalPlanarPolygon.IPoint;
  }

  /** The integrator's gains. */
  export interface IGains {
    /** Whether the smart integrator runs (`useSmartICPIntegrator`). */
    smart: boolean;

    /** The integral gain K_i, per second. */
    ki: number;

    /** The speed under which the body is stuck, metres per second. */
    threshold: number;

    /** The integral's leak ratio per second, one for none. */
    leak: number;

    /** The integral's largest length, metres. */
    maximum: number;
  }

  /**
   * Zulu's gains: the smart integrator on (`useSmartICPIntegrator` l.86-90),
   * K_i 2.0 (`getICPFeedbackGains` l.39) and a 0.06 m/s threshold
   * (`getICPVelocityThresholdForStuck` l.92-96); `IntegratorGains`' defaults
   * for the leak ratio, 1.0, and the maximum, unbounded (l.7-9).
   */
  export const ZULU: Readonly<IGains> = {
    smart: true,
    ki: 2.0,
    threshold: 0.06,
    leak: 1.0,
    maximum: Number.POSITIVE_INFINITY,
  };

  /**
   * A new integrator: not stuck, as the filter's constructor sets it
   * (`GlitchFilteredYoBoolean` l.47), with a zero integral.
   *
   * @returns The new state.
   */
  export function create(): IState {
    return { stuck: false, integral: { x: 0, y: 0 } };
  }

  /**
   * An integrator reset as the controller is initialized (l.50-53): the stuck
   * flag cleared, the integral kept.
   *
   * @param state The state to reset.
   * @returns The reset state.
   */
  export function reset(state: Readonly<IState>): IState {
    return { stuck: false, integral: { ...state.integral } };
  }
}
