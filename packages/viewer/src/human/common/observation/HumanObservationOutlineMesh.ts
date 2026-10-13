import * as THREE from "three";

/**
 * An outline shell that draws through Mesh and contributes no ray intersections.
 *
 * The observation owner supplies borrowed subject geometry and its shared rim material, attaches the shell to that subject and detaches it on restoration. The shell adds no resource disposal; observation close retires the rim material while the subject retains its geometry.
 *
 * @see https://threejs.org/docs/pages/Raycaster.html#intersectObject
 *
 * @evidence contracts/common.md#principled-implementation Installed Three r186 Raycaster delegates intersection collection to object.raycast, and Mesh is a base class for specialized meshes. A native subclass override leaves this visual-only shell out of hit results while inheriting Mesh drawing and transforms.
 * @evidence contracts/common.md#clear-and-simple-design Only createHumanObservation constructs this internal class; one override owns the shell's noninteractive policy without a public API, layer change or separate renderer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Implements the documented raycast dispatch seam on its own subclass rather than replacing an acquired Mesh method or foreign prototype. Geometry, rim shader, visibility and render settings retain their existing values.
 * @evidence contracts/common.md#meaningful-documentation States the shell's visual-only purpose, delegated raycast contract and borrowed geometry/material lifetime. No displayed-pixel equivalence has been observed.
 * @evidence contracts/performance.md#efficient-algorithms Adds no mesh traversal or intersection work; inherited Mesh construction initializes ordinary mesh state from the supplied geometry/material, and renderer drawing retains its native cost.
 * @evidence contracts/performance.md#reuse-equivalent-work The observation owner reuses one shell per current subject Mesh and the shared rim material, then removes that association when the subject leaves or the outline pass restores.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Shell count follows the uncapped outlined subject population held by the observation hull map and scene children. Restoration detaches shells and clears map entries; observation close owns rim retirement and never disposes subject geometry.
 */
export class HumanObservationOutlineMesh extends THREE.Mesh<
  THREE.BufferGeometry,
  THREE.ShaderMaterial
> {
  /**
   * Leave the caller's intersection array unchanged for this visual shell. Returning void keeps Three r186's normal recursive child traversal policy.
   *
   * @evidence contracts/common.md#principled-implementation Matches Object3D.raycast's Raycaster and Intersection-array parameters with a void return, appending no hits for the visual-only shell. The installed dispatcher continues recursive traversal unless a method returns false, which this override does not do.
   * @evidence contracts/common.md#clear-and-simple-design The subclass's single method states hit participation locally while inherited Mesh state handles geometry, material and drawing.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither mutates the supplied Raycaster/results nor patches a foreign instance or prototype; it implements the supported subclass dispatch point.
   * @evidence contracts/common.md#meaningful-documentation Documents unchanged hit results and unchanged recursive propagation, rather than claiming the shell or hypothetical descendants are globally unpickable.
   * @evidence contracts/performance.md#efficient-algorithms The empty override takes constant work and allocates no hit, vector or vertex traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No result is produced or cached; every dispatched ray retains its own caller-owned intersection array.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains neither argument and acquires no resource; shell/geometry/material lifetime remains with the observation and subject owners.
   */
  public override raycast(
    _raycaster: THREE.Raycaster,
    _intersects: THREE.Intersection[],
  ): void {}
}
