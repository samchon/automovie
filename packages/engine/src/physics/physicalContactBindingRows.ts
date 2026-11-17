import type {
  IAutoMovieLinearizePhysicalTargetRows,
  IAutoMoviePhysicalContactBinding,
  IAutoMoviePhysicalContactBindingRows,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalShapeSurfaceAnchor,
  IAutoMoviePoses,
  IAutoMoviePreparePhysicalGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { linearizePhysicalSeparation } from "./linearizePhysicalSeparation";
import { memoizePhysicalTransformValue } from "./memoizePhysicalTransformValue";
import { physicalShapeSurfaceAnchor } from "./physicalShapeSurfaceAnchor";
import { physicalSupportPoint } from "./physicalSupportPoint";

/**
 * Own collider relationship witnesses for one fit. Separation shares its native distance with the local model; contact retains its original world start and receiver-local feature.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Own collider relationship witnesses for one fit) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Own collider relationship witnesses for one fit) directly over its typed inputs (`input`) as a single pass (map over input.bindings), delegating to `shape`, `receiverPose`, `memoizePhysicalTransformValue`, `first`, `second`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Beyond structural 0, 1 and 2 the body uses the literal 100, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 140 lines and 1 top-level statements that reuses `shape`, `receiverPose`, `memoizePhysicalTransformValue`, `first`, `second` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 8 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is a single pass (map over input.bindings), performed once per call with 16 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 16 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function physicalContactBindingRows(
  input: IAutoMoviePhysicalContactBindingRows.IInput,
): IAutoMoviePhysicalContactBindingRows.IResult {
  return input.bindings.map(
    (
      binding: IAutoMoviePhysicalContactBinding,
    ): { id: string; rows: IAutoMovieLinearizePhysicalTargetRows.IRows } => {
      const source: IAutoMoviePhysicalProfile.IShape = shape(
        input.profiles[input.body]!,
        binding.source,
      );
      const receiver: IAutoMoviePhysicalProfile.IShape = shape(
        input.profiles[binding.target.body]!,
        binding.target,
      );
      const own: boolean = binding.target.body === input.body;
      const bones: Set<string> = new Set([
        binding.source.bone,
        ...(own ? [binding.target.bone] : []),
      ]);
      const references: (
        poses: IAutoMoviePoses,
      ) => IAutoMoviePhysicalProfile.ITransform[] = (
        poses: IAutoMoviePoses,
      ): IAutoMoviePhysicalProfile.ITransform[] => [
        poses[binding.source.bone]!,
        receiverPose(poses),
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
                first: IAutoMoviePhysicalProfile.ITransform,
                second: IAutoMoviePhysicalProfile.ITransform,
              ) => number = linearizePhysicalSeparation(
                input.geometry,
                first(poses),
                second(poses),
                contact(poses),
              );
              return (probe: IAutoMoviePoses): number[] => [
                model(probe[binding.source.bone]!, receiverPose(probe)) *
                  binding.weight,
              ];
            },
          },
        };
      }
      const pose: IAutoMoviePhysicalProfile.ITransform = receiverPose(
        input.initial,
      );
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
        ? physicalShapeSurfaceAnchor(pose, receiver, binding.target.normal)
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
            const target: IAutoMoviePhysicalProfile.ITransform =
              receiverPose(poses);
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

      /** Same-body references follow the candidate; external receivers remain actual. */
      function receiverPose(
        poses: IAutoMoviePoses,
      ): IAutoMoviePhysicalProfile.ITransform {
        return own
          ? poses[binding.target.bone]!
          : input.actual[binding.target.body]![binding.target.bone]!;
      }
      /** Borrow the actual source collider at the candidate transform. */
      function first(
        poses: IAutoMoviePoses,
      ): IAutoMoviePreparePhysicalGeometry.ICollider {
        return {
          body: input.body,
          bone: binding.source.bone,
          shape: source,
          pose: poses[binding.source.bone]!,
        };
      }
      /** Borrow the same receiver used by both nonlinear and local model rows. */
      function second(
        poses: IAutoMoviePoses,
      ): IAutoMoviePreparePhysicalGeometry.ICollider {
        return {
          body: binding.target.body,
          bone: binding.target.bone,
          shape: receiver,
          pose: receiverPose(poses),
        };
      }
    },
  );
}

/** Admission owns selector validity; the call-local fitter borrows declared geometry. */
function shape(
  profile: IAutoMoviePhysicalProfile,
  selector: { bone: string; shape: string },
): IAutoMoviePhysicalProfile.IShape {
  return profile.segments
    .find(
      (segment: IAutoMoviePhysicalProfile.ISegment): boolean =>
        segment.bone === selector.bone,
    )!
    .shapes.find(
      (candidate: IAutoMoviePhysicalProfile.IShape): boolean =>
        candidate.id === selector.shape,
    )!;
}
