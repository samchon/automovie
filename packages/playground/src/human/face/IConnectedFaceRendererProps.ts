import type * as THREE from "three";

/**
 * What the connected face renderer needs from its host.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Supplies what the face renderer needs from its host to draw the edited face.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Names the host texture and display services the renderer draws with.
 * @author Samchon
 */
export interface IConnectedFaceRendererProps {
  /** Loads one texture asset. */
  loadTexture: (asset: string) => Promise<THREE.Texture>;

  /** Device anisotropy limit for resident textures. */
  maxAnisotropy: number;
}
