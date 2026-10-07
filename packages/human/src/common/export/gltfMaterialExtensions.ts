import {
  KHRMaterialsClearcoat,
  KHRMaterialsIOR,
  KHRMaterialsTransmission,
  KHRMaterialsVolume,
  KHRTextureTransform,
} from "@gltf-transform/extensions";

/**
 * Register this supported optical material and texture-transform set on every
 * glTF reader and writer.
 */
export const gltfMaterialExtensions = [
  KHRMaterialsClearcoat,
  KHRMaterialsIOR,
  KHRMaterialsTransmission,
  KHRMaterialsVolume,
  KHRTextureTransform,
];
