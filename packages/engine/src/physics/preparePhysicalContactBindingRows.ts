import type {
  IAutoMovieLinearizePhysicalTargetRows,
  IAutoMoviePhysicalContactBinding,
  IAutoMoviePhysicalContactBindingRows,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalShapeSurfaceAnchor,
  IAutoMoviePoses,
  IAutoMoviePreparePhysicalGeometry,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { linearizePhysicalSeparation } from "./linearizePhysicalSeparation";
import { memoizePhysicalTransformValue } from "./memoizePhysicalTransformValue";
import { physicalShapeSurfaceAnchor } from "./physicalShapeSurfaceAnchor";
import { physicalSupportPoint } from "./physicalSupportPoint";

/**
 * A bone pose and its optional dependency in the candidate being probed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A missing key identifies a fixed reference. The reader returns its world pose.
 * @evidence contracts/development/design.md#principled-representation One read and dependency express the same bone in either an adjustable tree or a fixed snapshot.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A row captures only the pose read and its candidate identity during the fit.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A value borrowed from a fixed snapshot has no derivative key.
 */
export interface IPhysicalContactPoseReference {
  readonly key?: string;
  read(poses: IAutoMoviePoses): IAutoMovieRigidTransform;
}

/**
 * Resolve a scene body and its local bone once when preparing its row.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Accepts admitted body and bone identities and returns their world pose reference.
 * @evidence contracts/development/design.md#principled-representation The two identities distinguish coincident local bone names across participants.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One callback resolves the two actual endpoint reads at row setup.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The resolver determines candidate membership from the fit rather than from shape or body naming conventions.
 */
export type ResolvePhysicalContactPose = (
  body: string,
  bone: string,
) => IPhysicalContactPoseReference;

/**
 * Compile contact and separation rows against resolved source and receiver
 * placements. Both exact and linearized reads use the same pair of poses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the pair of endpoint reads and common nonlinear and local-model ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Keeps the native shape witnesses, initial world start, receiver-local feature and signed residuals of the existing binding.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Both endpoint readers are acquired once. Contact and separation each own a single residual expression.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the admitted collider shape selectors, compression, weighting and geometry checks for both reference modes.
 * @evidence contracts/development/implementation.md#efficient-algorithms Row keys limit probes to moving dependencies. The memoized scalar owners share a geometry reading when their endpoints agree.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The same contact and separation formulas serve fixed receivers and candidate peers.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each row captures its two endpoints and local witnesses during one fit.
 */
export function preparePhysicalContactBindingRows(
  input: IAutoMoviePhysicalContactBindingRows.IInput,
  resolve: ResolvePhysicalContactPose,
): IAutoMoviePhysicalContactBindingRows.IResult {
  return input.bindings.map(
    (
      binding: IAutoMoviePhysicalContactBinding,
    ): { id: string; rows: IAutoMovieLinearizePhysicalTargetRows.IRows } => {
      const source: IAutoMoviePhysicalShape = shape(
        input.profiles[input.body]!,
        binding.source,
      );
      const receiverShape: IAutoMoviePhysicalShape = shape(
        input.profiles[binding.target.body]!,
        binding.target,
      );
      const own: boolean = binding.target.body === input.body;
      const sourcePose: IPhysicalContactPoseReference = resolve(
        input.body,
        binding.source.bone,
      );
      const receiver: IPhysicalContactPoseReference = resolve(
        binding.target.body,
        binding.target.bone,
      );
      const bones: Set<string> = new Set();
      if (sourcePose.key !== undefined) bones.add(sourcePose.key);
      if (receiver.key !== undefined) bones.add(receiver.key);
      const references: (
        poses: IAutoMoviePoses,
      ) => IAutoMovieRigidTransform[] = (
        poses: IAutoMoviePoses,
      ): IAutoMovieRigidTransform[] => [
        sourcePose.read(poses),
        receiver.read(poses),
      ];
      if (binding.kind === "separate") {
        const contact: (
          poses: IAutoMoviePoses,
        ) => ReturnType<IAutoMoviePreparePhysicalGeometry.IQueries["contact"]> =
          memoizePhysicalTransformValue(
            references,
            (
              poses: IAutoMoviePoses,
            ): ReturnType<
              IAutoMoviePreparePhysicalGeometry.IQueries["contact"]
            > => input.geometry.contact(first(poses), second(poses), 0),
          );
        return {
          id: binding.id,
          rows: {
            bones,
            rigidInvariant: own,
            measure: (poses: IAutoMoviePoses): number[] => [
              Math.min(0, contact(poses)?.separation ?? 0) * binding.weight,
            ],
            linearize: (
              poses: IAutoMoviePoses,
            ): ((probe: IAutoMoviePoses) => number[]) => {
              const model: (
                first: IAutoMovieRigidTransform,
                second: IAutoMovieRigidTransform,
              ) => number = linearizePhysicalSeparation(
                input.geometry,
                first(poses),
                second(poses),
                contact(poses),
              );
              return (probe: IAutoMoviePoses): number[] => [
                model(sourcePose.read(probe), receiver.read(probe)) *
                  binding.weight,
              ];
            },
          },
        };
      }
      const pose: IAutoMovieRigidTransform = receiver.read(input.initial);
      const measured: ReturnType<
        IAutoMoviePreparePhysicalGeometry.IQueries["contact"]
      > = input.geometry.contact(
        first(input.initial),
        second(input.initial),
        0,
        100,
      );
      if (!measured)
        throw new Error("Contact binding exceeds query domain: " + binding.id);
      const anchor: IAutoMoviePhysicalShapeSurfaceAnchor.IResult = binding
        .target.normal
        ? physicalShapeSurfaceAnchor(pose, receiverShape, binding.target.normal)
        : {
            point: Vector3.add(
              measured.point,
              Vector3.scale(measured.normal, measured.separation / 2),
            ),
            normal: Vector3.scale(measured.normal, -1),
          };
      const point: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(pose.rotation),
        Vector3.subtract(anchor.point, pose.position),
      );
      const normal: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(pose.rotation),
        anchor.normal,
      );
      const start: IAutoMovieVector3 = input.geometry.project(
        first(input.initial),
        anchor.point,
      );
      const measure: (poses: IAutoMoviePoses) => number[] =
        memoizePhysicalTransformValue(
          references,
          (poses: IAutoMoviePoses): number[] => {
            const target: IAutoMovieRigidTransform = receiver.read(poses);
            const endpoint: IAutoMovieVector3 = Vector3.subtract(
              physicalSupportPoint(target, point),
              Vector3.scale(
                Quaternion.rotateVector(target.rotation, normal),
                binding.compression,
              ),
            );
            const goal: IAutoMovieVector3 = Vector3.add(
              start,
              Vector3.scale(Vector3.subtract(endpoint, start), binding.weight),
            );
            const difference: IAutoMovieVector3 = Vector3.subtract(
              input.geometry.project(first(poses), goal),
              goal,
            );
            return [difference.x, difference.y, difference.z];
          },
        );
      return {
        id: binding.id,
        rows: { bones, measure, linearize: (): typeof measure => measure },
      };

      /** Borrow the actual source collider at the candidate transform. */
      function first(
        poses: IAutoMoviePoses,
      ): IAutoMoviePreparePhysicalGeometry.ICollider {
        return {
          body: input.body,
          bone: binding.source.bone,
          shape: source,
          pose: sourcePose.read(poses),
        };
      }
      /** Borrow the same receiver used by both nonlinear and local model rows. */
      function second(
        poses: IAutoMoviePoses,
      ): IAutoMoviePreparePhysicalGeometry.ICollider {
        return {
          body: binding.target.body,
          bone: binding.target.bone,
          shape: receiverShape,
          pose: receiver.read(poses),
        };
      }
    },
  );
}

/** Admission owns selector validity; the call-local fitter borrows declared geometry. */
function shape(
  profile: IAutoMoviePhysicalProfile,
  selector: { bone: string; shape: string },
): IAutoMoviePhysicalShape {
  return profile.segments
    .find(
      (segment: IAutoMoviePhysicalSegment): boolean =>
        segment.bone === selector.bone,
    )!
    .shapes.find(
      (candidate: IAutoMoviePhysicalShape): boolean =>
        candidate.id === selector.shape,
    )!;
}
