import type { IAutoMovieFluidSurface } from "@automovie/interface";
import type * as THREE from "three";

/**
 * A viewer-owned water surface bound to one fluid domain.
 *
 * @evidence contracts/development/design.md#principled-representation The object pairs an engine surface domain with its native mesh; update rejects a different domain before replacing attributes, preserving the segmentation name's authority.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One object exposes the scene node, upload operation and owned-resource disposer without adding a fluid solver or scene host.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Geometry and wet bounds come from the engine surface. Flow metadata is uploaded but the default material does not implement ripple scrolling; there is no fabricated shader effect.
 * @evidence contracts/development/common.md#meaningful-documentation Members state same-domain update refusal and geometry/material ownership. The default material borrows no caller asset; a supplied material remains borrowed.
 */
export interface IAutoMovieFluidSurfaceObject {
  /** Add this mesh to the current scene. */
  object: THREE.Mesh;

  /**
   * Re-upload a newly solved surface of the same domain. A different domain refuses before mutation because the mesh's segmentation identity belongs to its original domain.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Domain equality is checked before all attribute writes; admitted engine positions, normals, UVs, indices and flow are copied into native attributes with Float32 rounding.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One upload refreshes attributes, wet bounds, visibility and step metadata together; it does not solve depth or velocity again.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The uploaded engine bounds determine culling instead of including dry lattice vertices. A mid-upload native failure can leave partial attributes; there is no transactional rollback in this API.
   * @evidence contracts/development/common.md#meaningful-documentation The comment explains domain refusal and its segmentation consequence. Supported input is an admitted engine surface, not arbitrary inconsistent buffer lengths.
   * @evidence contracts/development/implementation.md#efficient-algorithms Work and temporary attributes scale with vertex and index counts; wet-bound sphere construction is constant work rather than a second scan of dry vertices.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The native geometry and mesh persist, but each update copies current buffers; no step-number-only cache assumes geometry equivalence.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources New attributes replace the previous upload's references on the owned geometry; the caller retains the input surface. Geometry retirement remains the owning object's dispose responsibility.
   */
  update: (surface: IAutoMovieFluidSurface) => void;

  /**
   * Release the geometry, and the material when this object created it.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each invocation independently attempts native geometry then the default-owned material through the shared synchronous retirement reporter; a caller-supplied material remains borrowed.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The object exposes resource release separately from scene detachment, which remains with the scene consumer.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Ownership follows whether material was supplied, without fixture or consumer exceptions. A geometry-disposal throw cannot skip the owned material; ordered causes follow the existing reporter's aggregate policy rather than becoming a physical-release certificate.
   * @evidence contracts/development/common.md#meaningful-documentation The member states geometry ownership and conditional material ownership rather than promising disposal of every borrowed scene asset.
   * @evidence contracts/development/implementation.md#efficient-algorithms The method invokes at most two native disposers; device-side cost is delegated to the native renderer.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Disposal has no completion cache or closed state, so repeated invocations repeat native disposer calls.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller chooses final release and must detach the mesh itself. The closure still retains geometry and material references after disposal; this API supplies no automatic failure rollback or terminal update refusal.
   */
  dispose: () => void;
}
