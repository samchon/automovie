import { materialTextureSlots } from "@automovie/engine";
import type { IAutoMovieMaterial } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `materialTextureSlots` lists every texture a material binds with the color
 * space it is read in: colour slots (base colour, emissive, an overlay's base
 * colour) in sRGB, data slots (normals, occlusion, metal-roughness, thickness,
 * anisotropy) linear, in declaration order, skipping unbound slots.
 *
 * Scenario: a material binding base colour, normal and emissive, with one
 * overlay binding base colour and no normal, lists exactly those four.
 */
export function test_unit_engine_validation_material_texture_slots(): void {
  const material: IAutoMovieMaterial = {
    id: "oak",
    name: null,
    baseColor: { r: 1, g: 1, b: 1, a: null, hex: null },
    metallic: 0,
    roughness: 1,
    emissive: null,
    opacity: 1,
    baseColorTexture: "oak-albedo",
    normalTexture: "oak-normal",
    emissiveTexture: "oak-glow",
    occlusionTexture: null,
    overlays: [
      {
        baseColorTexture: "grime",
        blend: "multiply",
        normalTexture: null,
        strength: 0.5,
      },
    ],
  };
  TestValidator.equals(
    "every bound slot and its color space",
    materialTextureSlots(material),
    [
      { path: ".baseColorTexture", binding: "oak-albedo", colorSpace: "srgb" },
      { path: ".normalTexture", binding: "oak-normal", colorSpace: "linear" },
      { path: ".emissiveTexture", binding: "oak-glow", colorSpace: "srgb" },
      {
        path: ".overlays[0].baseColorTexture",
        binding: "grime",
        colorSpace: "srgb",
      },
    ],
  );
}
