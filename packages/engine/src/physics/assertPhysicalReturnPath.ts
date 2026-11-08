import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import type { RigidBody } from "@dimforge/rapier3d-compat";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import type { IAutoMoviePhysicalHandoff as Handoff } from "./IAutoMoviePhysicalHandoff";
import { PhysicalRotationVector } from "./PhysicalRotationVector";
import { isPhysicalProfilePairExcluded } from "./isPhysicalProfilePairExcluded";
import { physicalSupportPoint } from "./physicalSupportPoint";
import type { preparePhysicalGeometry as Geometry } from "./preparePhysicalGeometry";
import { projectPhysicalJointRotation } from "./projectPhysicalJointRotation";

/** Reject an obstructed C1 return before advancing native bodies. This checks the complete next kinematic articulation against current dynamic receivers, the floor, admitted self pairs and fixed pivots. It is a discrete path admission, not a continuous collision or dynamically feasible control certificate. */
export function assertPhysicalReturnPath(
  input: Simulation.IInput,
  bound: Bound,
  tick: number,
  phase: "before" | "after",
): void {
  if (
    ![...bound.handoffs.values()].some(
      (state: Record<string, unknown>): boolean =>
        Object.keys(state).length > 0,
    )
  )
    return;
  const nativeRate: number = input.rate * input.substeps!;
  const seconds: number = tick / nativeRate;
  const poses: Record<
    string,
    Record<string, P.ITransform>
  > = Object.fromEntries(
    [...bound.segments].map(
      ([id, segments]: [string, Map<string, RigidBody>]): [
        string,
        Record<string, P.ITransform>,
      ] => [
        id,
        Object.fromEntries(
          [...segments].map(
            ([bone, rigid]: [string, RigidBody]): [string, P.ITransform] => [
              bone,
              {
                position:
                  phase === "before" && rigid.isKinematic()
                    ? rigid.nextTranslation()
                    : rigid.translation(),
                rotation:
                  phase === "before" && rigid.isKinematic()
                    ? rigid.nextRotation()
                    : rigid.rotation(),
              },
            ],
          ),
        ),
      ],
    ),
  );
  const shapes: Geometry.ICollider[] = input.bodies.flatMap(
    (body: Simulation.IBody): Geometry.ICollider[] =>
      body.profile.segments.flatMap(
        (segment: P.ISegment): Geometry.ICollider[] =>
          segment.shapes.map(
            (shape: P.IShape): Geometry.ICollider => ({
              body: body.id,
              bone: segment.bone,
              shape,
              pose: poses[body.id]![segment.bone]!,
            }),
          ),
      ),
  );
  for (const body of input.bodies) {
    const transitions: Record<string, Handoff> =
      bound.handoffs.get(body.id) ?? {};
    if (!Object.keys(transitions).length) continue;
    for (const joint of body.profile.joints)
      if (transitions[joint.child] || transitions[joint.parent]) {
        if (
          phase === "before" &&
          (bound.segments.get(body.id)!.get(joint.parent)!.isDynamic() ||
            bound.segments.get(body.id)!.get(joint.child)!.isDynamic())
        )
          continue;
        const transition: Handoff | undefined =
          transitions[joint.child] ?? transitions[joint.parent];
        if (!transition) continue;
        const fraction: number = Math.min(
          1,
          Math.max(
            0,
            (tick - transition.tick) / (transition.duration * nativeRate),
          ),
        );
        const fade: number = 2 * fraction ** 3 - 3 * fraction ** 2 + 1;
        const parent: P.ITransform = poses[body.id]![joint.parent]!;
        const child: P.ITransform = poses[body.id]![joint.child]!;
        const distance: number = Vector3.length(
          Vector3.subtract(
            physicalSupportPoint(parent, joint.parentFrame.position),
            physicalSupportPoint(child, joint.childFrame.position),
          ),
        );
        const rounding: number =
          64 *
          2 ** -23 *
          Math.max(
            1,
            Vector3.length(parent.position),
            Vector3.length(child.position),
          );

        // h00 decreases on [0,1]; the remaining maximum of h10 is 4/27 until
        // s=1/3, then h10(s). Their triangle bound never increases and preserves
        // the measured native entry displacement and velocity without a snap.
        const inherited: number = transitions[joint.child]
          ? Vector3.length(transition.position) * fade +
            Vector3.length(transition.velocity) *
              transition.duration *
              (fraction < 1 / 3 ? 4 / 27 : fraction * (1 - fraction) ** 2)
          : body.handoffLimits!.maximumLinearError;
        if (
          distance >
          Math.min(body.handoffLimits!.maximumLinearError, inherited) + rounding
        )
          throw new Error(
            `Physical return violates joint anchor envelope: ${body.id}/${joint.id} at ${seconds}: ${distance} m`,
          );
        const relative: P.ITransform["rotation"] = Quaternion.multiply(
          Quaternion.inverse(
            Quaternion.multiply(parent.rotation, joint.parentFrame.rotation),
          ),
          Quaternion.multiply(child.rotation, joint.childFrame.rotation),
        );
        const error: number = Vector3.length(
          PhysicalRotationVector.log(
            Quaternion.multiply(
              projectPhysicalJointRotation(joint, relative),
              Quaternion.inverse(relative),
            ),
          ),
        );
        if (
          error >
          body.handoffLimits!.maximumJointViolation *
            (transitions[joint.child] ? fade : 1) +
            64 * 2 ** -23
        )
          throw new Error(
            `Physical return violates joint limit envelope: ${body.id}/${joint.id} at ${seconds}: ${error} rad`,
          );
      }
    if (phase === "after") continue;
    for (const source of shapes)
      if (source.body === body.id && transitions[source.bone]) {
        const transition: Handoff = transitions[source.bone]!;
        const fraction: number = Math.min(
          1,
          Math.max(
            0,
            (tick - transition.tick) / (transition.duration * nativeRate),
          ),
        );
        const allowance: number =
          input.contactTolerance! +
          body.handoffLimits!.maximumLinearError *
            (2 * fraction ** 3 - 3 * fraction ** 2 + 1);
        const material: P.IMaterial = body.profile.materials.find(
          (candidate: P.IMaterial): boolean =>
            candidate.id === source.shape.material,
        )!;
        const clearance: number =
          bound.geometry!.minimumY(source) - input.floor;
        if (clearance < -(material.maximumCompression ?? 0) - allowance)
          throw new Error(
            `Physical return intersects floor: ${body.id}/${source.bone} at ${seconds}: ${clearance} m`,
          );
        for (const receiver of shapes) {
          if (
            source === receiver ||
            (receiver.body === source.body &&
              isPhysicalProfilePairExcluded(
                body.profile,
                source.bone,
                receiver.bone,
              ))
          )
            continue;
          const other: Simulation.IBody = input.bodies.find(
            (candidate: Simulation.IBody): boolean =>
              candidate.id === receiver.body,
          )!;
          const compression: number =
            (body.profile.materials.find(
              (material: P.IMaterial): boolean =>
                material.id === source.shape.material,
            )?.maximumCompression ?? 0) +
            (other.profile.materials.find(
              (material: P.IMaterial): boolean =>
                material.id === receiver.shape.material,
            )?.maximumCompression ?? 0);
          const contact: ReturnType<Geometry.IQueries["contact"]> =
            bound.geometry!.contact(source, receiver, seconds);
          if (contact && contact.separation < -compression - allowance)
            throw new Error(
              `Physical return intersects receiver: ${body.id}/${source.bone} with ${other.id}/${receiver.bone} at ${seconds}: ${contact.separation} m`,
            );
        }
      }
  }
}
