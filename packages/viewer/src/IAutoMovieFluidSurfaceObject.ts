import type { IAutoMovieFluidSurface } from "@automovie/interface";
import type * as THREE from "three";

/**
 * A viewer-owned water surface bound to one fluid domain.
 *
 * @evidence contracts/common.md#principled-implementation The object pairs an engine surface domain with its native mesh; update rejects a different domain before replacing attributes, preserving the segmentation name's authority.
 * @evidence contracts/common.md#clear-and-simple-design One object exposes the scene node, upload operation and owned-resource disposer without adding a fluid solver or scene host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Geometry and wet bounds come from the engine surface. Flow metadata is uploaded but the default material does not implement ripple scrolling; there is no fabricated shader effect.
 * @evidence contracts/common.md#meaningful-documentation Members state same-domain update refusal and geometry/material ownership. The default material borrows no caller asset; a supplied material remains borrowed.
 * @evidence contracts/performance.md#efficient-algorithms Updates allocate Float32 attributes proportional to vertices and flow entries and replace indices. This record introduces no traversal beyond its builder's upload.
 * @evidence contracts/performance.md#reuse-equivalent-work Mesh, geometry identity and material persist across updates, while numerical buffers are copied anew. Equal step metadata does not suppress a changed surface upload.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller detaches the node and invokes dispose. Geometry and the default material are attempted independently in that order; supplied material stays borrowed. Repeated invocations still repeat public disposal calls, without a closed-state or physical-release guarantee.
 *
 * @author Samchon
 */
export interface IAutoMovieFluidSurfaceObject {
  /** Add this mesh to the current scene. */
  object: THREE.Mesh;

  /**
   * Re-upload a newly solved surface of the same domain. A different domain refuses before mutation because the mesh's segmentation identity belongs to its original domain.
   *
   * @evidence contracts/common.md#principled-implementation Domain equality is checked before all attribute writes; admitted engine positions, normals, UVs, indices and flow are copied into native attributes with Float32 rounding.
   * @evidence contracts/common.md#clear-and-simple-design One upload refreshes attributes, wet bounds, visibility and step metadata together; it does not solve depth or velocity again.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The uploaded engine bounds determine culling instead of including dry lattice vertices. A mid-upload native failure can leave partial attributes; there is no transactional rollback in this API.
   * @evidence contracts/common.md#meaningful-documentation The comment explains domain refusal and its segmentation consequence. Supported input is an admitted engine surface, not arbitrary inconsistent buffer lengths.
   * @evidence contracts/performance.md#efficient-algorithms Work and temporary attributes scale with vertex and index counts; wet-bound sphere construction is constant work rather than a second scan of dry vertices.
   * @evidence contracts/performance.md#reuse-equivalent-work The native geometry and mesh persist, but each update copies current buffers; no step-number-only cache assumes geometry equivalence.
   * @evidence contracts/performance.md#bound-retention-and-release-resources New attributes replace the previous upload's references on the owned geometry; the caller retains the input surface. Geometry retirement remains the owning object's dispose responsibility.
   */
  update: (surface: IAutoMovieFluidSurface) => void;

  /**
   * Release the geometry, and the material when this object created it.
   *
   * @evidence contracts/common.md#principled-implementation Each invocation independently attempts native geometry then the default-owned material through the shared synchronous retirement reporter; a caller-supplied material remains borrowed.
   * @evidence contracts/common.md#clear-and-simple-design The object exposes resource release separately from scene detachment, which remains with the scene consumer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Ownership follows whether material was supplied, without fixture or consumer exceptions. A geometry-disposal throw cannot skip the owned material; ordered causes follow the existing reporter's aggregate policy rather than becoming a physical-release certificate.
   * @evidence contracts/common.md#meaningful-documentation The member states geometry ownership and conditional material ownership rather than promising disposal of every borrowed scene asset.
   * @evidence contracts/performance.md#efficient-algorithms The method invokes at most two native disposers; device-side cost is delegated to the native renderer.
   * @evidence contracts/performance.md#reuse-equivalent-work Disposal has no completion cache or closed state, so repeated invocations repeat native disposer calls.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller chooses final release and must detach the mesh itself. The closure still retains geometry and material references after disposal; this API supplies no automatic failure rollback or terminal update refusal.
   */
  dispose: () => void;
}
