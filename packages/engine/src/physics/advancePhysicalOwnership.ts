import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieVector3 as V,
} from "@automovie/interface";
import RAPIER, { type RigidBody } from "@dimforge/rapier3d-compat";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import type { IAutoMoviePhysicalHandoff as Handoff } from "./IAutoMoviePhysicalHandoff";
import { PhysicalRotationVector as Rotation } from "./PhysicalRotationVector";
import { assertPhysicalNativeMotion } from "./assertPhysicalNativeMotion";
import { copyPhysicalTarget } from "./copyPhysicalTarget";
import { hasPhysicalHandoff } from "./hasPhysicalHandoff";
import { isPhysicalNativeNumber as scalar } from "./isPhysicalNativeNumber";
import { physicalNativeVector } from "./physicalNativeVector";
import { physicalSupportPoint } from "./physicalSupportPoint";
import type { samplePhysicalTarget } from "./samplePhysicalTarget";

/**
 * Switch native ownership at declared subtree boundaries. Activation retains
 * the actual transform and explicitly carries the native kinematic COM and
 * angular velocities. Return uses cubic Hermite corrections in parent-local
 * transforms; SO(3)'s left Jacobian preserves the initial angular derivative.
 * Both colliders and cache readers follow these same native placements. This
 * never blends a rendered skeleton over a different physical body.
 */
