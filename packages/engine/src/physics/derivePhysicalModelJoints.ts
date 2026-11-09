import type {
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieModel,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { DEFAULT_JOINT_AXES } from "../kinematics/constants/DEFAULT_JOINT_AXES";
import { HUMANOID_JOINT_AXES } from "../kinematics/constants/HUMANOID_JOINT_AXES";
import { normalizeJointAxes } from "../kinematics/normalizeJointAxes";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { quaternionFromAutoMovieBasis } from "../math/quaternionFromAutoMovieBasis";
import { getConstraint } from "../rom/getConstraint";
import { derivePhysicalActuators } from "./derivePhysicalActuators";

/**
 * Map actual rig-local clinical axes and degree limits into physical joint frames.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Map actual rig-local clinical axes and degree limits into physical joint frames) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Map actual rig-local clinical axes and degree limits into physical joint frames) directly over its typed inputs (`model`, `segments`, `actuator`) as nested iteration of depth 2 (every over [actuator.frequency, actuator.torquePerK; map over (model.skeleton?.bones ?? []) .filte; filter over (model.skeleton?.bones ?? [])), delegating to `Number.isFinite`, `segments.find`, `normalizeJointAxes`, `Vector3.normalize`, `Vector3.cross`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 0.000001, 180, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 96 lines and 3 top-level statements that reuses `Number.isFinite`, `segments.find`, `normalizeJointAxes`, `Vector3.normalize`, `Vector3.cross` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 2 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `model`, `segments`, `actuator`; the dominant cost is nested iteration of depth 2 (every over [actuator.frequency, actuator.torquePerK; map over (model.skeleton?.bones ?? []) .filte; filter over (model.skeleton?.bones ?? [])), performed once per call with 13 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 13 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function derivePhysicalModelJoints(
  model: IAutoMovieModel,
  segments: readonly P.ISegment[],
  actuator: {
    frequency: number;
    dampingRatio: number;
    torquePerKg: number;
    passiveRate?: number;
  },
): P.IJoint[] {
  if (
    ![actuator.frequency, actuator.torquePerKg].every(
      (value: number): boolean => Number.isFinite(value) && value > 0,
    ) ||
    !Number.isFinite(actuator.dampingRatio) ||
    actuator.dampingRatio < 0
  )
    throw new Error("Invalid model actuator assumptions");
  const joints: P.IJoint[] = (model.skeleton?.bones ?? [])
    .filter((bone: IAutoMovieBone): boolean => bone.parent !== null)
    .map((bone: IAutoMovieBone): P.IJoint => {
      const parent: P.ISegment = segments.find(
        (segment: (typeof segments)[number]): boolean =>
          segment.bone === bone.parent,
      )!;
      const child: P.ISegment = segments.find(
        (segment: (typeof segments)[number]): boolean =>
          segment.bone === bone.bone,
      )!;
      const source: IAutoMovieJointAxes = normalizeJointAxes(
        bone.axes ?? HUMANOID_JOINT_AXES[bone.bone] ?? DEFAULT_JOINT_AXES,
        `physical.${bone.bone}`,
      );
      const x: IAutoMovieVector3 = Vector3.normalize(source.flexion);
      const y: IAutoMovieVector3 = Vector3.normalize(source.twist);
      const z: IAutoMovieVector3 = Vector3.cross(x, y);
      const abduction: IAutoMovieVector3 = Vector3.normalize(source.abduction);
      if (
        Math.abs(Vector3.dot(x, y)) > 1e-6 ||
        Math.abs(Math.abs(Vector3.dot(z, abduction)) - 1) > 1e-6
      )
        throw new Error(`Physical model axes are not orthogonal: ${bone.bone}`);
      const basis: P.ITransform["rotation"] = quaternionFromAutoMovieBasis(
        x,
        y,
        z,
      );
      const constraint: IAutoMovieJointConstraint | null = getConstraint(
        bone.bone,
        bone.constraint,
      );
      const inertia: number = Math.max(
        child.inertia.x,
        child.inertia.y,
        child.inertia.z,
      );
      const axes: P.IAxis[] = (
        ["flexion", "twist", "abduction"] as const
      ).flatMap(
        (name: "flexion" | "twist" | "abduction", index: number): P.IAxis[] => {
          const range: IAutoMovieJointConstraint["flexion"] | undefined =
            constraint?.[name];
          if (constraint && range === null) return [];
          const sign: 1 | -1 =
            name === "abduction" && Vector3.dot(z, abduction) < 0 ? -1 : 1;
          const minimum: number = ((range?.min ?? -180) * Math.PI) / 180;
          const maximum: number = ((range?.max ?? 180) * Math.PI) / 180;
          return [
            {
              axis: index === 0 ? "x" : index === 1 ? "y" : "z",
              minimum: sign === 1 ? minimum : -maximum,
              maximum: sign === 1 ? maximum : -minimum,
              coordinateSign: sign,
              sourceDomain: { minimum, maximum },
              channel: `${bone.bone}.${name}`,
              stiffness: inertia * actuator.frequency ** 2,
              damping: 2 * actuator.dampingRatio * inertia * actuator.frequency,
              maximumTorque: child.mass * actuator.torquePerKg,
            },
          ];
        },
      );
      return {
        id: bone.bone,
        parent: parent.bone,
        child: child.bone,
        parentFrame: {
          position: Quaternion.rotateVector(
            Quaternion.inverse(parent.neutral.rotation),
            Vector3.subtract(child.neutral.position, parent.neutral.position),
          ),
          rotation: Quaternion.multiply(
            Quaternion.multiply(
              Quaternion.inverse(parent.neutral.rotation),
              child.neutral.rotation,
            ),
            basis,
          ),
        },
        childFrame: { position: { x: 0, y: 0, z: 0 }, rotation: basis },
        axes,
      };
    });
  return derivePhysicalActuators(segments, joints, actuator);
}
