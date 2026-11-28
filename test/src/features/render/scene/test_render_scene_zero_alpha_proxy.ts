import type { IAutoMovieMaterial, IAutoMovieModel, IAutoMoviePrimitiveShape } from "@automovie/interface";
import { AutoMovieRenderSceneLayout, AutoMovieRenderSceneResource } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { createModel, primitivePart } from "../../internal/fixtures";

/**
 * A transparent collision proxy stays in the model part lookup, and its mesh
 * owns a false visibility flag independent of the material used for drawing.
 *
 * Scenarios:
 * 1. A box with zero-opacity blend and no transmission is hidden.
 * 2. The same geometry with an opaque material is visible.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases describe identical box geometry with a zero-opacity blend or opaque material.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that the transparent mesh retains its model part entry while visibility follows the assigned material case.
 * @evidence contracts/development/testing.md#independent-expectations Compares the expected visible flags for two fixture materials applied to the same authored box.
 */
export function test_render_scene_zero_alpha_proxy(): void {
  const base: IAutoMovieModel = createModel(null);
  const solid: IAutoMovieMaterial | undefined = base.materials[0];
  if (solid === undefined) throw new Error("The box fixture needs a material");
  const proxy: IAutoMovieMaterial = {
    ...solid,
    id: "collision",
    alphaMode: "blend",
    opacity: 0,
    transmission: 0,
  };
  const box: IAutoMoviePrimitiveShape = {
    type: "box",
    width: 1,
    height: 1,
    depth: 1,
  };
  const built: ReturnType<typeof AutoMovieRenderSceneLayout.buildModel> =
    AutoMovieRenderSceneLayout.buildModel({
    ...base,
    materials: [solid, proxy],
    parts: [
      { ...primitivePart("collision", box), material: proxy.id },
      { ...primitivePart("surface", box), material: solid.id },
    ],
  });
  try {
    TestValidator.equals(
      "the explicit collision mesh is hidden",
      built.parts.get("collision")?.visible,
      false,
    );
    TestValidator.equals(
      "the visible mesh stays visible",
      built.parts.get("surface")?.visible,
      true,
    );
  } finally {
    for (const resource of AutoMovieRenderSceneResource.collectOwnedResources(built.object))
      resource.dispose();
  }
}
