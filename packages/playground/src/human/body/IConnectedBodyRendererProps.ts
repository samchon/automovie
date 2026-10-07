import type * as THREE from "three";

/**
 * Host texture loader and hardware filtering limit for one body viewport.
 * The renderer owns the resources it prepares; the host supplies texture
 * loading and the current device's supported anisotropy without changing body
 * geometry or numerical document values.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Supplies the host texture and device inputs used to display the committed body.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Keeps material loading and hardware filtering explicit at the resident frame preparation boundary.
 * @author Samchon
 */
export interface IConnectedBodyRendererProps {
  /** Host loader used by the viewport's owned texture cache. */
  loadTexture: (asset: string) => Promise<THREE.Texture>;

  /** Current device's maximum supported anisotropic texture filtering. */
  maxAnisotropy: number;
}
