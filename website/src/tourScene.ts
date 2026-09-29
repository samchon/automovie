/**
 * Native scene adapters for the three static transports. Each uploader receives
 * the production's original payload; lighting also follows its native viewer.
 * The website resolves texture URLs beneath its own relative mount path and
 * waits for every required image before it declares the tour ready.
 * This host does not own geometry, material authoring or household states.
 */
import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";

import { type ModernPayload, modernScene } from "./modernScene";
import type { TourData } from "./tourData";

interface TempleMaterial {
  id: string;
  baseColorTexture:
    | null
    | string
    | {
        asset: string;
        transform?: {
          offset: { x: number; y: number };
          scale: { x: number; y: number };
          rotationDeg: number;
        };
      };
}

/** Absolute native paths become relative to the building, not the domain root. */
export const textureUrl = (asset: string, base: string): string => {
  const relative = asset.replace(/^\/+/, "");
  if (!relative.startsWith("textures/") || relative.split("/").includes(".."))
    throw new Error(`Invalid production texture: ${asset}`);
  return new URL(relative, base).href;
};

export const loadTourScene = async (
  data: TourData,
  renderer: {
    shadowMap: { type: THREE.ShadowMapType };
    toneMappingExposure: number;
    capabilities: { getMaxAnisotropy(): number };
  },
  base: string,
  dependencies: {
    load(url: string): Promise<THREE.Texture>;
    createTempleDaylight(): {
      sky: THREE.DataTexture;
      hemisphere: THREE.HemisphereLight;
      sun: THREE.DirectionalLight;
    };
    uploadTemple(
      payload: unknown,
      textures: Map<string, THREE.Texture>,
    ): { root: THREE.Group };
    daylight(): {
      sky: THREE.DataTexture;
      environment: THREE.WebGLRenderTarget;
      dispose(): void;
    };
    uploadHouse(payload: unknown): THREE.Group;
  },
): Promise<{ scene: THREE.Scene; dispose(): void }> => {
  const { load, createTempleDaylight, uploadTemple, daylight, uploadHouse } =
    dependencies;
  const textures = new Map<string, THREE.Texture>();
  const additional: (() => void)[] = [];
  let scene = new THREE.Scene();
  const dispose = (): void => {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object instanceof Reflector) object.getRenderTarget().dispose();
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material])
          materials.add(material);
        if (object.customDepthMaterial)
          materials.add(object.customDepthMaterial);
      }
      if (object instanceof THREE.Light) object.dispose();
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) {
      const map = (material as THREE.MeshStandardMaterial).map;
      if (map) textures.set(map.uuid, map);
      material.dispose();
    }
    for (const texture of new Set(textures.values())) texture.dispose();
    for (const release of additional) release();
  };
  try {
    if (data.building === "ancient") {
      const native = data.native as {
        models: { materials: TempleMaterial[] }[];
      };
      const materials = new Map(
        native.models.flatMap((model) =>
          model.materials.map((material) => [material.id, material] as const),
        ),
      );
      for (const material of materials.values()) {
        const binding = material.baseColorTexture;
        if (binding === null) continue;
        const texture = await load(
          textureUrl(
            typeof binding === "string" ? binding : binding.asset,
            base,
          ),
        );
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        if (typeof binding !== "string" && binding.transform) {
          texture.offset.set(
            binding.transform.offset.x,
            binding.transform.offset.y,
          );
          texture.repeat.set(
            binding.transform.scale.x,
            binding.transform.scale.y,
          );
          texture.rotation = THREE.MathUtils.degToRad(
            binding.transform.rotationDeg,
          );
        }
        textures.set(material.id, texture);
      }
      scene = new THREE.Scene();
      const lighting = createTempleDaylight();
      additional.push(() => lighting.sky.dispose());
      scene.background = lighting.sky;
      scene.environment = lighting.sky;
      scene.environmentIntensity = 0.25;
      scene.add(
        lighting.hemisphere,
        lighting.sun,
        lighting.sun.target,
        uploadTemple(data.native, textures).root,
      );
      renderer.shadowMap.type = THREE.PCFShadowMap;
    } else if (data.building === "future") {
      scene = new THREE.Scene();
      const lighting = daylight();
      additional.push(lighting.dispose);
      scene.background = lighting.sky;
      scene.environment = lighting.environment.texture;
      scene.environmentIntensity = 0.8;
      const sky = new THREE.HemisphereLight(0xe8f1ff, 0x887b65, 1.25);
      const sun = new THREE.DirectionalLight(0xffefdb, 3);
      sun.position.set(-12, 18, -8);
      sun.castShadow = true;
      sun.shadow.mapSize.set(4096, 4096);
      Object.assign(sun.shadow.camera, {
        left: -18,
        right: 18,
        top: 18,
        bottom: -18,
        far: 70,
      });
      sun.shadow.normalBias = 0.003;
      sun.shadow.bias = -0.00005;
      scene.add(sky, sun, sun.target, uploadHouse(data.native));
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    } else {
      const native = data.native as ModernPayload;
      for (const url of new Set(
        native.items.flatMap((item) =>
          item.texture === undefined ? [] : [item.texture],
        ),
      )) {
        const texture = await load(textureUrl(url, base));
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = Math.min(
          8,
          renderer.capabilities.getMaxAnisotropy(),
        );
        textures.set(url, texture);
      }
      scene = modernScene(native, textures);
      renderer.toneMappingExposure =
        native.physicalLighting!.environment.exposure;
      renderer.shadowMap.type = THREE.PCFShadowMap;
    }
    return { scene, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
};
