import { KHRMaterialsClearcoat, KHRMaterialsIOR, KHRMaterialsTransmission, KHRMaterialsVolume } from "@gltf-transform/extensions";

/**
 * Register this supported optical material set on every glTF reader and writer.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-export Names the clearcoat, refraction, transmission and volume extensions required to carry supported facial optics.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-export Supplies the four glTF-Transform extension classes registered by the portrait writer and its compatible readers.
 */
export const portraitGltfExtensions = [
  KHRMaterialsClearcoat,
  KHRMaterialsIOR,
  KHRMaterialsTransmission,
  KHRMaterialsVolume,
];