export function advancePhysicalOwnership(input: {
  /** Admitted provider and ownership duration. */ body: Simulation.IBody;
  /** Current causal ownership selection. */ target: Simulation.ITarget;
  /** Native handles and serialized transition state. */ bound: Bound;
  /** Authored or contact-fitted world goals, updated for returning subtrees. */ goals: Record<
    string,
    ReturnType<typeof samplePhysicalTarget>
  >;
  /** Exact next native tick; native f32 timesteps never establish event time. */ tick: number;
  /** Declared integer native ticks per second. */ nativeRate: number;
}): Set<string> {
  const seconds: number = input.tick / input.nativeRate;
  const previousSeconds: number = (input.tick - 1) / input.nativeRate;
  const dt: number = 1 / input.nativeRate;
  let selection: ReturnType<typeof input.bound.selection.get> =
    input.bound.selection.get(input.body.id);
  const kinematic: boolean = input.body.mode.kind === "kinematic";
  if (
    !selection ||
    selection.source !== input.target.dynamicSegments ||
    selection.kinematic !== kinematic ||
    (input.target.dynamicSegments !== undefined &&
      !Object.isFrozen(input.target.dynamicSegments))
  ) {
    selection = {
      source: input.target.dynamicSegments,
      kinematic,
      bones: new Set(
        kinematic
          ? []
          : (input.target.dynamicSegments ??
              input.body.profile.segments.map(
                (segment: P.ISegment): string => segment.bone,
              )),
      ),
    };
    input.bound.selection.set(input.body.id, selection);
  }
  const selected: Set<string> = selection.bones;
  let owned: Set<string> | undefined;
  const segments: Map<string, RigidBody> = input.bound.segments.get(
    input.body.id,
  )!;
  const transitions: Record<string, Handoff> =
    input.bound.handoffs.get(input.body.id) ?? Object.create(null);
  input.bound.handoffs.set(input.body.id, transitions);
  const previous: Set<string> = input.bound.dynamic.get(input.body.id)!;
  const ordered: readonly P.ISegment[] = input.bound.order.get(input.body.id)!;
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
  const actual: Record<
    string,
    ReturnType<typeof samplePhysicalTarget>
  > = Object.fromEntries(
    [...segments].map(
      ([bone, rigid]: [string, RigidBody]): [
        string,
        ReturnType<typeof samplePhysicalTarget>,
      ] => [
        bone,
        {
          pose: { position: rigid.translation(), rotation: rigid.rotation() },
          velocity: rigid.velocityAtPoint(
            physicalNativeVector(rigid.translation()),
          ),
          angularVelocity: rigid.angvel(),
        },
      ],
    ),
  );
  const authored: Record<string, ReturnType<typeof samplePhysicalTarget>> = {
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
  const before: Record<
    string,
    ReturnType<typeof samplePhysicalTarget>
  > = Object.fromEntries(
    [...entering].map(
      (bone: string): [string, ReturnType<typeof samplePhysicalTarget>] => {
        const goal: ReturnType<typeof samplePhysicalTarget> = authored[bone]!;
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
    const rigid: RigidBody = segments.get(bone)!;
    if (selected.has(bone)) {
      delete transitions[bone];
      if (!rigid.isDynamic()) {
        assertPhysicalNativeMotion(
          segment,
          actual[bone]!.pose,
          actual[bone]!.velocity,
          actual[bone]!.angularVelocity,
        );
        const velocity: V = rigid.linvel();
        const angular: V = rigid.angvel();
        rigid.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
        rigid.setLinvel(velocity, true);
        rigid.setAngvel(angular, true);
        input.bound.ownership.push({
          body: input.body.id,
          bone,
          seconds: previousSeconds,
          kind: "dynamic",
        });
      }
      continue;
    }
    const joint: P.IJoint | undefined = input.bound.jointByChild
      .get(input.body.id)!
      .get(bone);
    const parent: string | undefined = joint?.parent;
    writable(bone);
    if (rigid.isDynamic()) {
      const solved: ReturnType<typeof relative> = relative(
        actual[bone]!,
        parent ? actual[parent]! : undefined,
      );
      const intended: ReturnType<typeof relative> = relative(
        before[bone]!,
        parent ? before[parent]! : undefined,
      );
      const difference: P.ITransform["rotation"] = Quaternion.multiply(
        solved.pose.rotation,
        Quaternion.inverse(intended.pose.rotation),
      );
      const rotation: V = Rotation.log(difference);
      const position: V = joint
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
      const velocity: V = joint
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
      rigid.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
      input.bound.ownership.push({
        body: input.body.id,
        bone,
        seconds: previousSeconds,
        kind: "return",
      });
    }
    if (transitions[bone]?.completed) delete transitions[bone];
    const transition: Handoff | undefined = transitions[bone];
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
      const goal: ReturnType<typeof relative> = relative(
        authored[bone]!,
        parent ? authored[parent]! : undefined,
      );
      const parentPose: P.ITransform | undefined = parent
        ? input.goals[parent]!.pose
        : undefined;
      const vector: V = Vector3.add(
        Vector3.scale(transition.rotation, position),
        Vector3.scale(transition.angularVelocity, velocity),
      );
      const offset: P.ITransform["rotation"] = Rotation.exp(vector);
      const rotation: P.ITransform["rotation"] = Quaternion.multiply(
        offset,
        goal.pose.rotation,
      );
      const first: number =
        (6 * fraction ** 2 - 6 * fraction) / transition.duration;
      const second: number = 3 * fraction ** 2 - 4 * fraction + 1;
      const localAngular: V = Vector3.add(
        Rotation.velocity(
          vector,
          Vector3.add(
            Vector3.scale(transition.rotation, first),
            Vector3.scale(transition.angularVelocity, second),
          ),
        ),
        Quaternion.rotateVector(offset, goal.angularVelocity),
      );
      const local: V = Vector3.add(
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
      const localVelocity: V = Vector3.add(
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
    write(segment, joint);
  }
  return selected;

  /** Bone origins follow the same fixed pivots as colliders, including angular transport velocity. */
  function author(segment: P.ISegment): void {
    const bone: string = segment.bone;
    const goal: ReturnType<typeof samplePhysicalTarget> = writable(bone);
    const joint: P.IJoint | undefined = input.bound.jointByChild
      .get(input.body.id)!
      .get(bone);
    if (joint) {
      const parent: ReturnType<typeof samplePhysicalTarget> =
        input.goals[joint.parent]!;
      const proximal: V = Quaternion.rotateVector(
        parent.pose.rotation,
        joint.parentFrame.position,
      );
      const distal: V = Quaternion.rotateVector(
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
    write(segment, joint);
  }

  /** Detach only coordinates this ownership pass actually changes. */
  function writable(bone: string): ReturnType<typeof samplePhysicalTarget> {
    if (!owned?.has(bone)) {
      input.goals[bone] = copyPhysicalTarget(input.goals[bone]!);
      (owned ??= new Set()).add(bone);
    }
    return input.goals[bone]!;
  }

  /** Validate the same actual collider/display trajectory before passing it through the native f32 boundary. */
  function write(segment: P.ISegment, joint?: P.IJoint): void {
    const bone: string = segment.bone;
    const goal: ReturnType<typeof samplePhysicalTarget> = input.goals[bone]!;
    assertPhysicalNativeMotion(
      segment,
      goal.pose,
      goal.velocity,
      goal.angularVelocity,
    );
    if (joint) {
      const anchor: V = physicalSupportPoint(
        goal.pose,
        joint.childFrame.position,
      );
      if (![anchor.x, anchor.y, anchor.z].every(scalar))
        throw new Error(
          `Derived native joint anchor exceeds f32 range: ${joint.id}`,
        );
    }
    const rigid: RigidBody = segments.get(bone)!;
    rigid.setNextKinematicTranslation(goal.pose.position);
    rigid.setNextKinematicRotation(goal.pose.rotation);
  }
}

/** Parent-relative spatial derivatives include transport by the parent's actual angular velocity. */
function relative(
  child: ReturnType<typeof samplePhysicalTarget>,
  parent?: ReturnType<typeof samplePhysicalTarget>,
): ReturnType<typeof samplePhysicalTarget> {
  if (!parent) return child;
  const inverse: P.ITransform["rotation"] = Quaternion.inverse(
    parent.pose.rotation,
  );
  const displacement: V = Vector3.subtract(
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
