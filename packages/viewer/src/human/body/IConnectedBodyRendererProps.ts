import type * as THREE from "three";

/**
 * Host texture loader and hardware filtering limit for one body viewport.
 * The renderer owns the resources it prepares; the host supplies texture
 * loading and the current device's supported anisotropy without changing body
 * geometry or numerical document values.
 *
 * @author Samchon
 */
export interface IConnectedBodyRendererProps {
  /** Host loader used by the viewport's owned texture cache. */
  loadTexture: (asset: string) => Promise<THREE.Texture>;

  /** Current device's maximum supported anisotropic texture filtering. */
  maxAnisotropy: number;
}
