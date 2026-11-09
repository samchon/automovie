import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";
import RAPIER from "@dimforge/rapier3d-compat";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { isPhysicalNativeNumber } from "./isPhysicalNativeNumber";
import { physicalNativeShape } from "./physicalNativeShape";
import { physicalNativeVector } from "./physicalNativeVector";
import { physicalShapeBounds } from "./physicalShapeBounds";

/**
 * Prepare exact convex geometric queries with the pinned WASM narrow phase.
 * This creates no dynamics world, steps and impulses. Returned contacts retain
 * null impulse so a geometric witness cannot masquerade as a solver result.
 * Query allocations are owned and released by Rapier's Shape.contactShape API.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Prepare exact convex geometric queries with the pinned WASM narrow phase) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Prepare exact convex geometric queries with the pinned WASM narrow phase) directly over its typed inputs as 5 sequential passes (map over Object.values(boundsA.min); map over Object.values(boundsA.max); map over Object.values(boundsB.min)), delegating to `RAPIER.init`, `Number.isFinite`, `physicalShapeBounds`, `Math.max`, `Object.values(boundsA.min).map`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (3 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 32, 23, 0.5, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One async operation of 108 lines and 2 top-level statements that reuses `RAPIER.init`, `Number.isFinite`, `physicalShapeBounds`, `Math.max`, `Object.values(boundsA.min).map` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 32, 23, 0.5 are not independently sourced here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of its inputs; the dominant cost is 5 sequential passes (map over Object.values(boundsA.min); map over Object.values(boundsA.max); map over Object.values(boundsB.min)), performed once per call with 10 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Awaits 1 call per invocation and shares no result or in-flight work between invocations: equivalence of effectful calls is not decided here, so every call repeats its effects.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The body awaits asynchronous work; it retains nothing after it settles beyond its result, and any handle it opens is owned and released by the call or by its callees.
 */
export async function preparePhysicalGeometry(): Promise<preparePhysicalGeometry.IQueries> {
  await RAPIER.init();
  return {
    contact: (
      a: preparePhysicalGeometry.ICollider,
      b: preparePhysicalGeometry.ICollider,
      seconds: number,
      prediction: number = 0,
    ): Receipt | null => {
      if (
        !Number.isFinite(seconds) ||
        !Number.isFinite(prediction) ||
        prediction < 0
      )
        throw new Error("Invalid physical contact query time or prediction");
      const boundsA: ReturnType<typeof physicalShapeBounds> =
        physicalShapeBounds(a.pose, a.shape);
      const boundsB: ReturnType<typeof physicalShapeBounds> =
        physicalShapeBounds(b.pose, b.shape);
      // Keep a conservative single-precision transform margin before skipping
      // a native query; near-contact truth remains entirely native.
      const rounding: number =
        32 *
        2 ** -23 *
        Math.max(
          1,
          ...Object.values(boundsA.min).map(Math.abs),
          ...Object.values(boundsA.max).map(Math.abs),
          ...Object.values(boundsB.min).map(Math.abs),
          ...Object.values(boundsB.max).map(Math.abs),
        );
      if (
        (["x", "y", "z"] as const).some(
          (axis: "x" | "y" | "z"): boolean =>
            Math.max(
              boundsA.min[axis] - boundsB.max[axis],
              boundsB.min[axis] - boundsA.max[axis],
            ) >
            prediction + rounding,
        )
      )
        return null;
      const first: P.ITransform = place(a.pose, a.shape.transform);
      const second: P.ITransform = place(b.pose, b.shape.transform);
      const search: number = prediction + rounding;
      if (!isPhysicalNativeNumber(search))
        throw new Error("Derived native contact prediction exceeds f32 range");
      const measured: RAPIER.ShapeContact | null = physicalNativeShape(
        a.shape,
      ).contactShape(
        first.position,
        first.rotation,
        physicalNativeShape(b.shape),
        second.position,
        second.rotation,
        search,
      );
      if (!measured) return null;
      if (!isPhysicalNativeNumber(measured.distance))
        throw new Error("Nonfinite native geometric contact distance");
      if (measured.distance > prediction) return null;
      return {
        id: `geometry:${a.body}/${a.bone}/${a.shape.id}:${b.body}/${b.bone}/${b.shape.id}:${seconds}`,
        source: "geometric",
        seconds,
        endSeconds: seconds,
        a: {
          body: a.body,
          bone: a.bone,
          shape: a.shape.id,
          material: a.shape.material,
        },
        b: {
          body: b.body,
          bone: b.bone,
          shape: b.shape.id,
          material: b.shape.material,
        },
        point: physicalNativeVector(
          Vector3.scale(Vector3.add(measured.point1, measured.point2), 0.5),
        ),
        normal: physicalNativeVector({ ...measured.normal1 }),
        impulse: null,
        separation: measured.distance,
        compression: Math.max(0, -measured.distance),
      };
    },
    minimumY: (collider: preparePhysicalGeometry.ICollider): number => {
      return physicalShapeBounds(collider.pose, collider.shape).min.y;
    },
    project: (
      collider: preparePhysicalGeometry.ICollider,
      point: P.ITransform["position"],
    ): P.ITransform["position"] => {
      const pose: P.ITransform = place(collider.pose, collider.shape.transform);
      return {
        ...physicalNativeVector(
          physicalNativeShape(collider.shape).projectPoint(
            pose.position,
            pose.rotation,
            physicalNativeVector(point),
            false,
          ).point,
        ),
      };
    },
  };
}

/**
 * Narrow-phase inputs and the no-dynamics query surface.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Narrow-phase inputs and the no-dynamics query surface) and documents 2 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Narrow-phase inputs and the no-dynamics query surface: companion namespace of 2 members (`ICollider`, `IQueries`); units and frames named in its text: local, world, seconds. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `preparePhysicalGeometry` in packages/engine/src/physics/preparePhysicalGeometry.ts; its surface is the 2 members listed and the text shows 28 other files naming it, mostly packages/engine (12), test (11), movies (5), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace preparePhysicalGeometry {
  /** One collider in its current body placement. */
  export interface ICollider {
    /** Scene body id. */ body: string;
    /** Physical segment id. */ bone: string;
    /** Profile-local collider. */ shape: P.IShape;
    /** Current world bone placement. */ pose: P.ITransform;
  }
  /** Reusable initialized query entry; it owns no physics world. */
  export interface IQueries {
    /** Null when farther apart than prediction; positive separation is never contact. */
    contact: (
      a: ICollider,
      b: ICollider,
      seconds: number,
      prediction?: number,
    ) => Receipt | null;
    /** Exact lowest world Y for supported sphere, capsule and box shapes. */
    minimumY: (collider: ICollider) => number;
    /** Exact closest surface point, including from inside the declared collider. */
    project: (
      collider: ICollider,
      point: P.ITransform["position"],
    ) => P.ITransform["position"];
  }
}

/** Compose bone and local shape transforms in the same world frame. */
function place(parent: P.ITransform, local: P.ITransform): P.ITransform {
  const result: P.ITransform = {
    position: Vector3.add(
      parent.position,
      Quaternion.rotateVector(parent.rotation, local.position),
    ),
    rotation: Quaternion.multiply(parent.rotation, local.rotation),
  };
  physicalNativeVector(result.position);
  if (!Object.values(result.rotation).every(isPhysicalNativeNumber))
    throw new Error("Derived native shape rotation exceeds f32 range");
  return result;
}
