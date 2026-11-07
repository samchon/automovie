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

/** Narrow-phase inputs and the no-dynamics query surface. */
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
