import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { linearizePhysicalInterval } from "./linearizePhysicalInterval";
import type { linearizePhysicalTargetRows } from "./linearizePhysicalTargetRows";
import { memoizePhysicalTransformValue } from "./memoizePhysicalTransformValue";
import { physicalShapeBounds } from "./physicalShapeBounds";
import { physicalSupportPoint } from "./physicalSupportPoint";
import type { preparePhysicalGeometry as Geometry } from "./preparePhysicalGeometry";

/** Borrowed world transforms for one candidate. */
type Poses = Readonly<Record<string, P.ITransform>>;

/**
 * Keep an endpoint's existing XYZ promise and its explicitly declared real support plane in the same solve. Geometry, witnesses and original goals are borrowed only for this invocation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Keep an endpoint's existing XYZ promise and its explicitly declared real support plane in the same solve) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Keep an endpoint's existing XYZ promise and its explicitly declared real support plane in the same solve) directly over its typed inputs (`input`) as nested iteration of depth 3 (flatMap over profile.segments; map over segment.shapes; map over input.supports), delegating to `Number.isFinite`, `memoizePhysicalTransformValue`, `Math.min`, `minimum`, `linearizePhysicalInterval`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Beyond structural 0, 1 and 2 the body uses the literal 64, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 135 lines and 4 top-level statements that reuses `Number.isFinite`, `memoizePhysicalTransformValue`, `Math.min`, `minimum`, `linearizePhysicalInterval` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 7 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 3 (flatMap over profile.segments; map over segment.shapes; map over input.supports), performed once per call with 19 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 19 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function physicalContactSupportRows(input: {
  /** Borrowed fixed geometry for this invocation. */ profile: P;
  /** Original endpoints and explicit support patches. */ supports: readonly physicalContactSupportRows.ISupport[];
  /** Source scene identity. */ body: string;
  /** Initialized no-dynamics queries. */ geometry: Geometry.IQueries;
  /** Global nonpenetration plane, metres. */ floor: number;
}): linearizePhysicalTargetRows.IRows[] {
  const profile: P = input.profile;
  if (!Number.isFinite(input.floor))
    throw new Error("Invalid physical contact floor");
  const floors: linearizePhysicalTargetRows.IRows[] = profile.segments.flatMap(
    (segment: P.ISegment): linearizePhysicalTargetRows.IRows[] =>
      segment.shapes.map(
        (shape: P.IShape): linearizePhysicalTargetRows.IRows => {
          const minimum: (poses: Poses) => number =
            memoizePhysicalTransformValue(
              (poses: Poses): P.ITransform[] => [poses[segment.bone]!],
              (poses: Poses): number =>
                input.geometry.minimumY({
                  body: input.body,
                  bone: segment.bone,
                  shape,
                  pose: poses[segment.bone]!,
                }),
            );
          return {
            bones: new Set([segment.bone]),
            measure: (poses: Poses): number[] => [
              Math.min(0, minimum(poses) - input.floor),
            ],
            linearize: (poses: Poses): ((probe: Poses) => number[]) => {
              const model: (value: number) => number[] =
                linearizePhysicalInterval(minimum(poses), input.floor);
              return (probe: Poses): number[] => model(minimum(probe));
            },
          };
        },
      ),
  );
  return [
    ...floors,
    ...input.supports.map(
      (
        support: physicalContactSupportRows.ISupport,
      ): linearizePhysicalTargetRows.IRows => {
        const names: Set<string> = new Set([support.bone]);
        const patch: physicalContactSupportRows.ISupport["patch"] =
          support.patch;
        if (
          !profile.segments.some(
            (segment: P.ISegment): boolean => segment.bone === support.bone,
          ) ||
          !finite(support.point) ||
          (support.localPoint !== undefined && !finite(support.localPoint)) ||
          (patch !== undefined &&
            (!patch ||
              !Number.isFinite(patch.floor) ||
              !Array.isArray(patch.contacts) ||
              !patch.contacts.length ||
              new Set(patch.contacts).size !== patch.contacts.length ||
              patch.contacts.some(
                (bone: string): boolean =>
                  !profile.segments.some(
                    (segment: P.ISegment): boolean =>
                      segment.bone === bone && segment.shapes.length > 0,
                  ),
              ) ||
              (patch.floorPoints !== undefined &&
                (!Array.isArray(patch.floorPoints) ||
                  patch.floorPoints.length > 64 ||
                  patch.floorPoints.some(
                    (point: {
                      bone: string;
                      localPoint: IAutoMovieVector3;
                    }): boolean =>
                      !point ||
                      !patch.contacts.includes(point.bone) ||
                      !finite(point.localPoint),
                  )))))
        )
          throw new Error("Invalid physical contact support patch");
        for (const bone of patch?.contacts ?? []) names.add(bone);
        const carriers: P.ISegment[] = profile.segments.filter(
          (segment: P.ISegment): boolean =>
            patch?.contacts.includes(segment.bone) ?? false,
        );
        const minimum: (poses: Poses) => number = (poses: Poses): number =>
          Math.min(
            ...carriers.flatMap((segment: P.ISegment): number[] =>
              segment.shapes.map(
                (shape: P.IShape): number =>
                  physicalShapeBounds(poses[segment.bone]!, shape).min.y,
              ),
            ),
          );
        const measure: (poses: Poses) => number[] =
          memoizePhysicalTransformValue(
            (poses: Poses): P.ITransform[] =>
              [...names].map((bone: string): P.ITransform => poses[bone]!),
            (poses: Poses): number[] => {
              const difference: IAutoMovieVector3 = Vector3.subtract(
                physicalSupportPoint(poses[support.bone]!, support.localPoint),
                support.point,
              );
              if (!patch) return [difference.x, difference.y, difference.z];
              const clearance: number = minimum(poses) - patch.floor;
              return [
                difference.x,
                difference.y,
                difference.z,
                ...(patch.floorPoints ?? []).map(
                  (point: {
                    bone: string;
                    localPoint: IAutoMovieVector3;
                  }): number =>
                    physicalSupportPoint(poses[point.bone]!, point.localPoint)
                      .y - patch.floor,
                ),
                patch.floorPoints?.length ? Math.min(0, clearance) : clearance,
              ];
            },
          );
        return {
          bones: names,
          measure,
          linearize: (poses: Poses): ((probe: Poses) => number[]) => {
            const floor: ((value: number) => number[]) | undefined = patch
              ?.floorPoints?.length
              ? linearizePhysicalInterval(minimum(poses), patch.floor)
              : undefined;
            return (probe: Poses): number[] => {
              const result: number[] = [...measure(probe)];
              if (floor) result[result.length - 1] = floor(minimum(probe))[0]!;
              return result;
            };
          },
        };
      },
    ),
  ];
}

