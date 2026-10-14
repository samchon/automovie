import type * as THREE from "three";

/**
 * Host texture loader and hardware filtering limit for one body viewport.
 * The renderer owns the resources it prepares; the host supplies texture
 * loading and the current device's supported anisotropy without changing body
 * geometry or numerical document values.
 *
 * @evidence contracts/common.md#principled-implementation Numerical model preparation uses a host texture loader and the admitted device filtering limit. This record changes no anatomical coordinates and assumes the loader resolves supported material assets.
 * @evidence contracts/common.md#clear-and-simple-design Only texture acquisition and filtering cross this seam; frame geometry and cache disposal remain in createConnectedBodyRenderer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The hardware limit is supplied explicitly rather than inferred from a fixture or patched global renderer. There is no geometry fallback in these props.
 * @evidence contracts/common.md#meaningful-documentation The comment states the GPU preparation owner, host loader role and device-derived anisotropy; it does not promise that the type checks the numeric limit at runtime.
 * @evidence contracts/performance.md#efficient-algorithms Reading two fields is constant work; material traversal, asset loading and cache population belong to the renderer that consumes them.
 * @evidence contracts/performance.md#reuse-equivalent-work One renderer's texture cache reuses asset loads within the loader and filtering scope supplied here. Different renderer instances are not declared equivalent by matching props.
 * @evidence contracts/performance.md#bound-retention-and-release-resources These props retain a loader reference and scalar limit. The renderer owns cached acquired textures and closes them with its retirement scope; the host owns the loader service itself.
 *
 * @author Samchon
 */
export interface IConnectedBodyRendererProps {
  /**
   * Acquire a texture for the viewport's owned cache; the cache may dispose the result.
   *
   * @evidence contracts/common.md#principled-implementation Asset identity is the texture cache key, so the loader must give that asset its supported texture interpretation and transfer disposal authority for the resolved texture.
   * @evidence contracts/common.md#clear-and-simple-design The asynchronous callback isolates host asset access while the cache coordinates loading, failure and release.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Actual browser consumers use TextureLoader; the callback contract supplies no fixture path substitutions or method replacement.
   * @evidence contracts/common.md#meaningful-documentation The comment makes the returned texture's ownership explicit, avoiding a borrowed-texture interpretation that would permit disposal of somebody else's asset.
   * @evidence contracts/performance.md#efficient-algorithms Loader cost depends on asset bytes and decoding. The owning cache shares one in-flight load per asset rather than invoking the loader for each material occurrence.
   * @evidence contracts/performance.md#reuse-equivalent-work Cache reuse requires the same asset key within one renderer's loader scope. This function does not prove that different loaders or changed asset contents are equivalent.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The cache owns resolved textures, including late completions after closure, and retires them. The native loader does not expose cancellation through this signature, so pending loads can outlive cache closure until settlement.
   */
  loadTexture: (asset: string) => Promise<THREE.Texture>;

  /** Current device's maximum supported anisotropic texture filtering. */
  maxAnisotropy: number;
}
