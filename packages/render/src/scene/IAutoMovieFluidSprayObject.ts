import type { IAutoMovieFluidSpraySample } from "@automovie/interface";
import type * as THREE from "three";

/**
 * A viewer-owned point cloud for the currently uploaded bounded spray sample; updates do not bind it to a domain identity.
 *
 * @evidence contracts/development/design.md#principled-representation The point cloud copies the engine's capped and thinned particle sample; this type adds no particle solver and exposes the number currently uploaded.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A single native node with update, count and dispose is the renderer-facing projection of a numerical sample.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The default PointsMaterial uses uniform size and opacity, not the uploaded custom aSize/aAge attributes. The type does not claim a per-particle appearance that the material does not implement.
 * @evidence contracts/development/common.md#meaningful-documentation Members state upload purpose, sampled count and conditional material ownership. The bounded population comes from engine admission, not a viewer-side cap enforced by this type.
 */
export interface IAutoMovieFluidSprayObject {
  /** Add these points to the current scene. */
  object: THREE.Points;

  /**
   * Re-upload the particles of a newly sampled step; domain is not checked here.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Particle positions, sizes and age ratios are copied from the admitted engine sample; count and visibility reflect its length, including an empty sample.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One upload refreshes all attributes and the bounding sphere; particle generation and distance thinning stay in the engine.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No particle is invented to fill a minimum count. This operation accepts a different sample domain and can leave partial state on a native write failure; it has no transactional rollback.
   * @evidence contracts/development/common.md#meaningful-documentation The member explains upload purpose and absence of the surface object's same-domain refusal, rather than implying a shared guard.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three temporary arrays, Float32 copies and native bound calculation require linear work and space in particle count.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Node, geometry identity and material are reused; every upload rebuilds attribute data because matching metadata alone does not establish equal particles.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The geometry retains only its latest attributes and sphere after replacement. Input arrays remain caller-owned, and final native resources are released by dispose.
   */
  update: (sample: IAutoMovieFluidSpraySample) => void;

  /**
   * Release the geometry, and the material when this object created it.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each invocation independently attempts native geometry then material only when the builder created it, through the shared synchronous retirement reporter.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Native resource retirement is explicit and separate from scene detachment; the supplied material's owner remains outside this object.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No consumer-specific release policy is used. A geometry disposal throw cannot skip the owned material, and original ordered causes follow the existing reporter policy without certifying physical GPU release.
   * @evidence contracts/development/common.md#meaningful-documentation The comment states conditional material release and does not imply ownership of externally supplied assets.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most two native disposal calls occur; underlying GPU retirement is delegated to three.js.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The method does not memoize disposal completion, so repeated calls repeat native effects.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller must detach the points and invoke disposal. Retained closures still reference resources afterward; updates are not refused by a closed flag.
   */
  dispose: () => void;

  /**
   * Particle count in the last upload, after the engine's cap and LOD thinning.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Return the last uploaded sample length, including zero; the value is a numerical upload count, not a measurement of visible pixels or frustum survivors.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A closure read exposes the existing count without scanning the attribute buffer.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The count is copied from the actual sample rather than a configured cap or fixture expectation.
   * @evidence contracts/development/common.md#meaningful-documentation The comment identifies the last-upload basis and engine thinning rather than equating count with observed raster output.
   * @evidence contracts/development/implementation.md#efficient-algorithms Reading one scalar requires constant work and creates no array.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The value is updated with each upload and reused by reads until another upload; no separate count computation is necessary.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The accessor owns no handle and retains no sample; its closure reads the scalar already owned by the spray object.
   */
  count: () => number;
}