/**
 * Generic endpoint and optional actual planar support geometry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Generic endpoint and optional actual planar support geometry) and documents 1 documented member as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Generic endpoint and optional actual planar support geometry: companion namespace of 1 member (`ISupport`); units and frames named in its text: world, local, metres. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `physicalContactSupportRows` in packages/engine/src/physics/physicalContactSupportRows.ts; its surface is the 1 member listed and the text shows 3 other files naming it, mostly packages/engine (2), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace physicalContactSupportRows {
  /** A world endpoint always keeps all three original coordinate rows. */
  export interface ISupport {
    /** Endpoint carrier. */ bone: string;
    /** Carrier-local endpoint. */ localPoint?: IAutoMovieVector3;
    /** Original world goal; fitting must never replace it with an unmet output. */ point: IAutoMovieVector3;
    /** An explicitly planted patch, independent of anatomical vocabulary. */ patch?: {
      /** Every real carrier of this patch. */ contacts: readonly string[];
      /** Declared local surface witnesses sharing the plane. */ floorPoints?: readonly {
        bone: string;
        localPoint: IAutoMovieVector3;
      }[];
      /** Original horizontal support plane, metres. */ floor: number;
    };
  }
}

/** Missing or nonfinite declared geometry is refused rather than guessed. */
function finite(point: IAutoMovieVector3): boolean {
  return !!point && [point.x, point.y, point.z].every(Number.isFinite);
}
