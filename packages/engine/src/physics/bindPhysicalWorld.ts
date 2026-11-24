import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalMaterial,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdCollider } from "./AutoMovieXpbdCollider";
import type { AutoMovieXpbdJoint } from "./AutoMovieXpbdJoint";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { physicalHullFaces } from "./physicalHullFaces";
import { physicalHullFacesErode } from "./physicalHullFacesErode";
import { physicalShapeHull } from "./physicalShapeHull";
import { samplePhysicalTarget } from "./samplePhysicalTarget";

/**
 * Create the world's bodies, colliders and joints for every admitted body, or
 * reconnect a restored world's in creation order. A segment is dynamic when its
 * first target selects it, kinematic otherwise; it carries the profile's mass
 * properties. A compliant material's shape is a sensor with a solid inner core
 * eroded by its maximum compression. The floor is a stationary kinematic box
 * with friction 0.7.
 */
export function bindPhysicalWorld(
  world: AutoMovieXpbdWorld,
  input: IAutoMoviePhysicalSimulationInput.IInput,
  restored: boolean,
): Bound {
  const bound: Bound = {
    profiles: Object.fromEntries(
      input.bodies.map(
        (
          body: IAutoMoviePhysicalSimulationInput.IBody,
        ): [string, IAutoMoviePhysicalProfile] => [body.id, body.profile],
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
    spans: new Map(),

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
  const bodies: AutoMovieXpbdBody[] = [];
  const colliders: AutoMovieXpbdCollider[] = [];
  const joints: AutoMovieXpbdJoint[] = [];
  if (restored) {
    bodies.push(...world.bodies);
    colliders.push(...world.colliders);
    joints.push(...world.joints);
  }
  let bi: number = 0;
  let ci: number = 0;
  let ji: number = 0;
  for (const body of input.bodies) {
    const local: Map<string, AutoMovieXpbdBody> = new Map();
    const dynamic: Set<string> = new Set();
    bound.segments.set(body.id, local);
    bound.dynamic.set(body.id, dynamic);
    const parents: Map<string, IAutoMoviePhysicalJoint> = new Map(
      body.profile.joints.map(
        (joint: IAutoMoviePhysicalJoint): [string, IAutoMoviePhysicalJoint] => [
          joint.child,
          joint,
        ],
      ),
    );
    bound.jointByChild.set(body.id, parents);
    for (const segment of body.profile.segments) {
      const target: IAutoMovieRigidTransform =
        body.targets[0]!.segments[segment.bone]!;
      const factor: number =
        body.mode.kind === "exaggerated" ? body.mode.gravity : 1;
      const selected: boolean =
        body.mode.kind !== "kinematic" &&
        (body.targets[0]!.dynamicSegments?.includes(segment.bone) ?? true);
      const rigid: AutoMovieXpbdBody = restored
        ? bodies[bi++]!
        : world.createBody(selected, target, factor);
      if (!restored)
        rigid.setMass(
          segment.mass,
          segment.centerOfMass,
          segment.inertia,
          segment.inertiaRotation,
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
          const sampled: IAutoMovieSamplePhysicalTarget.IResult =
            samplePhysicalTarget(
              target,
              body.targets[1]!.segments[segment.bone]!,
              0,
              input.rate,
            );

          rigid.setLinvel(
            Vector3.add(
              sampled.velocity,
              Vector3.cross(
                sampled.angularVelocity,
                Quaternion.rotateVector(target.rotation, segment.centerOfMass),
              ),
            ),
          );
          rigid.setAngvel(sampled.angularVelocity);
        }
      }
      bound.bodies.set(`${body.id}/${segment.bone}`, rigid);
      local.set(segment.bone, rigid);
      // Simulation-only colliders collide with the segment's own shapes.
      for (const shape of [
        ...segment.shapes,
        ...(segment.contactShapes ?? []),
      ]) {
        const material: IAutoMoviePhysicalMaterial =
          body.profile.materials.find(
            (candidate: (typeof body.profile.materials)[number]): boolean =>
              candidate.id === shape.material,
          )!;
        // A hull shape carries its hull from here on, built once.
        const solid: IAutoMoviePhysicalShape =
          shape.kind === "hull" && shape.hull === undefined
            ? { ...shape, hull: physicalHullFaces(shape.points) }
            : shape;
        const collider: AutoMovieXpbdCollider = restored
          ? colliders[ci++]!
          : world.createCollider(
              rigid,
              solid,
              material.friction,
              material.restitution,
              material.compliance > 0,
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
          let coreShape: IAutoMoviePhysicalShape;
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
          else if (shape.kind === "hull") {
            const eroded: IAutoMovieVector3[] = physicalHullFacesErode(
              physicalShapeHull(shape),
              depth,
            );
            coreShape = {
              ...shape,
              points: eroded,
              hull: physicalHullFaces(eroded),
            };
          } else {
            shape satisfies never;
            throw new Error("Unknown physical shape kind");
          }
          const inner: AutoMovieXpbdCollider = restored
            ? colliders[ci++]!
            : world.createCollider(
                rigid,
                coreShape,
                material.friction,
                material.restitution,
                false,
              );
          bound.colliders.set(inner.handle, {
            body: body.id,
            bone: segment.bone,
            shape: shape.id,
            material: shape.material,
          });
        }
      }
    }
    for (const joint of body.profile.joints)
      bound.joints.set(
        `${body.id}/${joint.id}`,
        restored
          ? joints[ji++]!
          : world.createJoint(
              joint,
              bound.bodies.get(`${body.id}/${joint.parent}`)!,
              bound.bodies.get(`${body.id}/${joint.child}`)!,
            ),
      );
    const order: IAutoMoviePhysicalJoint[] = [];
    const pending: Set<IAutoMoviePhysicalJoint> = new Set(body.profile.joints);
    while (pending.size > 0)
      for (const joint of pending)
        if (
          ![...pending].some(
            (next: IAutoMoviePhysicalJoint): boolean =>
              next.parent === joint.child,
          )
        ) {
          order.push(joint);
          pending.delete(joint);
        }
    bound.gravityOrder.set(body.id, order);
    bound.order.set(body.id, [
      body.profile.segments.find(
        (segment: IAutoMoviePhysicalSegment): boolean =>
          !body.profile.joints.some(
            (joint: IAutoMoviePhysicalJoint): boolean =>
              joint.child === segment.bone,
          ),
      )!,
      ...[...order]
        .reverse()
        .map(
          (joint: IAutoMoviePhysicalJoint): IAutoMoviePhysicalSegment =>
            body.profile.segments.find(
              (segment: IAutoMoviePhysicalSegment): boolean =>
                segment.bone === joint.child,
            )!,
        ),
    ]);
  }
  for (const body of input.bodies) {
    const parents: Map<string, IAutoMoviePhysicalJoint> =
      bound.jointByChild.get(body.id)!;
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
  // The floor is a stationary kinematic box whose top face lies at the
  // floor height across the admitted floor bounds.
  const floor: AutoMovieXpbdCollider = restored
    ? colliders[ci]!
    : world.createCollider(
        world.createBody(false, {
          position: {
            x: (input.floorBounds.min.x + input.floorBounds.max.x) / 2,
            y: input.floor - input.floorBounds.thickness / 2,
            z: (input.floorBounds.min.z + input.floorBounds.max.z) / 2,
          },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        }),
        {
          id: "plane",
          material: "floor",
          kind: "box",
          halfExtents: {
            x: (input.floorBounds.max.x - input.floorBounds.min.x) / 2,
            y: input.floorBounds.thickness / 2,
            z: (input.floorBounds.max.z - input.floorBounds.min.z) / 2,
          },
          transform: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
          },
        },
        0.7,
        0,
        false,
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

  return bound;
}
