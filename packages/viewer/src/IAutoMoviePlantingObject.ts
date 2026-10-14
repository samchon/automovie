import type * as THREE from "three";

/**
 * A viewer-owned planting cluster drawn as two instanced batches.
 *
 * @evidence contracts/common.md#principled-implementation Exposes the actual viewer-owned group and branch/optional leaf batches, preserving derived member-by-part counts without duplicating plant derivation.
 * @evidence contracts/common.md#clear-and-simple-design One handle joins scene attachment, observable batch counts and explicit owned-resource disposal; numerical records remain with the engine.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Bare foliage is explicit null and count fields describe instances rather than guaranteed visible anatomical or botanical geometry.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish branch/leaf counts, bare state and owned geometry/default-material release versus borrowed supplied materials.
 * @evidence contracts/performance.md#efficient-algorithms The handle shape performs no instancing algorithm; its builder scales matrix work with placement times branch/leaf populations.
 * @evidence contracts/performance.md#reuse-equivalent-work Batches share one geometry/prototype per role and the dispose callback represents one handle's restoration outcome rather than a cross-cluster cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns scene placement/removal, while the handle owns generated geometry/default materials/instance allocations and must stop rendering them before disposal.
 *
 * @author Samchon
 */
export interface IAutoMoviePlantingObject {
  /** Add this group to the current scene. */
  object: THREE.Group;

  /** Every branch of every member, as one instanced draw. */
  branches: THREE.InstancedMesh;

  /** Every leaf of every member, as one instanced draw, or `null` when bare. */
  leaves: THREE.InstancedMesh | null;

  /** Branch instances drawn: member count times branch count. */
  branchCount: number;

  /** Leaf instances drawn: member count times leaf count. */
  leafCount: number;

  /**
   * Release geometries, and the materials this object created.
   *
   * @evidence contracts/common.md#principled-implementation Retires the builder's created geometries, default materials and native instance allocations while preserving caller-supplied material ownership.
   * @evidence contracts/common.md#clear-and-simple-design The handle exposes one terminal release operation; the builder records acquisition and independent attempts behind it.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts One listener failure cannot skip neighboring owners and a repeated failed call preserves its cause instead of retrying a partially released allocation.
   * @evidence contracts/common.md#meaningful-documentation The member identifies owned versus borrowed materials, independent retirement and required caller withdrawal from drawing.
   * @evidence contracts/performance.md#efficient-algorithms A fixed maximum of two geometries, two defaults and two instance owners are attempted, with actual native disposal cost delegated to Three.
   * @evidence contracts/performance.md#reuse-equivalent-work Repeated calls share exactly this handle's one attempt/outcome; distinct clusters retain distinct owned resources.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller must remove/stop use of the borrowed group first; public disposal attempts are not proof of native kernel storage release and failure stays attached to the handle.
   */
  dispose: () => void;
}
