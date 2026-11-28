import type { IAutoMovieMaterial } from "@automovie/interface";
import { AutoMovieRenderMaterial } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `materialTextureBindings` lists the textures a material declares, in the
 * order of its slots.
 *
 * Scenarios:
 *
 * 1. A material with a base colour, a normal and an emissive texture lists
 *    those three, skipping absent and null slots.
 * 2. A material with no texture lists none.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases describe a declared base, normal, and emissive texture with omitted slots, plus a texture-free material.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that the reported bindings preserve slot order and skip absent and null values.
 * @evidence contracts/development/testing.md#independent-expectations Compares against the three fixture textures in their declared slots and an empty expected list.
 */
export function test_render_scene_material_texture_bindings(): void {
  const material = (patch: Partial<IAutoMovieMaterial>): IAutoMovieMaterial => ({
    id: "m",
    name: null,
    baseColor: { r: 1, g: 1, b: 1, a: null, hex: null },
    metallic: 0,
    roughness: 1,
    emissive: null,
    opacity: 1,
    baseColorTexture: null,
    ...patch,
  });
  const normal = { asset: "n.png", texCoord: 0, colorSpace: "linear" as const };
  TestValidator.equals(
    "three slots",
    AutoMovieRenderMaterial.textureBindings(
      material({
        baseColorTexture: "a.png",
        normalTexture: normal,
        occlusionTexture: null,
        emissiveTexture: "e.png",
      }),
    ),
    ["a.png", normal, "e.png"],
  );
  TestValidator.equals("none", AutoMovieRenderMaterial.textureBindings(material({})), []);
}