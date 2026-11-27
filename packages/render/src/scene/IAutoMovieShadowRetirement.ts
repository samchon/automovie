import type * as THREE from "three";

/** Acquired shadow-retirement resources and their original failure. */
export interface IAutoMovieShadowRetirement {
  /** The scene whose lights were being retired, absent for a preflight. */
  scene: THREE.Scene | undefined;
  /** The targets and textures the retirement acquired. */
  resources: readonly (THREE.RenderTarget | THREE.Texture)[];
  /** The native cube depth handles it acquired. */
  nativeDepth: readonly WebGLTexture[];
  /** The refusal a later pass receives. */
  error: unknown;
}