// Ported from IHMC Open Robotics Software, tag 201903_Stable (Apache-2.0):
// ihmc-quadruped-robotics/src/main/java/us/ihmc/quadrupedRobotics/
// controlModules/DivergentComponentOfMotionController.java l.30, l.51-53,
// l.55 and l.69-105; ihmc-robotics-toolkit/src/main/java/us/ihmc/robotics/
// controllers/AbstractPIDController.java compute l.71-76 and
// computeIntegralEffortAndAddPDEffort l.85-108; AbstractPDController.java
// l.49; PIDController.java l.25-35. See NOTICE.
import { physicalQuadrupedStep as Step } from "./physicalQuadrupedStep";

/**
 * IHMC's quadruped DCM controller: the virtual repellent point that drives the
 * divergent component of motion xi to its plan, per axis (l.92-98), with K_p =
 * (1, 1, 0) by default (l.51-53):
 *
 *     vrp = xi - (xi_d' + K_p (xi_d - xi)) / omega
 *
 * Each axis is a PID controller fed the estimate and the setpoint with zero
 * rates (l.92-94). Its derivative term multiplies that zero rate error, its
 * integral gain is zero so the integrator stays cleared (l.90-93), and its
 * output is unbounded (`PIDController` l.31-32), leaving the proportional
 * effort K_p (xi_d - xi) (`AbstractPDController` l.49). The setpoint's rate
 * limit defaults to `Double.MAX_VALUE` (l.30), which never clips, so the
 * setpoint is the law's value. The law is component-wise with equal horizontal
 * gains, so any z-up frame gives the same point; the reference uses the centre
 * of mass's z-up frame.
 *
 * @param input The DCM estimate and setpoint, metres, the setpoint's rate,
 *   metres per second, the pendulum's natural frequency omega, per second, and
 *   the proportional gains, the reference's by default.
 * @returns The virtual repellent point, metres, in the inputs' frame.
 */
export function physicalQuadrupedDcmController(input: {
  estimate: Step.IPoint;
  desired: Step.IPoint;
  desiredVelocity: Step.IPoint;
  omega: number;
  gains?: Partial<Step.IPoint>;
}): Step.IPoint {
  const gains: Step.IPoint = {
    ...physicalQuadrupedDcmController.GAINS,
    ...input.gains,
  };

  // The effort is the proportional gain times desired minus estimate.
  const effort: (axis: keyof Step.IPoint) => number = (
    axis: keyof Step.IPoint,
  ): number => gains[axis] * (input.desired[axis] - input.estimate[axis]);
  return {
    x:
      input.estimate.x -
      (1 / input.omega) * (input.desiredVelocity.x + effort("x")),
    y:
      input.estimate.y -
      (1 / input.omega) * (input.desiredVelocity.y + effort("y")),
    z:
      input.estimate.z -
      (1 / input.omega) * (input.desiredVelocity.z + effort("z")),
  };
}

/** The controller's defaults. */
export namespace physicalQuadrupedDcmController {
  /**
   * The proportional gains per axis, per second, as the effort adds to the
   * setpoint's rate: 1 in x and y, 0 in z (`_DcmPosition` defaults, l.51-53).
   */
  export const GAINS: Readonly<Step.IPoint> = { x: 1.0, y: 1.0, z: 0.0 };
}
