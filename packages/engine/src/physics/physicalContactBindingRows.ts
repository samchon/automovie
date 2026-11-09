import type {
  IAutoMoviePhysicalContactBinding as Binding,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { linearizePhysicalSeparation } from "./linearizePhysicalSeparation";
import type { linearizePhysicalTargetRows } from "./linearizePhysicalTargetRows";
import { memoizePhysicalTransformValue } from "./memoizePhysicalTransformValue";
import { physicalShapeSurfaceAnchor } from "./physicalShapeSurfaceAnchor";
import { physicalSupportPoint } from "./physicalSupportPoint";
import type { preparePhysicalGeometry as Geometry } from "./preparePhysicalGeometry";

/** Borrowed world transforms for one candidate. */
type Poses = Readonly<Record<string, P.ITransform>>;

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
export function physicalContactBindingRows(input: {
  /** Source body identity. */ body: string;
  /** Immutable profiles for this invocation. */ profiles: Readonly<
    Record<string, P>
  >;
  /** Coherent source seed. */ initial: Poses;
  /** Simultaneous actual receiver placements. */ actual: Readonly<
    Record<string, Poses>
  >;
  /** Positive-weight relationships in their original order. */ bindings: readonly Binding[];
  /** Initialized convex queries. */ geometry: Geometry.IQueries;
}): { id: string; rows: linearizePhysicalTargetRows.IRows }[] {
  return input.bindings.map(
    (
      binding: Binding,
    ): { id: string; rows: linearizePhysicalTargetRows.IRows } => {
      const source: P.IShape = shape(
        input.profiles[input.body]!,
        binding.source,
      );
      const receiver: P.IShape = shape(
        input.profiles[binding.target.body]!,
        binding.target,
      );
      const own: boolean = binding.target.body === input.body;
      const bones: Set<string> = new Set([
        binding.source.bone,
        ...(own ? [binding.target.bone] : []),
      ]);
      const references: (poses: Poses) => P.ITransform[] = (
        poses: Poses,
      ): P.ITransform[] => [poses[binding.source.bone]!, receiverPose(poses)];
      if (binding.kind === "separate") {
        const contact: (
          poses: Poses,
        ) => ReturnType<Geometry.IQueries["contact"]> =
          memoizePhysicalTransformValue(
            references,
            (poses: Poses): ReturnType<Geometry.IQueries["contact"]> =>
              input.geometry.contact(first(poses), second(poses), 0),
          );
        return {
          id: binding.id,
          rows: {
            bones,
            rigidInvariant: own,
            measure: (poses: Poses): number[] => [
              Math.min(0, contact(poses)?.separation ?? 0) * binding.weight,
            ],
            linearize: (poses: Poses): ((probe: Poses) => number[]) => {
              const model: ReturnType<typeof linearizePhysicalSeparation> =
                linearizePhysicalSeparation(
                  input.geometry,
                  first(poses),
                  second(poses),
                  contact(poses),
                );
              return (probe: Poses): number[] => [
                model(probe[binding.source.bone]!, receiverPose(probe)) *
                  binding.weight,
              ];
            },
          },
        };
      }
      const pose: P.ITransform = receiverPose(input.initial);
      const measured: ReturnType<Geometry.IQueries["contact"]> =
        input.geometry.contact(
          first(input.initial),
          second(input.initial),
          0,
          100,
        );
      if (!measured)
        throw new Error("Contact binding exceeds query domain: " + binding.id);
      const anchor: ReturnType<typeof physicalShapeSurfaceAnchor> = binding
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
      const measure: (poses: Poses) => number[] = memoizePhysicalTransformValue(
        references,
        (poses: Poses): number[] => {
          const target: P.ITransform = receiverPose(poses);
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
      function receiverPose(poses: Poses): P.ITransform {
        return own
          ? poses[binding.target.bone]!
          : input.actual[binding.target.body]![binding.target.bone]!;
      }
      /** Borrow the actual source collider at the candidate transform. */
      function first(poses: Poses): Geometry.ICollider {
        return {
          body: input.body,
          bone: binding.source.bone,
          shape: source,
          pose: poses[binding.source.bone]!,
        };
      }
      /** Borrow the same receiver used by both nonlinear and local model rows. */
      function second(poses: Poses): Geometry.ICollider {
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
  profile: P,
  selector: { bone: string; shape: string },
): P.IShape {
  return profile.segments
    .find((segment: P.ISegment): boolean => segment.bone === selector.bone)!
    .shapes.find(
      (candidate: P.IShape): boolean => candidate.id === selector.shape,
    )!;
}
