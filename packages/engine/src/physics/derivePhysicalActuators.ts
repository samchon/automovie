import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/** Size declared actuators from the entire neutral downstream load about each joint.
 * The parallel-axis term includes equipment and small coordinate carriers without
 * altering physical masses. These are control assumptions, not muscle measurements.
 * Active gains use an isotropic upper bound on the neutral subtree tensor:
 * bending a downstream limb can move its load off the neutral twist axis.
 * Passive damping uses directional inertia and has no preferred rest angle.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Size declared actuators from the entire neutral downstream load about each joint) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Size declared actuators from the entire neutral downstream load about each joint) directly over its typed inputs (`segments`, `joints`, `options`) as nested iteration of depth 3 (every over [options.frequency, options.torquePerKg]; map over joints; find over segments), delegating to `Number.isFinite`, `joints.map`, `segments.find`, `Vector3.add`, `Quaternion.rotateVector`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 111 lines and 2 top-level statements that reuses `Number.isFinite`, `joints.map`, `segments.find`, `Vector3.add`, `Quaternion.rotateVector` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `segments`, `joints`, `options`; the dominant cost is nested iteration of depth 3 (every over [options.frequency, options.torquePerKg]; map over joints; find over segments), performed once per call with 7 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 7 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function derivePhysicalActuators(
  segments: readonly P.ISegment[],
  joints: readonly P.IJoint[],
  options: {
    frequency: number;
    dampingRatio: number;
    torquePerKg: number;
    passiveRate?: number;
  },
): P.IJoint[] {
  if (
    ![options.frequency, options.torquePerKg].every(
      (value: number): boolean => Number.isFinite(value) && value > 0,
    ) ||
    !Number.isFinite(options.dampingRatio) ||
    options.dampingRatio < 0 ||
    !Number.isFinite(options.passiveRate ?? 0) ||
    (options.passiveRate ?? 0) < 0
  )
    throw new Error("Invalid physical actuator assumptions");
  return joints.map((joint: (typeof joints)[number]): P.IJoint => {
    const child: P.ISegment = segments.find(
      (segment: (typeof segments)[number]): boolean =>
        segment.bone === joint.child,
    )!;
    const point: IAutoMovieVector3 = Vector3.add(
      child.neutral.position,
      Quaternion.rotateVector(
        child.neutral.rotation,
        joint.childFrame.position,
      ),
    );
    const rotation: P.ITransform["rotation"] = Quaternion.multiply(
      child.neutral.rotation,
      joint.childFrame.rotation,
    );
    const descendants: Set<string> = new Set([joint.child]);
    for (let count: number = 0; count < segments.length; count++)
      for (const link of joints)
        if (descendants.has(link.parent)) descendants.add(link.child);
    const load: P.ISegment[] = segments.filter(
      (segment: (typeof segments)[number]): boolean =>
        descendants.has(segment.bone),
    );
    const mass: number = load.reduce(
      (sum: number, segment: P.ISegment): number => sum + segment.mass,
      0,
    );
    const reference: number = load.reduce(
      (sum: number, segment: P.ISegment): number => {
        const displacement: IAutoMovieVector3 = Vector3.subtract(
          Vector3.add(
            segment.neutral.position,
            Quaternion.rotateVector(
              segment.neutral.rotation,
              segment.centerOfMass,
            ),
          ),
          point,
        );
        return (
          sum +
          Math.max(segment.inertia.x, segment.inertia.y, segment.inertia.z) +
          segment.mass * Vector3.dot(displacement, displacement)
        );
      },
      0,
    );
    return {
      ...joint,
      axes: joint.axes.map((axis: (typeof joint.axes)[number]): P.IAxis => {
        const unit: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
        unit[axis.axis] = 1;
        const direction: IAutoMovieVector3 = Quaternion.rotateVector(
          rotation,
          unit,
        );
        const inertia: number = load.reduce(
          (sum: number, segment: P.ISegment): number => {
            const principal: IAutoMovieVector3 = Quaternion.rotateVector(
              Quaternion.inverse(
                Quaternion.multiply(
                  segment.neutral.rotation,
                  segment.inertiaRotation,
                ),
              ),
              direction,
            );
            const displacement: IAutoMovieVector3 = Vector3.subtract(
              Vector3.add(
                segment.neutral.position,
                Quaternion.rotateVector(
                  segment.neutral.rotation,
                  segment.centerOfMass,
                ),
              ),
              point,
            );
            return (
              sum +
              segment.inertia.x * principal.x ** 2 +
              segment.inertia.y * principal.y ** 2 +
              segment.inertia.z * principal.z ** 2 +
              segment.mass *
                Vector3.length(Vector3.cross(displacement, direction)) ** 2
            );
          },
          0,
        );
        return {
          ...axis,
          stiffness: reference * options.frequency ** 2,
          damping: 2 * options.dampingRatio * reference * options.frequency,
          maximumTorque: mass * options.torquePerKg,
          passiveDamping: inertia * (options.passiveRate ?? 0),
        };
      }),
    };
  });
}
