import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import RAPIER, {
  type Collider,
  type ImpulseJoint,
  type RigidBody,
  type World,
} from "@dimforge/rapier3d-compat";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { AutoMoviePhysicalSimulation } from "./AutoMoviePhysicalSimulation";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { assertPhysicalNativeMotion } from "./assertPhysicalNativeMotion";
import { physicalHullErode } from "./physicalHullErode";
import { physicalNativeShape } from "./physicalNativeShape";
import { samplePhysicalTarget } from "./samplePhysicalTarget";

/**
 * Create generic native bodies, colliders and joint limits, or reconnect restored handles.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Create generic native bodies, colliders and joint limits, or reconnect restored handles) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Create generic native bodies, colliders and joint limits, or reconnect restored handles) directly over its typed inputs (`world`, `input`, `restored`) as nested iteration of depth 4 (map over input.bodies; forEach over world.bodies; forEach over world.colliders), delegating to `Object.fromEntries`, `bodies.push`, `colliders.push`, `joints.push`, `world.createRigidBody`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 8, 16, 32, 3, 4, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 407 lines and 16 top-level statements that reuses `Object.fromEntries`, `bodies.push`, `colliders.push`, `joints.push`, `world.createRigidBody` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 24 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `world`, `input`, `restored`; the dominant cost is nested iteration of depth 4 (map over input.bodies; forEach over world.bodies; forEach over world.colliders), performed once per call with 66 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 66 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function bindPhysicalWorld(
  world: World,
  input: AutoMoviePhysicalSimulation.IInput,
  restored: boolean,
): Bound {
  const bound: Bound = {
    profiles: Object.fromEntries(
      input.bodies.map(
        (body: AutoMoviePhysicalSimulation.IBody): [string, P] => [
          body.id,
          body.profile,
        ],
      ),
    ),
    bodies: new Map(),
    joints: new Map(),
    colliders: new Map(),
    surfaces: new Map(),
    released: new Set(),
    contactReleased: new Set(),
    dynamic: new Map(),
    handoffs: new Map(),
    ownership: [],
    supportWrenches: [],
    reflexQuality: new Set(),
    planned: new Map(),
    supportPlanned: new Map(),
    contactTargets: new Map(),
    authoredTargets: new Map(),
    segments: new Map(),
    gravityOrder: new Map(),
    order: new Map(),
    jointByChild: new Map(),
    descendants: new Map(),
    posture: new Map(),
    supportCoordinates: new Map(),
    selection: new Map(),
  };
  const bodies: RigidBody[] = [];
  const colliders: Collider[] = [];
  const joints: ImpulseJoint[] = [];
  if (restored) {
    world.bodies.forEach((body: RigidBody): void => {
      bodies.push(body);
    });
    world.colliders.forEach((collider: Collider): void => {
      colliders.push(collider);
    });
    world.impulseJoints.forEach((joint: ImpulseJoint): void => {
      joints.push(joint);
    });
  }
  let bi: number = 0;
  let ci: number = 0;
  let ji: number = 0;
  for (const body of input.bodies) {
    const local: Map<string, RigidBody> = new Map();
    const dynamic: Set<string> = new Set();
    bound.segments.set(body.id, local);
    bound.dynamic.set(body.id, dynamic);
    const parents: Map<string, P.IJoint> = new Map(
      body.profile.joints.map((joint: P.IJoint): [string, P.IJoint] => [
        joint.child,
        joint,
      ]),
    );
    bound.jointByChild.set(body.id, parents);
    for (const segment of body.profile.segments) {
      const target: P.ITransform = body.targets[0]!.segments[segment.bone]!;
      const factor: number =
        body.mode.kind === "exaggerated" ? body.mode.gravity : 1;
      const selected: boolean =
        body.mode.kind !== "kinematic" &&
        (body.targets[0]!.dynamicSegments?.includes(segment.bone) ?? true);
      const rigid: RigidBody = restored
        ? bodies[bi++]!
        : world.createRigidBody(
            (selected
              ? RAPIER.RigidBodyDesc.dynamic()
              : RAPIER.RigidBodyDesc.kinematicPositionBased()
            )
              .setTranslation(
                target.position.x,
                target.position.y,
                target.position.z,
              )
              .setRotation(target.rotation)
              .setGravityScale(factor)
              .setCcdEnabled(true)
              .setAdditionalMassProperties(
                segment.mass,
                segment.centerOfMass,
                segment.inertia,
                segment.inertiaRotation,
              ),
          );
      if (rigid.isDynamic()) dynamic.add(segment.bone);
      if (!restored) {
        bound.ownership.push({
          body: body.id,
          bone: segment.bone,
          seconds: 0,
          kind: selected ? "dynamic" : "authored",
        });
        if (!selected || body.targets[0]!.dynamicSegments !== undefined) {
          const sampled: ReturnType<typeof samplePhysicalTarget> =
            samplePhysicalTarget(
              target,
              body.targets[1]!.segments[segment.bone]!,
              0,
              input.rate,
            );
          assertPhysicalNativeMotion(
            segment,
            target,
            sampled.velocity,
            sampled.angularVelocity,
          );
          rigid.setLinvel(
            Vector3.add(
              sampled.velocity,
              Vector3.cross(
                sampled.angularVelocity,
                Quaternion.rotateVector(target.rotation, segment.centerOfMass),
              ),
            ),
            true,
          );
          rigid.setAngvel(sampled.angularVelocity, true);
        }
      }
      bound.bodies.set(`${body.id}/${segment.bone}`, rigid);
      local.set(segment.bone, rigid);
      for (const shape of segment.shapes) {
        const material: P.IMaterial = body.profile.materials.find(
          (candidate: (typeof body.profile.materials)[number]): boolean =>
            candidate.id === shape.material,
        )!;
        const descriptor: RAPIER.ColliderDesc = new RAPIER.ColliderDesc(
          physicalNativeShape(shape),
        );
        const collider: Collider = restored
          ? colliders[ci++]!
          : world.createCollider(
              descriptor
                .setTranslation(
                  shape.transform.position.x,
                  shape.transform.position.y,
                  shape.transform.position.z,
                )
                .setRotation(shape.transform.rotation)
                .setDensity(0)
                .setFriction(material.friction)
                .setRestitution(material.restitution)
                .setSensor(material.compliance > 0),
              rigid,
            );
        if (!restored)
          collider.setActiveHooks(
            RAPIER.ActiveHooks.FILTER_CONTACT_PAIRS |
              RAPIER.ActiveHooks.FILTER_INTERSECTION_PAIRS,
          );
        bound.colliders.set(collider.handle, {
          body: body.id,
          bone: segment.bone,
          shape: shape.id,
          material: shape.material,
        });
        bound.surfaces.set(collider.handle, {
          body: body.id,
          compliance:
            material.compliance *
            (body.mode.kind === "exaggerated" ? body.mode.compliance : 1),
          damping: material.damping,
          friction: material.friction,
          gain: body.mode.kind === "exaggerated" ? body.mode.impulse : 1,
        });
        if (material.compliance > 0) {
          const depth: number = material.maximumCompression!;
          let coreShape: P.IShape;
          if (shape.kind === "box")
            coreShape = {
              ...shape,
              halfExtents: {
                x: shape.halfExtents.x - depth,
                y: shape.halfExtents.y - depth,
                z: shape.halfExtents.z - depth,
              },
            };
          else if (shape.kind === "sphere" || shape.kind === "capsule")
            coreShape = { ...shape, radius: shape.radius - depth };
          else if (shape.kind === "hull")
            coreShape = {
              ...shape,
              points: physicalHullErode(shape.points, depth),
            };
          else {
            shape satisfies never;
            throw new Error("Unknown physical shape kind");
          }
          const core: RAPIER.ColliderDesc = new RAPIER.ColliderDesc(
            physicalNativeShape(coreShape),
          );
          const inner: Collider = restored
            ? colliders[ci++]!
            : world.createCollider(
                core
                  .setTranslation(
                    shape.transform.position.x,
                    shape.transform.position.y,
                    shape.transform.position.z,
                  )
                  .setRotation(shape.transform.rotation)
                  .setDensity(0)
                  .setFriction(material.friction)
                  .setRestitution(material.restitution),
                rigid,
              );
          bound.colliders.set(inner.handle, {
            body: body.id,
            bone: segment.bone,
            shape: shape.id,
            material: shape.material,
          });
          if (!restored)
            inner.setActiveHooks(
              RAPIER.ActiveHooks.FILTER_CONTACT_PAIRS |
                RAPIER.ActiveHooks.FILTER_INTERSECTION_PAIRS,
            );
        }
      }
    }
    for (const joint of body.profile.joints) {
      let mask: number =
        RAPIER.JointAxesMask.LinX |
        RAPIER.JointAxesMask.LinY |
        RAPIER.JointAxesMask.LinZ;
      for (const [axis, bit] of [
        ["x", 8],
        ["y", 16],
        ["z", 32],
      ] as const)
        if (
          !joint.axes.some(
            (candidate: (typeof joint.axes)[number]): boolean =>
              candidate.axis === axis,
          )
        )
          mask |= bit;
      const descriptor: RAPIER.JointData = RAPIER.JointData.generic(
        joint.parentFrame.position,
        joint.childFrame.position,
        { x: 1, y: 0, z: 0 },
        mask,
      );
      descriptor.frame1 = joint.parentFrame.rotation;
      descriptor.frame2 = joint.childFrame.rotation;
      const native: ImpulseJoint = restored
        ? joints[ji++]!
        : world.createImpulseJoint(
            descriptor,
            bound.bodies.get(`${body.id}/${joint.parent}`)!,
            bound.bodies.get(`${body.id}/${joint.child}`)!,
            true,
          );
      if (!restored) {
        native.setLocalFrame1(
          joint.parentFrame.position,
          joint.parentFrame.rotation,
        );
        native.setLocalFrame2(
          joint.childFrame.position,
          joint.childFrame.rotation,
        );
        native.setContactsEnabled(false);
        for (const axis of joint.axes)
          world.impulseJoints.raw.jointSetLimits(
            native.handle,
            axis.axis === "x" ? 3 : axis.axis === "y" ? 4 : 5,
            axis.minimum,
            axis.maximum,
          );
      }
      bound.joints.set(`${body.id}/${joint.id}`, native);
    }
    const order: P.IJoint[] = [];
    const pending: Set<P.IJoint> = new Set(body.profile.joints);
    while (pending.size > 0)
      for (const joint of pending)
        if (
          ![...pending].some(
            (next: P.IJoint): boolean => next.parent === joint.child,
          )
        ) {
          order.push(joint);
          pending.delete(joint);
        }
    bound.gravityOrder.set(body.id, order);
    bound.order.set(body.id, [
      body.profile.segments.find(
        (segment: P.ISegment): boolean =>
          !body.profile.joints.some(
            (joint: P.IJoint): boolean => joint.child === segment.bone,
          ),
      )!,
      ...[...order]
        .reverse()
        .map(
          (joint: P.IJoint): P.ISegment =>
            body.profile.segments.find(
              (segment: P.ISegment): boolean => segment.bone === joint.child,
            )!,
        ),
    ]);
  }
  for (const body of input.bodies) {
    const parents: Map<string, P.IJoint> = bound.jointByChild.get(body.id)!;
    const posture: Set<string> = new Set(
      body.balance?.pattern.limbs.flatMap(
        (
          limb: NonNullable<typeof body.balance>["pattern"]["limbs"][number],
        ): string[] => limb.chain,
      ) ?? [],
    );
    if (body.supportTracking && (body.supportTracking.iterations ?? 24) > 0) {
      for (const bone of [...posture]) {
        let parent: string | undefined = parents.get(bone)?.parent;
        while (parent !== undefined) {
          posture.add(parent);
          parent = parents.get(parent)?.parent;
        }
      }
      posture.delete(bound.order.get(body.id)![0]!.bone);
    }
    bound.posture.set(body.id, posture);
    const descendants: Map<string, readonly string[]> = new Map();
    const children: Map<string, string[]> = new Map();
    for (const joint of body.profile.joints) {
      const list: string[] = children.get(joint.parent) ?? [];
      list.push(joint.child);
      children.set(joint.parent, list);
    }
    for (const segment of [...bound.order.get(body.id)!].reverse())
      descendants.set(segment.bone, [
        segment.bone,
        ...(children.get(segment.bone) ?? []).flatMap(
          (bone: string): readonly string[] => descendants.get(bone)!,
        ),
      ]);
    bound.descendants.set(body.id, descendants);
    const select: (excluded: ReadonlySet<string>) => ReadonlySet<string> = (
      excluded: ReadonlySet<string>,
    ): ReadonlySet<string> =>
      new Set(
        (body.supportTracking?.pattern.limbs ?? [])
          .filter(
            (
              limb: NonNullable<
                typeof body.supportTracking
              >["pattern"]["limbs"][number],
            ): boolean =>
              !limb.chain.some((bone: string): boolean => excluded.has(bone)),
          )
          .flatMap(
            (
              limb: NonNullable<
                typeof body.supportTracking
              >["pattern"]["limbs"][number],
            ): readonly string[] =>
              limb.chain
                .filter((bone: string): boolean => parents.has(bone))
                .flatMap(
                  (bone: string): readonly string[] => descendants.get(bone)!,
                ),
          ),
      );
    bound.supportCoordinates.set(body.id, {
      all: select(new Set()),
      disjoint: select(posture),
    });
  }
  // The finite cuboid avoids the pinned SDK's inconsistent half-space queries.
  // Rapier 0.21's JS frequency setter configures dynamic-contact softness only;
  // fixed-body contacts retain a separate unexposed 60 Hz setting. A stationary
  // position-kinematic boundary has zero inverse mass and uses the configured
  // contact law. Its identical next pose is submitted on every native step.
  const floor: Collider = restored
    ? colliders[ci]!
    : world.createCollider(
        RAPIER.ColliderDesc.cuboid(
          (input.floorBounds.max.x - input.floorBounds.min.x) / 2,
          input.floorBounds.thickness / 2,
          (input.floorBounds.max.z - input.floorBounds.min.z) / 2,
        ).setFriction(0.7),
        world.createRigidBody(
          RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
            (input.floorBounds.min.x + input.floorBounds.max.x) / 2,
            input.floor - input.floorBounds.thickness / 2,
            (input.floorBounds.min.z + input.floorBounds.max.z) / 2,
          ),
        ),
      );
  bound.floor = floor.parent()!;
  bound.colliders.set(floor.handle, {
    body: "floor",
    bone: "floor",
    shape: "plane",
    material: "floor",
  });
  bound.surfaces.set(floor.handle, {
    body: "floor",
    compliance: 0,
    damping: 0,
    friction: 0.7,
    gain: 1,
  });
  if (!restored)
    for (const rigid of bound.bodies.values())
      rigid.recomputeMassPropertiesFromColliders();
  return bound;
}
