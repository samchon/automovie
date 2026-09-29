/**
 * CPU-only scene upload boundaries for the website adapter. Native producers
 * remain opaque; synthetic groups exercise renderer state and GPU-resource
 * ownership without requesting WebGL, images, files or network resources.
 */
import type { loadTourScene } from "@automovie/website/tour-scene";
import * as THREE from "three";

export const tourSceneFixture = () => {
  const urls: string[] = [];
  const textures: THREE.Texture[] = [];
  const root = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ map: new THREE.Texture() });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), [
    material,
    new THREE.MeshBasicMaterial(),
  ]);
  mesh.customDepthMaterial = new THREE.MeshDepthMaterial();
  root.add(mesh, new THREE.PointLight());
  const sky = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  const environment = new THREE.WebGLRenderTarget(1, 1);
  let extraDisposed = 0;
  const dependencies: Parameters<typeof loadTourScene>[3] = {
    load: async (url) => {
      urls.push(url);
      const texture = new THREE.Texture();
      textures.push(texture);
      return texture;
    },
    createTempleDaylight: () => ({
      sky,
      hemisphere: new THREE.HemisphereLight(),
      sun: new THREE.DirectionalLight(),
    }),
    uploadTemple: () => ({ root }),
    uploadHouse: () => root,
    daylight: () => ({
      sky,
      environment,
      dispose: () => {
        extraDisposed++;
        sky.dispose();
        environment.dispose();
      },
    }),
  };
  const renderer = {
    shadowMap: { type: THREE.BasicShadowMap as THREE.ShadowMapType },
    toneMappingExposure: 1,
    capabilities: { getMaxAnisotropy: () => 4 },
  };
  return {
    urls,
    textures,
    root,
    mesh,
    sky,
    renderer,
    dependencies,
    extraDisposed: () => extraDisposed,
  };
};
