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

/** Map actual rig-local clinical axes and degree limits into physical joint frames. */
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
