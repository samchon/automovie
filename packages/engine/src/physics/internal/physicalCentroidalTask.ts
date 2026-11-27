import type { AutoMovieEnginePhysicalBalanceTypes } from "../AutoMovieEnginePhysicalBalanceTypes";
import type {
  IAutoMovieSamplePhysicalTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { AutoMoviePhysicalTracking as Tracking } from "../AutoMoviePhysicalTracking";
import type { AutoMovieXpbdBody } from "../AutoMovieXpbdBody";
import type { AutoMovieXpbdWorld } from "../AutoMovieXpbdWorld";
import { physicalSupportPoint } from "./physicalSupportPoint";

/**
 * The whole-body momentum task of a root under internal actuation: the ground
 * reaction the supports should give, about the mass center.
 *
 * The ground reaction changes the whole body's momentum, so the task that asks
 * it is a momentum task (Herzog, Rotella, Mason, Grimminger, Schaal and
 * Righetti 2016; Orin, Goswami and Lee 2013, "Centroidal dynamics of a humanoid
 * robot"): its force tracks the mass center, `F = K (c_ref - c) - D (c' -
 * c'_ref) - m g`, and its moment about the mass center, where gravity has none,
 * is the trunk's orientation demand. The reference is the mass center the
 * target pose puts there once its root stands at the root's goal, so the root's
 * own shifts (recovery, lowering) move it with the root. A root error read on
 * the root body alone would leave the mass center free whenever the limbs carry
 * it while the root holds still.
 *
 * @param input The body's segments, goals, gains and demands.
 * @returns The task: the mass center, the force and the moment.
 */
export function physicalCentroidalTask(
  input: AutoMovieEnginePhysicalBalanceTypes.CentroidalTask.IInput,
): AutoMovieXpbdWorld.IRootTask {
  let mass: number = 0;
  let center: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  let velocity: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  let planned: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  let plannedVelocity: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const segment of input.profile.segments) {
    const rigid: AutoMovieXpbdBody = input.segments.get(segment.bone)!;
    const goal: IAutoMovieSamplePhysicalTarget.IResult =
      input.goals[segment.bone]!;
    const at: IAutoMovieVector3 = rigid.worldCom();
    const aim: IAutoMovieVector3 = physicalSupportPoint(
      goal.pose,
      segment.centerOfMass,
    );
    mass += segment.mass;
    center = Vector3.add(center, Vector3.scale(at, segment.mass));
    velocity = Vector3.add(
      velocity,
      Vector3.scale(rigid.velocityAtPoint(at), segment.mass),
    );
    planned = Vector3.add(planned, Vector3.scale(aim, segment.mass));
    plannedVelocity = Vector3.add(
      plannedVelocity,
      Vector3.scale(
        Vector3.add(
          goal.velocity,
          Vector3.cross(
            goal.angularVelocity,
            Vector3.subtract(aim, goal.pose.position),
          ),
        ),
        segment.mass,
      ),
    );
  }
  const root: IAutoMovieSamplePhysicalTarget.IResult = input.goals[input.root]!;
  const reference: IAutoMovieVector3 = Vector3.add(
    Vector3.scale(planned, 1 / mass),
    Vector3.subtract(input.rootGoal, root.pose.position),
  );
  const referenceVelocity: IAutoMovieVector3 = Vector3.add(
    Vector3.scale(plannedVelocity, 1 / mass),
    Vector3.subtract(input.rootVelocity, root.velocity),
  );
  const origin: IAutoMovieVector3 = Vector3.scale(center, 1 / mass);
  let force: IAutoMovieVector3 = Vector3.subtract(
    Tracking.force(
      Vector3.subtract(reference, origin),
      Vector3.subtract(Vector3.scale(velocity, 1 / mass), referenceVelocity),
      mass,
      input.stiffness,
      input.damping,
      input.maximumForce,
      input.dt,
    ),
    input.weight,
  );
  const magnitude: number = Vector3.length(force);
  if (magnitude > input.maximumForce)
    force = Vector3.scale(force, input.maximumForce / magnitude);
  return { origin, force, torque: input.torque };
}
