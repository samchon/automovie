import { AutoMovieEnginePhysicalRotationVector, AutoMovieEngineQuaternion, AutoMovieEngineRomTolerance, AutoMovieEngineVector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanSimulation,
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalOwnershipEvent,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import type { motionComplaints } from "./motionComplaints";

/**
 * Check a simulated window's joint residuals against the guard (`GUARD`): every
 * return's post-stabilization angle
 * (`IAutoMoviePhysicalOwnershipEvent.stabilization`) and, at every solved
 * frame, how far each fewer-axis joint sits off its own limit box, the angle
 * the engine's projection would move it (`projectPhysicalJointRotation`).
 *
 * @param all The gatherer the failures go to.
 * @param label What the window is, for the messages.
 * @param record The baked window.
 * @param subjects The simulated performers whose joints are read.
 */
export function simulationResiduals(
  all: motionComplaints.IGatherer,
  label: string,
  record: IAutoMovieMotionHumanSimulation,
  subjects: readonly string[],
): void {
  const stabilized: number = Math.max(
    0,
    ...record.simulation.cache.ownership
      .filter((event: IAutoMoviePhysicalOwnershipEvent): boolean =>
        subjects.includes(event.body),
      )
      .map(
        (event: IAutoMoviePhysicalOwnershipEvent): number =>
          event.stabilization ?? 0,
      ),
  );
  all.check(
    `${label}: every hand-back's post-stabilization stays within ${simulationResiduals.GUARD} rad; largest ${stabilized} rad`,
    stabilized <= simulationResiduals.GUARD,
  );
  let worst: number = 0;
  let where: string = "";
  for (const body of record.simulation.input.bodies.filter(
    (candidate: IAutoMoviePhysicalSimulationInput.IBody): boolean =>
      subjects.includes(candidate.id),
  ))
    for (const joint of body.profile.joints.filter(
      (candidate: IAutoMoviePhysicalJoint): boolean =>
        candidate.axes.length < 3,
    ))
      for (const frame of record.simulation.cache.frames) {
        const poses: Record<string, IAutoMovieRigidTransform> =
          Object.fromEntries(
            Object.entries(frame.bodies[body.id]!).map(
              ([bone, state]: [
                string,
                IAutoMoviePhysicalFrame["bodies"][string][string],
              ]): [string, IAutoMovieRigidTransform] => [
                bone,
                { position: state.position, rotation: state.rotation },
              ],
            ),
          );
        const relative: IAutoMovieQuaternion = AutoMovieEnginePhysics.physicalJointRelativeRotation(
          poses,
          joint,
        );
        const residual: number = AutoMovieEngineVector3.length(
          AutoMovieEnginePhysicalRotationVector.log(
            AutoMovieEngineQuaternion.multiply(
              AutoMovieEnginePhysics.projectPhysicalJointRotation(joint, relative),
              AutoMovieEngineQuaternion.inverse(relative),
            ),
          ),
        );
        if (residual > worst) {
          worst = residual;
          where = `${body.id}/${joint.id} at ${frame.seconds} s`;
        }
      }
  all.check(
    `${label}: every fewer-axis joint stays within ${simulationResiduals.GUARD} rad of its limit box; worst ${worst} rad, ${where}`,
    worst <= simulationResiduals.GUARD,
  );
}

/** Companion constants of {@link simulationResiduals}. */
export namespace simulationResiduals {
  /**
   * The guard on a joint's residual, radians: the engine's `AutoMovieEngineRomTolerance`
   * (0.01 degree), the one joint tolerance the pipeline declares, which the
   * simulated window hands the solver as its hand-back limit
   * (`planHumanSimulationBody`, `maximumJointViolation`) and the take's range
   * verdict reads. No solver bounds a dynamic joint-limit residual by a
   * tolerance of its own: Bullet corrects a limit's penetration by a Baumgarte
   * share per step (`btMultiBodyJointLimitConstraint`, `m_erp` 0.2) and
   * MuJoCo's limits are soft (`solref`, `solimp`). A residual past it means the
   * solver failed to hold the joint and must fail.
   */
  export const GUARD: number = (AutoMovieEngineRomTolerance * Math.PI) / 180;
}
