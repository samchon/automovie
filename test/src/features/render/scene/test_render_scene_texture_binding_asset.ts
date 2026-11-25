import { textureBindingAsset } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `textureBindingAsset` reads the asset id of a texture binding.
 *
 * Scenarios:
 *
 * 1. A legacy string binding is its own asset.
 * 2. A structured binding names its asset.
 */
export function test_render_scene_texture_binding_asset(): void {
  TestValidator.equals("string", textureBindingAsset("wood.png"), "wood.png");
  TestValidator.equals(
    "structured",
    textureBindingAsset({ asset: "brick.png", texCoord: 0, colorSpace: "srgb" }),
    "brick.png",
  );
}