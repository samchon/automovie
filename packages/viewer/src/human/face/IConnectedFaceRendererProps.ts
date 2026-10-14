import type * as THREE from "three";

/**
 * Texture acquisition and current device filtering limit for a face renderer.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation The renderer uses its host's loader and supported anisotropy while projecting admitted numerical meshes. Texture interpretation and ownership transfer must match the renderer's one asset scope; this type does not alter anatomy.
 * @evidence contracts/common.md#clear-and-simple-design Only asset access and device filtering cross this record; model validation, cache reuse and native resource retirement belong to createConnectedFaceRenderer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Filtering is a supplied device capability, not a global ColorManagement patch or a fixture-specific material substitute.
 * @evidence contracts/common.md#meaningful-documentation Fields state asset acquisition and hardware filtering role, with cache ownership documented on the loader callback.
 * @evidence contracts/performance.md#efficient-algorithms The record adds no processing; asset decoding, material traversal and mesh uploads remain the consuming renderer's dominant costs.
 * @evidence contracts/performance.md#reuse-equivalent-work One renderer's asset cache shares loads in this loader/device scope; equal props do not establish safe cross-renderer native texture sharing.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Props retain a loader reference and scalar. Resolved cache textures are renderer-owned and its retirement scope closes them; the host owns the loader service.
 */
export interface IConnectedFaceRendererProps {
  /**
   * Load an asset texture whose disposal transfers to this renderer's cache.
   *
   * @evidence contracts/common.md#principled-implementation Asset identity selects the cached texture in one loader scope. The resolved native texture must be owned rather than a shared borrowed asset that the cache cannot safely dispose.
   * @evidence contracts/common.md#clear-and-simple-design Asynchronous host loading stays outside numerical mesh validation while the cache owns correlation and retirement of actual texture acquisitions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The host supplies ordinary asset loading with no fixture path exception or foreign loader method replacement.
   * @evidence contracts/common.md#meaningful-documentation The comment states acquired texture disposal transfer rather than an unspecified load-only relationship.
   * @evidence contracts/performance.md#efficient-algorithms Host cost scales with asset bytes/decoding; the cache invokes one in-flight load for repeated occurrences of the same asset.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuse depends on asset key inside the same host loader scope; changed content or another device is not declared equivalent by this field.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Resolved and late-resolving textures are retired by the cache owner. The callback exposes no cancellation or byte cap, so a pending native load can remain until settlement after closure.
   */
  loadTexture: (asset: string) => Promise<THREE.Texture>;

  /** Device anisotropy limit for resident textures. */
  maxAnisotropy: number;
}
