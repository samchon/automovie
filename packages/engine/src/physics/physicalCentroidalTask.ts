import type {
  IAutoMoviePhysicalProfile,
  IAutoMovieSamplePhysicalTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { AutoMoviePhysicalTracking as Tracking } from "./AutoMoviePhysicalTracking";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import { physicalSupportPoint } from "./physicalSupportPoint";

/**
 * The whole-body momentum task of a root under internal actuation: the
 * ground reaction the supports should give, about the mass center.
 *
 * The ground reaction changes the whole body's momentum, so the task that
 * asks it is a momentum task (Herzog, Rotella, Mason, Grimminger, Schaal
 * and Righetti 2016; Orin, Goswami and Lee 2013, "Centroidal
 * dynamics of a humanoid robot"): its force tracks the mass center,
 * `F = K (c_ref - c) - D (c' - c'_ref) - m g`, and its moment about the
 * mass center, where gravity has none, is the trunk's orientation demand.
 * The reference is the mass center the target pose puts there once its
 * root stands at the root's goal, so the root's own shifts (recovery,
 * lowering) move it with the root. A root error read on the root body
 * alone would leave the mass center free whenever the limbs carry it while
 * the root holds still.
 *
 * @param input The body's segments, goals, gains and demands.
 * @returns The task: the mass center, the force and the moment.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the task, its sources, the reference and why the mass center is read instead of the root.
 * @evidence contracts/development/implementation.md#principled-implementation Herzog et al. 2016 and Orin, Goswami and Lee 2013: the linear momentum rate tracks the mass center by a PD with gravity compensated; the moment is taken about the mass center, where gravity's vanishes; the PD is the bounded implicit one the root's force uses.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the segments for the measured and the planned mass center, then the PD.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Gains, bounds and gravity are the caller's; nothing is tuned here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the segments.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The bodies move every substep, so nothing carries over.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh task; retains nothing.
 */
export function physicalCentroidalTask(
  input: physicalCentroidalTask.IInput,
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

/**
 * The input of physicalCentroidalTask.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the input's one member.
 * @evidence contracts/development/design.md#principled-representation A companion namespace holding the input record.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Built by trackPhysicalRoot under internal actuation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every member is required; nothing is defaulted here.
 */
export namespace physicalCentroidalTask {
  /** The body, its goals and the root's gains and demands. */
  export interface IInput {
    /** The body's profile: its segments' masses and mass centers. */
    profile: IAutoMoviePhysicalProfile;

    /** The body's rigid segments by bone. */
    segments: ReadonlyMap<string, AutoMovieXpbdBody>;

    /** Every segment's sampled goal. */
    goals: Readonly<Record<string, IAutoMovieSamplePhysicalTarget.IResult>>;

    /** The root's bone. */
    root: string;

    /** Where the root should stand, with its shifts, world metres. */
    rootGoal: IAutoMovieVector3;

    /** The root's goal velocity, with its shifts, metres per second. */
    rootVelocity: IAutoMovieVector3;

    /** The mass center's stiffness, newtons per metre. */
    stiffness: number;

    /** The mass center's damping, newton seconds per metre. */
    damping: number;

    /** The force's bound, newtons. */
    maximumForce: number;

    /** The gravity force compensated, newtons; zero without compensation. */
    weight: IAutoMovieVector3;

    /** The trunk's orientation demand, newton metres. */
    torque: IAutoMovieVector3;

    /** The native step, seconds. */
    dt: number;
  }
}
