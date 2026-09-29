/**
 * Opaque browser boundaries onto the native production scene uploaders. Vite
 * aliases resolve these names to their original modules; no native geometry is
 * copied here. The build exporter alone constructs the accepted payloads.
 */
declare module "production-temple-scene" {
  import type * as THREE from "three";
  export function uploadTemple(
    payload: unknown,
    textures: Map<string, THREE.Texture>,
  ): { root: THREE.Group };
  export function disposeTree(root: THREE.Object3D): void;
}
declare module "production-temple-daylight" {
  import type * as THREE from "three";
  export function createTempleDaylight(): {
    sky: THREE.DataTexture;
    hemisphere: THREE.HemisphereLight;
    sun: THREE.DirectionalLight;
  };
}
declare module "production-future-scene" {
  import type * as THREE from "three";
  export function uploadHouse(payload: unknown): THREE.Group;
  export function disposeHouse(root: THREE.Object3D): void;
}
declare module "production-future-daylight" {
  import type * as THREE from "three";
  export function daylight(renderer: THREE.WebGLRenderer): {
    sky: THREE.DataTexture;
    environment: THREE.WebGLRenderTarget;
    dispose(): void;
  };
}
