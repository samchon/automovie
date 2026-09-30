import { KHRMaterialsClearcoat, KHRMaterialsIOR, KHRMaterialsTransmission, KHRMaterialsVolume } from "@gltf-transform/extensions";

/**
 * Register this supported optical material set on every glTF reader and writer.
 */
export const gltfMaterialExtensions = [
  KHRMaterialsClearcoat,
  KHRMaterialsIOR,
  KHRMaterialsTransmission,
  KHRMaterialsVolume,
];
