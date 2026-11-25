import {
  AUTO_MOVIE_SUPPORTED_MATERIAL_EXTENSIONS,
  isAutoMovieMaterialExtension,
  unsupportedAutoMovieMaterialExtensions,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * An imported glTF material extension is claimed as parity only where
 * `IAutoMovieMaterial` can say the same thing.
 *
 * Scenarios:
 *
 * 1. `AUTO_MOVIE_SUPPORTED_MATERIAL_EXTENSIONS` is exactly the clearcoat, ior,
 *    transmission and texture-transform extensions.
 * 2. `unsupportedAutoMovieMaterialExtensions` of none, or of those four beside
 *    geometry, compression, lighting and container extensions, is empty.
 * 3. Every other material or texture extension is reported once, sorted, with
 *    repeats folded.
 * 4. `isAutoMovieMaterialExtension` reads the identity's own segments: material,
 *    materials, texture and textures (case-folded) are material extensions;
 *    draco, lights and a mere substring (`immaterialism`) are not.
 */
export function test_unit_engine_validation_material_extensions(): void {
  // 1.
  TestValidator.equals(
    "supported",
    [...AUTO_MOVIE_SUPPORTED_MATERIAL_EXTENSIONS].sort(),
    [
      "KHR_materials_clearcoat",
      "KHR_materials_ior",
      "KHR_materials_transmission",
      "KHR_texture_transform",
    ],
  );

  // 2.
  TestValidator.equals(
    "parity only",
    [
      unsupportedAutoMovieMaterialExtensions([]),
      unsupportedAutoMovieMaterialExtensions([
        "KHR_texture_transform",
        "KHR_materials_ior",
        "KHR_materials_transmission",
        "KHR_materials_clearcoat",
        "KHR_draco_mesh_compression",
        "KHR_mesh_quantization",
        "KHR_lights_punctual",
        "VRMC_vrm",
        "KHR_animation_pointer",
      ]),
    ],
    [[], []],
  );

  // 3.
  TestValidator.equals(
    "reported once, sorted",
    unsupportedAutoMovieMaterialExtensions([
      "VRMC_materials_mtoon",
      "KHR_materials_sheen",
      "KHR_materials_volume",
      "KHR_materials_ior",
      "KHR_materials_sheen",
      "EXT_texture_webp",
      "KHR_materials_pbrSpecularGlossiness",
      "KHR_texture_basisu",
      "KHR_materials_emissive_strength",
    ]),
    [
      "EXT_texture_webp",
      "KHR_materials_emissive_strength",
      "KHR_materials_pbrSpecularGlossiness",
      "KHR_materials_sheen",
      "KHR_materials_volume",
      "KHR_texture_basisu",
      "VRMC_materials_mtoon",
    ],
  );

  // 4.
  TestValidator.equals(
    "segments",
    [
      "KHR_materials_sheen",
      "ADOBE_material_thin_glass",
      "KHR_texture_transform",
      "EXT_textures_webp",
      "VENDOR_Materials_future",
      "KHR_draco_mesh_compression",
      "KHR_lights_punctual",
      "KHR_immaterialism",
    ].map(isAutoMovieMaterialExtension),
    [true, true, true, true, true, false, false, false],
  );
}
