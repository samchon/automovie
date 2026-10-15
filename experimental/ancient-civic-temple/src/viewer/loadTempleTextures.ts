import * as THREE from "three";
import type { ViewerPayload } from "./ViewerPayload";

/** Load each authored base-color image once. Missing files retain the material's flat-color fallback. @param {Payload} payload */

export async function loadTempleTextures(payload: ViewerPayload) {
  /** @type {Map<string, THREE.Texture>} */
  const textures = new Map<string, THREE.Texture>();
  const loader = new THREE.TextureLoader();
  const materials = new Map(payload.models.flatMap((model) => model.materials.map((material) => [material.id, material] as const)));
  await Promise.all([...materials.values()].map(async (material) => {
    const binding = material.baseColorTexture;
    if (binding === null) return;
    const asset = typeof binding === "string" ? binding : binding.asset;
    try {
      const texture = await loader.loadAsync(`/${asset}`);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      if (typeof binding !== "string" && binding.transform) {
        texture.offset.set(binding.transform.offset.x, binding.transform.offset.y);
        texture.repeat.set(binding.transform.scale.x, binding.transform.scale.y);
        texture.rotation = binding.transform.rotationDeg * Math.PI / 180;
      }
      textures.set(material.id, texture);
    } catch (error) {
      console.warn(`texture ${asset}: flat material fallback`, error);
    }
  }));
  return textures;
}
