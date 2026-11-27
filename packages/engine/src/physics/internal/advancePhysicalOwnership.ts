import type {
  IAutoMoviePhysicalHandoff,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import type { AutoMovieXpbdBody } from "../AutoMovieXpbdBody";
import type { IAutoMoviePhysicalBinding as Bound } from "../IAutoMoviePhysicalBinding";
import { PhysicalRotationVector as Rotation } from "../PhysicalRotationVector";
import { copyPhysicalTarget } from "./copyPhysicalTarget";
import { hasPhysicalHandoff } from "./hasPhysicalHandoff";
import { projectPhysicalJointRotation } from "./projectPhysicalJointRotation";
import { stabilizePhysicalJointReturn } from "./stabilizePhysicalJointReturn";

/*
 * Switch native ownership at declared subtree boundaries. Activation retains
 * the actual transform and explicitly carries the native kinematic COM and
 * angular velocities. Return uses cubic Hermite corrections in parent-local
 * transforms; SO(3)'s left Jacobian preserves the initial angular derivative. A
 * return starts from the solved joint rotation post-stabilized onto the joint's
 * limit box (Cline and Pai 2003), removing the drift finite solver iterations
 * leave, and records that projection's angle on its event. Both colliders and
 * cache readers follow these same native placements. This never blends a
 * rendered skeleton over a different physical body.
 */
export function advancePhysicalOwnership(input: {
  /*
   * Admitted provider and ownership duration.
   */ body: IAutoMoviePhysicalSimulationInput.IBody;
  /*
   * Current causal ownership selection.
   */ target: IAutoMoviePhysicalSimulationInput.ITarget;
  /*
   * Native handles and serialized transition state.
   */ bound: Bound;
  /*
   * Authored or contact-fitted world goals, updated for returning subtrees.
   */ goals: Record<
    string,
    IAutoMovieSamplePhysicalTarget.IResult
  >;
  /*
   * Exact next solver tick; floating-point timesteps never establish event
   * time.
   */ tick: number;
  /*
   * Declared integer native ticks per second.
   */ nativeRate: number;
}): Set<string> {
  const seconds: number = input.tick / input.nativeRate;
  const previousSeconds: number = (input.tick - 1) / input.nativeRate;
  const dt: number = 1 / input.nativeRate;
  const kinematic: boolean = input.body.mode.kind === "kinematic";
  const selected: Set<string> = new Set(
    kinematic
      ? []
      : (input.target.dynamicSegments ??
          input.body.profile.segments.map(
            (segment: IAutoMoviePhysicalSegment): string => segment.bone,
          )),
  );
  let owned: Set<string> | undefined;
  const segments: Map<string, AutoMovieXpbdBody> = input.bound.segments.get(
    input.body.id,
  )!;
  const transitions: Record<string, IAutoMoviePhysicalHandoff> =
    input.bound.handoffs.get(input.body.id) ?? Object.create(null);
  input.bound.handoffs.set(input.body.id, transitions);
  const previous: Set<string> = input.bound.dynamic.get(input.body.id)!;
  const ordered: readonly IAutoMoviePhysicalSegment[] = input.bound.order.get(
    input.body.id,
  )!;
  input.bound.dynamic.set(input.body.id, selected);
  if (
    (selected === previous ||
      (selected.size === previous.size &&
        [...selected].every((bone: string): boolean => previous.has(bone)))) &&
    !hasPhysicalHandoff(transitions)
  ) {
    for (const segment of ordered)
      if (!selected.has(segment.bone)) author(segment);
    return selected;
  }
  const actual: Record<string, IAutoMovieSamplePhysicalTarget.IResult> =
    Object.fromEntries(
      [...segments].map(
        ([bone, rigid]: [string, AutoMovieXpbdBody]): [
          string,
          IAutoMovieSamplePhysicalTarget.IResult,
        ] => [
          bone,
          {
            pose: { position: rigid.translation(), rotation: rigid.rotation() },
            velocity: rigid.velocityAtPoint(rigid.translation()),
            angularVelocity: rigid.angvel(),
          },
        ],
      ),
    );
  const authored: Record<string, IAutoMovieSamplePhysicalTarget.IResult> = {
    ...input.goals,
  };
  const entering: Set<string> = new Set();
  for (const segment of ordered)
    if (
      !selected.has(segment.bone) &&
      segments.get(segment.bone)!.isDynamic()
    ) {
      entering.add(segment.bone);
      const parent: string | undefined = input.bound.jointByChild
        .get(input.body.id)!
        .get(segment.bone)?.parent;
      if (parent !== undefined) entering.add(parent);
    }
  const before: Record<string, IAutoMovieSamplePhysicalTarget.IResult> =
    Object.fromEntries(
      [...entering].map(
        (bone: string): [string, IAutoMovieSamplePhysicalTarget.IResult] => {
          const goal: IAutoMovieSamplePhysicalTarget.IResult = authored[bone]!;
          return [
            bone,
            {
              ...goal,
              pose: {
                position: Vector3.subtract(
                  goal.pose.position,
                  Vector3.scale(goal.velocity, dt),
                ),
                rotation: Quaternion.multiply(
                  Rotation.exp(Vector3.scale(goal.angularVelocity, -dt)),
                  goal.pose.rotation,
                ),
              },
            },
          ];
        },
      ),
    );
  for (const segment of ordered) {
    const bone: string = segment.bone;
    const rigid: AutoMovieXpbdBody = segments.get(bone)!;
    if (selected.has(bone)) {
      delete transitions[bone];
      if (!rigid.isDynamic()) {
        const velocity: IAutoMovieVector3 = rigid.linvel();
        const angular: IAutoMovieVector3 = rigid.angvel();
        rigid.setDynamic(true);
        rigid.setLinvel(velocity);
        rigid.setAngvel(angular);
        input.bound.ownership.push({
          body: input.body.id,
          bone,
          seconds: previousSeconds,
          kind: "dynamic",
        });
      }
      continue;
    }
    const joint: IAutoMoviePhysicalJoint | undefined = input.bound.jointByChild
      .get(input.body.id)!
      .get(bone);
    const parent: string | undefined = joint?.parent;
    writable(bone);
    if (rigid.isDynamic()) {
      const drifted: IAutoMovieSamplePhysicalTarget.IResult = relative(
        actual[bone]!,
        parent ? actual[parent]! : undefined,
      );

      // The return starts from the solved state post-stabilized onto the
      // joint's limits, and the projection's angle is recorded on its event.
      const stabilized: stabilizePhysicalJointReturn.IResult =
        stabilizePhysicalJointReturn(drifted, joint);
      const solved: IAutoMovieSamplePhysicalTarget.IResult = stabilized.result;
      const intended: IAutoMovieSamplePhysicalTarget.IResult = relative(
        before[bone]!,
        parent ? before[parent]! : undefined,
      );
      const difference: IAutoMovieRigidTransform["rotation"] =
        Quaternion.multiply(
          solved.pose.rotation,
          Quaternion.inverse(intended.pose.rotation),
        );
      const rotation: IAutoMovieVector3 = Rotation.log(difference);
      const position: IAutoMovieVector3 = joint
        ? Vector3.subtract(
            solved.pose.position,
            Vector3.subtract(
              joint.parentFrame.position,
              Quaternion.rotateVector(
                solved.pose.rotation,
                joint.childFrame.position,
              ),
            ),
          )
        : Vector3.subtract(solved.pose.position, intended.pose.position);
      const velocity: IAutoMovieVector3 = joint
        ? Vector3.add(
            solved.velocity,
            Vector3.cross(
              solved.angularVelocity,
              Quaternion.rotateVector(
                solved.pose.rotation,
                joint.childFrame.position,
              ),
            ),
          )
        : Vector3.subtract(solved.velocity, intended.velocity);
      transitions[bone] = {
        tick: input.tick - 1,
        duration: input.body.handoffSeconds ?? 0.2,
        position,
        velocity,
        rotation,
        angularVelocity: Rotation.derivative(
          rotation,
          Vector3.subtract(
            solved.angularVelocity,
            Quaternion.rotateVector(difference, intended.angularVelocity),
          ),
        ),
      };
      rigid.setDynamic(false);
      input.bound.ownership.push({
        body: input.body.id,
        bone,
        seconds: previousSeconds,
        kind: "return",
        ...(joint === undefined ? {} : { stabilization: stabilized.angle }),
      });
    }
    if (transitions[bone]?.completed) delete transitions[bone];
    const transition: IAutoMoviePhysicalHandoff | undefined = transitions[bone];
    if (transition) {
      const fraction: number = Math.min(
        1,
        Math.max(
          0,
          (input.tick - transition.tick) /
            (transition.duration * input.nativeRate),
        ),
      );
      const position: number = 2 * fraction ** 3 - 3 * fraction ** 2 + 1;
      const velocity: number =
        (fraction ** 3 - 2 * fraction ** 2 + fraction) * transition.duration;
      const goal: IAutoMovieSamplePhysicalTarget.IResult = relative(
        authored[bone]!,
        parent ? authored[parent]! : undefined,
      );
      const parentPose: IAutoMovieRigidTransform | undefined = parent
        ? input.goals[parent]!.pose
        : undefined;
      const vector: IAutoMovieVector3 = Vector3.add(
        Vector3.scale(transition.rotation, position),
        Vector3.scale(transition.angularVelocity, velocity),
      );
      const offset: IAutoMovieRigidTransform["rotation"] = Rotation.exp(vector);
      // The Hermite blend runs in rotation-vector space and carries the
      // entry's angular velocity, so between two in-box ends it may leave
      // the joint's limit box; the return is projected back onto the box,
      // the same projection that post-stabilizes its entry (Cline and Pai
      // 2003), since the joint's limits bind the body the whole time.
      const blended: IAutoMovieRigidTransform["rotation"] = Quaternion.multiply(
        offset,
        goal.pose.rotation,
      );
      const rotation: IAutoMovieRigidTransform["rotation"] =
        joint === undefined
          ? blended
          : Quaternion.multiply(
              Quaternion.multiply(
                joint.parentFrame.rotation,
                projectPhysicalJointRotation(
                  joint,
                  Quaternion.multiply(
                    Quaternion.multiply(
                      Quaternion.inverse(joint.parentFrame.rotation),
                      blended,
                    ),
                    joint.childFrame.rotation,
                  ),
                ),
              ),
              Quaternion.inverse(joint.childFrame.rotation),
            );
      const first: number =
        (6 * fraction ** 2 - 6 * fraction) / transition.duration;
      const second: number = 3 * fraction ** 2 - 4 * fraction + 1;
      const localAngular: IAutoMovieVector3 = Vector3.add(
        Rotation.velocity(
          vector,
          Vector3.add(
            Vector3.scale(transition.rotation, first),
            Vector3.scale(transition.angularVelocity, second),
          ),
        ),
        Quaternion.rotateVector(offset, goal.angularVelocity),
      );
      const local: IAutoMovieVector3 = Vector3.add(
        joint
          ? Vector3.subtract(
              joint.parentFrame.position,
              Quaternion.rotateVector(rotation, joint.childFrame.position),
            )
          : goal.pose.position,
        Vector3.add(
          Vector3.scale(transition.position, position),
          Vector3.scale(transition.velocity, velocity),
        ),
      );
      const localVelocity: IAutoMovieVector3 = Vector3.add(
        joint
          ? Vector3.scale(
              Vector3.cross(
                localAngular,
                Quaternion.rotateVector(rotation, joint.childFrame.position),
              ),
              -1,
            )
          : goal.velocity,
        Vector3.add(
          Vector3.scale(transition.position, first),
          Vector3.scale(transition.velocity, second),
        ),
      );
      input.goals[bone]!.pose = parentPose
        ? {
            position: Vector3.add(
              parentPose.position,
              Quaternion.rotateVector(parentPose.rotation, local),
            ),
            rotation: Quaternion.multiply(parentPose.rotation, rotation),
          }
        : { position: local, rotation };
      input.goals[bone]!.velocity = parent
        ? Vector3.add(
            input.goals[parent]!.velocity,
            Vector3.add(
              Vector3.cross(
                input.goals[parent]!.angularVelocity,
                Quaternion.rotateVector(parentPose!.rotation, local),
              ),
              Quaternion.rotateVector(parentPose!.rotation, localVelocity),
            ),
          )
        : localVelocity;
      input.goals[bone]!.angularVelocity = parent
        ? Vector3.add(
            input.goals[parent]!.angularVelocity,
            Quaternion.rotateVector(parentPose!.rotation, localAngular),
          )
        : localAngular;
      if (fraction === 1) {
        transition.completed = true;
        input.bound.ownership.push({
          body: input.body.id,
          bone,
          seconds,
          kind: "authored",
        });
      }
    } else {
      author(segment);
      continue;
    }
    write(segment);
  }
  return selected;

  /*
   * Bone origins follow the same fixed pivots as colliders, including angular
   * transport velocity.
   */
  function author(segment: IAutoMoviePhysicalSegment): void {
    const bone: string = segment.bone;
    const goal: IAutoMovieSamplePhysicalTarget.IResult = writable(bone);
    const joint: IAutoMoviePhysicalJoint | undefined = input.bound.jointByChild
      .get(input.body.id)!
      .get(bone);
    if (joint) {
      const parent: IAutoMovieSamplePhysicalTarget.IResult =
        input.goals[joint.parent]!;
      const proximal: IAutoMovieVector3 = Quaternion.rotateVector(
        parent.pose.rotation,
        joint.parentFrame.position,
      );
      const distal: IAutoMovieVector3 = Quaternion.rotateVector(
        goal.pose.rotation,
        joint.childFrame.position,
      );
      goal.pose.position = Vector3.subtract(
        Vector3.add(parent.pose.position, proximal),
        distal,
      );
      goal.velocity = Vector3.subtract(
        Vector3.add(
          parent.velocity,
          Vector3.cross(parent.angularVelocity, proximal),
        ),
        Vector3.cross(goal.angularVelocity, distal),
      );
    }
    write(segment);
  }

  /*
   * Detach only coordinates this ownership pass actually changes.
   */
  function writable(bone: string): IAutoMovieSamplePhysicalTarget.IResult {
    if (!owned?.has(bone)) {
      input.goals[bone] = copyPhysicalTarget(input.goals[bone]!);
      (owned ??= new Set()).add(bone);
    }
    return input.goals[bone]!;
  }

  /*
   * Hand the same actual collider/display trajectory to the solver.
   */
  function write(segment: IAutoMoviePhysicalSegment): void {
    const bone: string = segment.bone;
    const goal: IAutoMovieSamplePhysicalTarget.IResult = input.goals[bone]!;
    const rigid: AutoMovieXpbdBody = segments.get(bone)!;
    rigid.setNextKinematicTranslation(goal.pose.position);
    rigid.setNextKinematicRotation(goal.pose.rotation);
  }
}

/*
 * Parent-relative spatial derivatives include transport by the parent's actual
 * angular velocity.
 */
function relative(
  child: IAutoMovieSamplePhysicalTarget.IResult,
  parent?: IAutoMovieSamplePhysicalTarget.IResult,
): IAutoMovieSamplePhysicalTarget.IResult {
  if (!parent) return child;
  const inverse: IAutoMovieRigidTransform["rotation"] = Quaternion.inverse(
    parent.pose.rotation,
  );
  const displacement: IAutoMovieVector3 = Vector3.subtract(
    child.pose.position,
    parent.pose.position,
  );
  return {
    pose: {
      position: Quaternion.rotateVector(inverse, displacement),
      rotation: Quaternion.multiply(inverse, child.pose.rotation),
    },
    velocity: Quaternion.rotateVector(
      inverse,
      Vector3.subtract(
        Vector3.subtract(child.velocity, parent.velocity),
        Vector3.cross(parent.angularVelocity, displacement),
      ),
    ),
    angularVelocity: Quaternion.rotateVector(
      inverse,
      Vector3.subtract(child.angularVelocity, parent.angularVelocity),
    ),
  };
}
