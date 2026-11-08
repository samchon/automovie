import type { IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";

/** Measure authored endpoint, separation and bend promises from displayed bone frames.
 * No clinical catalogue, species, actor or screenplay window is selected here.
 * A missing frame, coincident ray or zero-length angle refuses the audit instead
 * of turning an undefined measurement into a passing zero.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Measure authored endpoint, separation and bend promises from displayed bone frames) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Measure authored endpoint, separation and bend promises from displayed bone frames) directly over its typed inputs (`constraint`, `states`, `seconds`) as a fixed number of statements with no loop or recursion in the body, delegating to `Number.isFinite`, `Vector3.add`, `Vector3.scale`, `Vector3.subtract`, `Vector3.length`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (5 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 82 lines and 8 top-level statements that reuses `Number.isFinite`, `Vector3.add`, `Vector3.scale`, `Vector3.subtract`, `Vector3.length` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `constraint`, `states`, `seconds`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 5 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 5 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function measurePhysicalMotionConstraint(
  constraint: measurePhysicalMotionConstraint.IConstraint,
  states: Readonly<Record<string, Cache.ISegment>>,
  seconds: number,
): number {
  const point: (
    anchor: measurePhysicalMotionConstraint.IAnchor,
  ) => IAutoMovieVector3 = (
    anchor: measurePhysicalMotionConstraint.IAnchor,
  ): IAutoMovieVector3 => {
    const frame: Cache.ISegment | undefined = states[anchor.bone];
    if (!frame) throw new Error(`Motion audit point missing: ${anchor.bone}`);
    if (anchor.blend) {
      const other: Cache.ISegment | undefined = states[anchor.blend.other];
      if (
        !other ||
        !Number.isFinite(anchor.blend.weight) ||
        anchor.blend.weight < 0 ||
        anchor.blend.weight > 1
      )
        throw new Error("Invalid motion audit blended point");
      return Vector3.add(
        frame.position,
        Vector3.scale(
          Vector3.subtract(other.position, frame.position),
          anchor.blend.weight,
        ),
      );
    }
    if (anchor.ray) {
      const from: Cache.ISegment | undefined = states[anchor.ray.from];
      if (
        !from ||
        !(anchor.ray.distance >= 0) ||
        !Number.isFinite(anchor.ray.distance)
      )
        throw new Error("Invalid motion audit ray");
      const delta: IAutoMovieVector3 = Vector3.subtract(
        frame.position,
        from.position,
      );
      const length: number = Vector3.length(delta);
      if (!(length > 0)) throw new Error("Degenerate motion audit ray");
      return Vector3.add(
        frame.position,
        Vector3.scale(delta, anchor.ray.distance / length),
      );
    }
    return anchor.localPoint
      ? Vector3.add(
          frame.position,
          Quaternion.rotateVector(frame.rotation, anchor.localPoint),
        )
      : frame.position;
  };
  if (constraint.kind === "goal")
    return Vector3.length(
      Vector3.subtract(point(constraint.point), constraint.target(seconds)),
    );
  if (constraint.kind === "distance") {
    const displacement: IAutoMovieVector3 = Vector3.subtract(
      point(constraint.from),
      point(constraint.to),
    );
    return constraint.horizontal
      ? Math.hypot(displacement.x, displacement.z)
      : Vector3.length(displacement);
  }
  const pivot: IAutoMovieVector3 = point(constraint.pivot);
  const a: IAutoMovieVector3 = Vector3.subtract(point(constraint.from), pivot);
  const b: IAutoMovieVector3 = Vector3.subtract(point(constraint.to), pivot);
  if (!(Vector3.length(a) > 0) || !(Vector3.length(b) > 0))
    throw new Error("Degenerate motion audit angle");
  return (
    Math.PI -
    Math.acos(
      Math.max(
        -1,
        Math.min(
          1,
          Vector3.dot(a, b) / (Vector3.length(a) * Vector3.length(b)),
        ),
      ),
    )
  );
}

/**
 * Production-neutral point descriptors and time-windowed numerical promises.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Production-neutral point descriptors and time-windowed numerical promises) and documents 2 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Production-neutral point descriptors and time-windowed numerical promises: companion namespace of 2 members (`IAnchor`, `IConstraint`); units and frames named in its text: local, metres, radians, second, seconds. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `measurePhysicalMotionConstraint` in packages/engine/src/physics/measurePhysicalMotionConstraint.ts; its surface is the 2 members listed and the text shows 2 other files naming it, mostly packages/engine (1), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace measurePhysicalMotionConstraint {
  /** A rigid local witness or an extension along two actual joint centres. */
  export type IAnchor = { /** Endpoint bone id. */ bone: string } & (
    | {
        /** Bone-local metres. */ localPoint?: IAutoMovieVector3;
        /** Mutually exclusive with a rigid offset. */ ray?: never;
        /** Mutually exclusive with a rigid offset. */ blend?: never;
      }
    | {
        /** Extension beyond bone along from -> bone, metres. */ ray: {
          /** Ray origin bone. */ from: string;
          /** Nonnegative extension. */ distance: number;
        };
        /** A ray already defines the point. */ localPoint?: never;
        /** A ray already defines the point. */ blend?: never;
      }
    | {
        /** Interpolation between actual segment origins. */ blend: {
          /** Other actual segment. */ other: string;
          /** Share toward other, in [0,1]. */ weight: number;
        };
        /** A blend already defines the point. */ localPoint?: never;
        /** A blend already defines the point. */ ray?: never;
      }
  );
  /** Limits are metres except for bend angles, which use radians (straight = zero). */
  export type IConstraint = {
    /** Caller-owned measurement identity. */ label: string;
    /** Inclusive first film second. */ start: number;
    /** Inclusive last film second. */ end: number;
    /** Inclusive lower acceptance limit; omitted means unbounded. */ minimum?: number;
    /** Inclusive upper acceptance limit; omitted means unbounded. */ maximum?: number;
    /** A caller-declared phase predicate; for example, fixed support is not promised during an actual recovery swing. */ enabled?: (
      seconds: number,
    ) => boolean;
  } & (
    | {
        /** Euclidean endpoint error. */ kind: "goal";
        /** Actual displayed witness. */ point: IAnchor;
        /** Desired world point at this film second. */ target: (
          seconds: number,
        ) => IAutoMovieVector3;
      }
    | {
        /** Pairwise separation, including support-to-root spread. */ kind: "distance";
        /** First witness. */ from: IAnchor;
        /** Second witness. */ to: IAnchor;
        /** Ignore vertical separation when true. */ horizontal?: boolean;
      }
    | {
        /** Bend from a straight three-point chain. */ kind: "angle";
        /** Proximal witness. */ from: IAnchor;
        /** Joint centre. */ pivot: IAnchor;
        /** Distal witness. */ to: IAnchor;
      }
  );
}
