import type {
  IAutoMovieBone,
  IAutoMovieDerivePhysicalActuators,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieModel,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMoviePhysicalSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineDefaultJointAxes } from "../../kinematics/AutoMovieEngineDefaultJointAxes";
import { AutoMovieEngineHumanoidJointAxes } from "../../kinematics/AutoMovieEngineHumanoidJointAxes";
import { normalizeJointAxes } from "../../kinematics/internal/normalizeJointAxes";
import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { quaternionFromAutoMovieBasis } from "../../math/internal/quaternionFromAutoMovieBasis";
import { getConstraint } from "../../rom/internal/getConstraint";
import { derivePhysicalActuators } from "./derivePhysicalActuators";

/*
 * Map actual rig-local clinical axes and degree limits into physical joint
 * frames.
 */
export function derivePhysicalModelJoints(
  model: IAutoMovieModel,
  segments: readonly IAutoMoviePhysicalSegment[],
  actuator: IAutoMovieDerivePhysicalActuators.IOptions,
): IAutoMoviePhysicalJoint[] {
  if (
    actuator.frequency <= 0 ||
    actuator.torquePerKg <= 0 ||
    actuator.dampingRatio < 0
  )
    throw new Error("Invalid model actuator assumptions");
  const joints: IAutoMoviePhysicalJoint[] = (model.skeleton?.bones ?? [])
    .filter((bone: IAutoMovieBone): boolean => bone.parent !== null)
    .map((bone: IAutoMovieBone): IAutoMoviePhysicalJoint => {
      const parent: IAutoMoviePhysicalSegment = segments.find(
        (segment: (typeof segments)[number]): boolean =>
          segment.bone === bone.parent,
      )!;
      const child: IAutoMoviePhysicalSegment = segments.find(
        (segment: (typeof segments)[number]): boolean =>
          segment.bone === bone.bone,
      )!;
      const source: IAutoMovieJointAxes = normalizeJointAxes(
        bone.axes ?? AutoMovieEngineHumanoidJointAxes[bone.bone] ?? AutoMovieEngineDefaultJointAxes,
        `physical.${bone.bone}`,
      );
      const x: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(source.flexion);
      const y: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(source.twist);
      const z: IAutoMovieVector3 = AutoMovieEngineVector3.cross(x, y);
      const abduction: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(source.abduction);
      if (
        Math.abs(AutoMovieEngineVector3.dot(x, y)) > 1e-6 ||
        Math.abs(Math.abs(AutoMovieEngineVector3.dot(z, abduction)) - 1) > 1e-6
      )
        throw new Error(`Physical model axes are not orthogonal: ${bone.bone}`);
      const basis: IAutoMovieRigidTransform["rotation"] =
        quaternionFromAutoMovieBasis(x, y, z);
      const constraint: IAutoMovieJointConstraint | null = getConstraint(
        bone.bone,
        bone.constraint,
      );
      const inertia: number = Math.max(
        child.inertia.x,
        child.inertia.y,
        child.inertia.z,
      );
      const axes: IAutoMoviePhysicalJointAxis[] = (
        ["flexion", "twist", "abduction"] as const
      ).flatMap(
        (
          name: "flexion" | "twist" | "abduction",
          index: number,
        ): IAutoMoviePhysicalJointAxis[] => {
          const range: IAutoMovieJointConstraint["flexion"] | undefined =
            constraint?.[name];
          if (constraint && range === null) return [];
          const sign: 1 | -1 =
            name === "abduction" && AutoMovieEngineVector3.dot(z, abduction) < 0 ? -1 : 1;
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
          position: AutoMovieEngineQuaternion.rotateVector(
            AutoMovieEngineQuaternion.inverse(parent.neutral.rotation),
            AutoMovieEngineVector3.subtract(child.neutral.position, parent.neutral.position),
          ),
          rotation: AutoMovieEngineQuaternion.multiply(
            AutoMovieEngineQuaternion.multiply(
              AutoMovieEngineQuaternion.inverse(parent.neutral.rotation),
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
