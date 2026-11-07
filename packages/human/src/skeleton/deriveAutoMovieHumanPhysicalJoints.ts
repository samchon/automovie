import {
  Quaternion,
  Vector3,
  derivePhysicalActuators,
} from "@automovie/engine";
import { quaternionFromAutoMovieBasis } from "@automovie/engine/math/quaternionFromAutoMovieBasis";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import type { IAutoMovieHumanPose } from "../structures/pose/IAutoMovieHumanPose";
import type { AutoMovieHumanPhysicalProfile as Provider } from "./AutoMovieHumanPhysicalProfile";
import { AutoMovieHumanPoseChannels } from "./AutoMovieHumanPoseChannels";
import { AutoMovieHumanRigControls as Controls } from "./AutoMovieHumanRigControls";
import type { AutoMovieHumanSkeleton as Skeleton } from "./AutoMovieHumanSkeleton";

/** Derive native-neutral joint frames from this person's actual FK probes and canonical clinical domains. */
export function deriveAutoMovieHumanPhysicalJoints(
  output: Skeleton.IOutput,
  evaluate: Skeleton.PoseEvaluator,
  segments: P.ISegment[],
  neutral: ReadonlyMap<string, P.ITransform>,
  options: Provider.IOptions,
): P.IJoint[] {
  const rotation: (value: readonly number[]) => IAutoMovieQuaternion = (
    value: readonly number[],
  ): IAutoMovieQuaternion => ({
    x: value[0]!,
    y: value[1]!,
    z: value[2]!,
    w: value[3]!,
  });
  const joints: P.IJoint[] = segments
    .filter(
      (segment: (typeof segments)[number]): boolean => segment.bone !== "hips",
    )
    .map((segment: P.ISegment): P.IJoint => {
      let parent: string | null = output.bones.find(
        (bone: (typeof output.bones)[number]): boolean =>
          bone.bone === segment.bone,
      )!.parent;
      while (
        parent &&
        !segments.some(
          (candidate: (typeof segments)[number]): boolean =>
            candidate.bone === parent,
        )
      )
        parent = output.bones.find(
          (bone: (typeof output.bones)[number]): boolean =>
            bone.bone === parent,
        )!.parent;
      if (!parent)
        throw new Error(`Missing physical parent of ${segment.bone}`);
      const rows: (typeof AutoMovieHumanPoseChannels)[number][] =
        AutoMovieHumanPoseChannels.filter(
          (row: (typeof AutoMovieHumanPoseChannels)[number]): boolean =>
            row[1].replace(
              "<side>",
              segment.bone.startsWith("left") ? "left" : "right",
            ) === segment.bone &&
            row[2] !== "forward" &&
            row[2] !== "lateral",
        );
      const directions: IAutoMovieVector3[] = rows.map(
        (row: (typeof rows)[number]): IAutoMovieVector3 => {
          const path: Controls.DegreeChannel = Controls.channel(
            row[0].replace(
              "<side>",
              segment.bone.startsWith("left") ? "left" : "right",
            ),
          );
          const pose: IAutoMovieHumanPose = {};
          const parts: string[] = path.split(".");
          let node: object = pose;
          for (const part of parts.slice(0, -1)) {
            const child: object = {};
            Reflect.set(node, part, child);
            node = child;
          }
          const bounds: ReturnType<typeof Controls.bounds> =
            Controls.bounds(path);
          const degrees: number =
            bounds.maximum > 0
              ? Math.min(0.1, bounds.maximum)
              : Math.max(-0.1, bounds.minimum);
          Reflect.set(node, parts.at(-1)!, degrees);
          // The probe reads coordinate axes, including a knee's temporarily
          // constrained twist at neutral; it never supplies a simulated pose.
          const moved: Skeleton.IOutput = evaluate(pose, false);
          const child: IAutoMovieQuaternion = rotation(
            moved.posed.find(
              (placement: (typeof moved.posed)[number]): boolean =>
                placement.bone === segment.bone,
            )!.rotation,
          );
          const ancestor: IAutoMovieQuaternion = rotation(
            moved.posed.find(
              (placement: (typeof moved.posed)[number]): boolean =>
                placement.bone === parent,
            )!.rotation,
          );
          const relative: IAutoMovieQuaternion = Quaternion.multiply(
            Quaternion.inverse(ancestor),
            child,
          );
          const base: IAutoMovieQuaternion = Quaternion.multiply(
            Quaternion.inverse(neutral.get(parent!)!.rotation),
            segment.neutral.rotation,
          );
          const delta: IAutoMovieQuaternion = Quaternion.multiply(
            Quaternion.inverse(base),
            relative,
          );
          const direction: IAutoMovieVector3 = {
            x: delta.x / degrees,
            y: delta.y / degrees,
            z: delta.z / degrees,
          };
          if (Vector3.length(direction) === 0)
            throw new Error(`Unresolved physical angular coordinate ${path}`);
          return Vector3.normalize(direction);
        },
      );
      const x: IAutoMovieVector3 = directions[0] ?? { x: 1, y: 0, z: 0 };
      const candidateY: IAutoMovieVector3 =
        directions[1] ??
        (Math.abs(x.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 0, y: 0, z: 1 });
      const y: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(
          candidateY,
          Vector3.scale(x, Vector3.dot(x, candidateY)),
        ),
      );
      const z: IAutoMovieVector3 = Vector3.cross(x, y);
      const basis: IAutoMovieQuaternion = quaternionFromAutoMovieBasis(x, y, z);
      const basisDirections: IAutoMovieVector3[] = [x, y, z];
      const axes: P.IAxis[] = rows.map(
        (row: (typeof rows)[number], index: number): P.IAxis => {
          const path: Controls.DegreeChannel = Controls.channel(
            row[0].replace(
              "<side>",
              segment.bone.startsWith("left") ? "left" : "right",
            ),
          );
          const bounds: ReturnType<typeof Controls.bounds> =
            Controls.bounds(path);
          const inertia: number = Math.max(
            segment.inertia.x,
            segment.inertia.y,
            segment.inertia.z,
          );
          const alignment: number = Vector3.dot(
            directions[index]!,
            basisDirections[index]!,
          );
          if (Math.abs(alignment) < 1 - 1e-5)
            throw new Error(
              `Human physical coordinates are not orthogonal: ${path}`,
            );
          const sign: 1 | -1 = alignment < 0 ? -1 : 1;
          return {
            axis: index === 0 ? "x" : index === 1 ? "y" : "z",
            channel: path,
            coordinateSign: sign,
            sourceDomain: {
              minimum: (bounds.minimum * Math.PI) / 180,
              maximum: (bounds.maximum * Math.PI) / 180,
            },
            minimum:
              ((sign === 1 ? bounds.minimum : -bounds.maximum) * Math.PI) / 180,
            maximum:
              ((sign === 1 ? bounds.maximum : -bounds.minimum) * Math.PI) / 180,
            stiffness: inertia * options.frequency ** 2,
            damping: 2 * options.dampingRatio * inertia * options.frequency,
            maximumTorque: segment.mass * options.torquePerKg,
          };
        },
      );
      return {
        id: segment.bone,
        parent,
        child: segment.bone,
        parentFrame: {
          position: Quaternion.rotateVector(
            Quaternion.inverse(neutral.get(parent)!.rotation),
            Vector3.subtract(
              segment.neutral.position,
              neutral.get(parent)!.position,
            ),
          ),
          rotation: Quaternion.multiply(
            Quaternion.multiply(
              Quaternion.inverse(neutral.get(parent)!.rotation),
              segment.neutral.rotation,
            ),
            basis,
          ),
        },
        childFrame: { position: { x: 0, y: 0, z: 0 }, rotation: basis },
        axes,
      };
    });
  return derivePhysicalActuators(segments, joints, options);
}
