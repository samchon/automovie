import type { loadTourScene } from "@automovie/website/tour-scene";
import * as THREE from "three";

/** Supplies the existing CPU scene resources and upload callbacks to loadTourScene. Disposal events expose callback attempts and failures; constructing a render target without a WebGL renderer does not observe GPU allocation or release. The caller owns the returned objects and may dispose them through the loaded scene. */
export function tourSceneFixture(): {
  urls: string[];
  textures: THREE.Texture[];
  root: THREE.Group;
  mesh: THREE.Mesh<THREE.BoxGeometry, (THREE.MeshStandardMaterial | THREE.MeshBasicMaterial)[]>;
  sky: THREE.DataTexture;
  renderer: Parameters<typeof loadTourScene>[1];
  dependencies: Parameters<typeof loadTourScene>[3];
  extraDisposed: () => number;
} {
  const urls: string[] = [];
  const textures: THREE.Texture[] = [];
  const root: THREE.Group = new THREE.Group();
  const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ map: new THREE.Texture() });
  const mesh: THREE.Mesh<THREE.BoxGeometry, (THREE.MeshStandardMaterial | THREE.MeshBasicMaterial)[]> = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), [
    material,
    new THREE.MeshBasicMaterial(),
  ]);
  mesh.customDepthMaterial = new THREE.MeshDepthMaterial();
  root.add(mesh, new THREE.PointLight());
  const sky: THREE.DataTexture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  const environment: THREE.WebGLRenderTarget = new THREE.WebGLRenderTarget(1, 1);
  let extraDisposed: number = 0;
  const dependencies: Parameters<typeof loadTourScene>[3] = {
    load: async (url: string): Promise<THREE.Texture> => {
      urls.push(url);
      const texture: THREE.Texture = new THREE.Texture();
      textures.push(texture);
      return texture;
    },
    createTempleDaylight: (): ReturnType<Parameters<typeof loadTourScene>[3]["createTempleDaylight"]> => ({
      sky,
      hemisphere: new THREE.HemisphereLight(),
      sun: new THREE.DirectionalLight(),
    }),
    uploadTemple: (): ReturnType<Parameters<typeof loadTourScene>[3]["uploadTemple"]> => ({ root }),
    uploadHouse: (): THREE.Group => root,
    daylight: (): ReturnType<Parameters<typeof loadTourScene>[3]["daylight"]> => ({
      sky,
      environment,
      dispose: (): void => {
        extraDisposed++;
        sky.dispose();
        environment.dispose();
      },
    }),
  };
  const renderer: Parameters<typeof loadTourScene>[1] = {
    shadowMap: { type: THREE.BasicShadowMap as THREE.ShadowMapType },
    toneMappingExposure: 1,
    capabilities: { getMaxAnisotropy: (): number => 4 },
  };
  return {
    urls,
    textures,
    root,
    mesh,
    sky,
    renderer,
    dependencies,
    extraDisposed: (): number => extraDisposed,
  };
}
