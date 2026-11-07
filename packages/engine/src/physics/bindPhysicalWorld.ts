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
import { physicalNativeShape } from "./physicalNativeShape";
import { samplePhysicalTarget } from "./samplePhysicalTarget";

/** Create generic native bodies, colliders and joint limits, or reconnect restored handles. */
export function bindPhysicalWorld(
  world: World,
  input: AutoMoviePhysicalSimulation.IInput,
  restored: boolean,
): Bound {
  const bound: Bound = {
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
    segments: new Map(),
    gravityOrder: new Map(),
    order: new Map(),
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
          const coreShape: P.IShape =
            shape.kind === "box"
              ? {
                  ...shape,
                  halfExtents: {
                    x: shape.halfExtents.x - depth,
                    y: shape.halfExtents.y - depth,
                    z: shape.halfExtents.z - depth,
                  },
                }
              : { ...shape, radius: shape.radius - depth };
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
