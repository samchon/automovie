import { AutoMovieRenderSceneTexture } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `textureBindingAsset` reads the asset id of a texture binding.
 *
 * Scenarios:
 *
 * 1. A legacy string binding is its own asset.
 * 2. A structured binding names its asset.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases state the supported legacy string and structured bindings.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that each binding form resolves the correct authored asset identifier.
 * @evidence contracts/development/testing.md#independent-expectations Compares against the literal asset named by each fixture, independent of the structured sampler fields.
 */
export function test_render_scene_texture_binding_asset(): void {
  TestValidator.equals("string", AutoMovieRenderSceneTexture.bindingAsset("wood.png"), "wood.png");
  TestValidator.equals(
    "structured",
    AutoMovieRenderSceneTexture.bindingAsset({ asset: "brick.png", texCoord: 0, colorSpace: "srgb" }),
    "brick.png",
  );
}