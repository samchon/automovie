import type * as THREE from "three";

/**
 * A viewer-owned planting cluster with one branch batch and an optional leaf batch.
 *
 * @evidence contracts/development/design.md#principled-representation Exposes the actual viewer-owned group and branch/optional leaf batches, preserving derived member-by-part counts without duplicating plant derivation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One handle joins scene attachment, observable batch counts and explicit owned-resource disposal; numerical records remain with the engine.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Bare foliage is explicit null and count fields describe instances rather than guaranteed visible anatomical or botanical geometry.
 * @evidence contracts/development/common.md#meaningful-documentation Members distinguish branch/leaf counts, bare state and owned geometry/default-material release versus borrowed supplied materials.
 */
export interface IAutoMoviePlantingObject {
  /** Add this group to the current scene. */
  object: THREE.Group;

  /** Every branch of every member in one instanced batch; actual submissions depend on the renderer. */
  branches: THREE.InstancedMesh;

  /** Every leaf of every member in one instanced batch, or `null` when bare. */
  leaves: THREE.InstancedMesh | null;

  /** Allocated branch slots: member count times branch count, including degenerate slots. */
  branchCount: number;

  /** Allocated leaf slots: member count times leaf count, without a visible-pixel guarantee. */
  leafCount: number;

  /**
   * Release geometries, and the materials this object created.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Retires the builder's created geometries, default materials and native instance allocations while preserving caller-supplied material ownership.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The handle exposes one terminal release operation; the builder records acquisition and independent attempts behind it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts One listener failure cannot skip neighboring owners and a repeated failed call preserves its cause instead of retrying a partially released allocation.
   * @evidence contracts/development/common.md#meaningful-documentation The member identifies owned versus borrowed materials, independent retirement and required caller withdrawal from drawing.
   * @evidence contracts/development/implementation.md#efficient-algorithms A fixed maximum of two geometries, two defaults and two instance owners are attempted, with actual native disposal cost delegated to Three.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Repeated calls share exactly this handle's one attempt/outcome; distinct clusters retain distinct owned resources.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller must remove/stop use of the borrowed group first; public disposal attempts are not proof of native kernel storage release and failure stays attached to the handle.
   */
  dispose: () => void;
}
