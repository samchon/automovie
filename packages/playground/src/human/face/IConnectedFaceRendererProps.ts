import type * as THREE from "three";

/** What the connected face renderer needs from its host. */
export interface IConnectedFaceRendererProps {
  /** Loads one texture asset. */
  loadTexture: (asset: string) => Promise<THREE.Texture>;

  /** Device anisotropy limit for resident textures. */
  maxAnisotropy: number;
}
