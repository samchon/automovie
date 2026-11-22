import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieContactReceipt } from "./IAutoMovieContactReceipt";
import type { IAutoMoviePhysicalShape } from "./IAutoMoviePhysicalShape";

/**
 * One collider in its current body placement. Reusable initialized query entry; it owns no physics world.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Associates one profile shape with its owning scene body, segment and current bone placement. Distinguishes geometric contact receipts, lowest world height and native surface projection.
 * @evidence contracts/development/design.md#principled-representation Canonical shape-local geometry is composed with a world-metre/unit-quaternion bone transform. Queries accept canonical placed colliders and world-metre points; contact uses a finite second label and nonnegative metre prediction.
 * @evidence contracts/development/design.md#minimal-and-owned-surface preparePhysicalGeometry uses the same collider descriptor for contact, projection and minimum-height queries. preparePhysicalGeometry supplies these reusable closures over the engine's convex geometry without building a dynamics world.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shape/profile admission and coherent identities are caller responsibilities; the record owns no native collider or world handle. Receipts keep null impulse and positive separation remains separation; queries run in float64 and may throw admission failures.
 */
export namespace IAutoMoviePreparePhysicalGeometry {
  /**
   * One collider in its current body placement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Associates one profile shape with its owning scene body, segment and current bone placement.
   * @evidence contracts/development/design.md#principled-representation Canonical shape-local geometry is composed with a world-metre/unit-quaternion bone transform.
   * @evidence contracts/development/design.md#minimal-and-owned-surface preparePhysicalGeometry uses the same collider descriptor for contact, projection and minimum-height queries.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shape/profile admission and coherent identities are caller responsibilities; the record owns no native collider or world handle.
   */
  export interface ICollider {
    /** Scene body id. */ body: string;
    /** Physical segment id. */ bone: string;
    /** Profile-local collider. */ shape: IAutoMoviePhysicalShape;
    /** Current world bone placement. */ pose: IAutoMovieRigidTransform;
  }

  /**
   * Reusable initialized query entry; it owns no physics world.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes geometric contact receipts, lowest world height and native surface projection.
   * @evidence contracts/development/design.md#principled-representation Queries accept canonical placed colliders and world-metre points; contact uses a finite second label and nonnegative metre prediction.
   * @evidence contracts/development/design.md#minimal-and-owned-surface preparePhysicalGeometry supplies these reusable closures over the engine's convex geometry without building a dynamics world.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Receipts keep null impulse and positive separation remains separation; queries run in float64 and may throw admission failures.
   */
  export interface IQueries {
    /**
     * Null when farther apart than prediction; positive separation is never contact.
     *
     * Synchronously query admitted placed colliders. seconds is a finite local-second receipt label; prediction is finite nonnegative metres and defaults to zero. Return null beyond prediction, otherwise a new geometric receipt with null impulse. Positive separation is still separation.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Synchronously query admitted placed colliders. seconds is a finite local-second receipt label; prediction is finite nonnegative metres and defaults to zero. Return null beyond prediction, otherwise a new geometric receipt with null impulse. Positive separation is still separation.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable signature without a body; preparePhysicalGeometry owns the numerical method and its runtime premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The signature only defines the call boundary; preparePhysicalGeometry owns its implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or compensation occurs in this declaration; review special cases in preparePhysicalGeometry.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; preparePhysicalGeometry owns cost for the supported workload.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache or coordinator; preparePhysicalGeometry owns reuse and invalidation of any retained work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires no resources; preparePhysicalGeometry and the documented reader/caller lifetime own retained data and release.
     */
    contact: (
      a: IAutoMoviePreparePhysicalGeometry.ICollider,
      b: IAutoMoviePreparePhysicalGeometry.ICollider,
      seconds: number,
      prediction?: number,
    ) => IAutoMovieContactReceipt | null;
    /**
     * Lowest world Y in metres for admitted sphere, capsule, box and convex-hull shapes.
     *
     * Read the lowest world Y in metres across the admitted sphere, capsule, box or convex-hull shape. The query borrows its collider and delegates bounds calculation without retaining it or advancing dynamics.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Read the lowest world Y in metres across the admitted sphere, capsule, box or convex-hull shape. The query borrows its collider and delegates bounds calculation without retaining it or advancing dynamics.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable signature without a body; the preparePhysicalGeometry/physicalShapeBounds implementation owns the numerical method and its runtime premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The signature only defines the call boundary; the preparePhysicalGeometry/physicalShapeBounds implementation owns its implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or compensation occurs in this declaration; review special cases in preparePhysicalGeometry and physicalShapeBounds.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the preparePhysicalGeometry/physicalShapeBounds implementation owns cost for the supported workload.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache or coordinator; the preparePhysicalGeometry/physicalShapeBounds implementation owns reuse and invalidation of any retained work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires no resources; preparePhysicalGeometry and physicalShapeBounds and the documented reader/caller lifetime own retained data and release.
     */
    minimumY: (collider: IAutoMoviePreparePhysicalGeometry.ICollider) => number;
    /**
     * Native-precision closest surface point, including from inside the declared collider.
     *
     * Return a fresh nearest surface point in world metres, including for an interior query. Collider and point are borrowed synchronously; query admission failures propagate. This projects onto the surface, not into the solid.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Return a fresh nearest surface point in world metres, including for an interior query. Collider and point are borrowed synchronously; query admission failures propagate. This projects onto the surface, not into the solid.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable signature without a body; preparePhysicalGeometry owns the numerical method and its runtime premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The signature only defines the call boundary; preparePhysicalGeometry owns its implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or compensation occurs in this declaration; review special cases in preparePhysicalGeometry.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; preparePhysicalGeometry owns cost for the supported workload.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache or coordinator; preparePhysicalGeometry owns reuse and invalidation of any retained work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires no resources; preparePhysicalGeometry and the documented reader/caller lifetime own retained data and release.
     */
    project: (
      collider: IAutoMoviePreparePhysicalGeometry.ICollider,
      point: IAutoMovieRigidTransform["position"],
    ) => IAutoMovieRigidTransform["position"];
  }
}
