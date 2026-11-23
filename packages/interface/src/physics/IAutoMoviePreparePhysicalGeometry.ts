import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieContactReceipt } from "./IAutoMovieContactReceipt";
import type { IAutoMoviePhysicalShape } from "./IAutoMoviePhysicalShape";

/**
 * One collider in its current body placement. Reusable initialized query entry;
 * it owns no physics world.
 */
export namespace IAutoMoviePreparePhysicalGeometry {
  /** One collider in its current body placement. */
  export interface ICollider {
    /** Scene body id. */ body: string;
    /** Physical segment id. */ bone: string;
    /** Profile-local collider. */ shape: IAutoMoviePhysicalShape;
    /** Current world bone placement. */ pose: IAutoMovieRigidTransform;
  }

  /** Reusable initialized query entry; it owns no physics world. */
  export interface IQueries {
    /**
     * Null when farther apart than prediction; positive separation is never
     * contact.
     *
     * Synchronously query admitted placed colliders. seconds is a finite
     * local-second receipt label; prediction is finite nonnegative metres and
     * defaults to zero. Return null beyond prediction, otherwise a new
     * geometric receipt with null impulse. Positive separation is still
     * separation.
     */
    contact: (
      a: IAutoMoviePreparePhysicalGeometry.ICollider,
      b: IAutoMoviePreparePhysicalGeometry.ICollider,
      seconds: number,
      prediction?: number,
    ) => IAutoMovieContactReceipt | null;
    /**
     * Lowest world Y in metres for admitted sphere, capsule, box and
     * convex-hull shapes.
     *
     * Read the lowest world Y in metres across the admitted sphere, capsule,
     * box or convex-hull shape. The query borrows its collider and delegates
     * bounds calculation without retaining it or advancing dynamics.
     */
    minimumY: (collider: IAutoMoviePreparePhysicalGeometry.ICollider) => number;
    /**
     * Native-precision closest surface point, including from inside the
     * declared collider.
     *
     * Return a fresh nearest surface point in world metres, including for an
     * interior query. Collider and point are borrowed synchronously; query
     * admission failures propagate. This projects onto the surface, not into
     * the solid.
     */
    project: (
      collider: IAutoMoviePreparePhysicalGeometry.ICollider,
      point: IAutoMovieRigidTransform["position"],
    ) => IAutoMovieRigidTransform["position"];
  }
}
