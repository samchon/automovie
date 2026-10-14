/**
 * Opaque browser boundaries onto the native production scene uploaders. Vite aliases resolve these names to their original modules; no native geometry is copied here. The build exporter alone constructs the accepted payloads. These hand-authored ambient declarations are not generated dependency files; the TypeScript Evidence adapter cannot publish ambient module addresses, so their contracts are reviewed directly.
 */
declare module "production-temple-scene" {
  import type * as THREE from "three";
  /** Construct the actual temple root using caller-decoded material-id textures. */
  export function uploadTemple(
    payload: unknown,
    textures: Map<string, THREE.Texture>,
  ): { root: THREE.Group };
  /** Native temple tree cleanup; the website's scene owner performs its own resource discovery. */
  export function disposeTree(root: THREE.Object3D): void;
}
declare module "production-temple-daylight" {
  import type * as THREE from "three";
  /** Construct the temple's native sky texture and hemisphere/directional rig. */
  export function createTempleDaylight(): {
    /** Owned radiance texture used as both background and environment. */
    sky: THREE.DataTexture;

    /** Native ambient hemisphere light. */
    hemisphere: THREE.HemisphereLight;

    /** Native directional key and shadow owner. */
    sun: THREE.DirectionalLight;
  };
}
declare module "production-future-scene" {
  import type * as THREE from "three";
  /** Construct the native future-house group from the unchanged producer payload. */
  export function uploadHouse(payload: unknown): THREE.Group;
  /** Native future-house cleanup; the website retains its own scene teardown boundary. */
  export function disposeHouse(root: THREE.Object3D): void;
}
declare module "production-future-daylight" {
  import type * as THREE from "three";
  /** Acquire the future-house sky and renderer-specific environment with their native disposer. */
  export function daylight(renderer: THREE.WebGLRenderer): {
    /** Owned sky radiance texture used as background. */
    sky: THREE.DataTexture;

    /** Renderer-specific filtered environment target. */
    environment: THREE.WebGLRenderTarget;

    /** Release the native sky and environment resources. */
    dispose(): void;
  };
}
