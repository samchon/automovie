import type { IAutoMovieRenderTextureTarget } from "@automovie/interface";
import {
  matchesShadowTextureProfile
} from "../../../../../packages/render/src/scene/internal/matchesShadowTextureProfile";
import { TestValidator } from "@nestia/e2e";

/**
 * `matchesShadowTextureProfile` compares size, faces, samples,
 * mipmapping, depth and formats of an actual target to the planned one.
 *
 * Scenarios:
 *
 * 1. An actual target with no `faces` matches a one-face plan with the same
 *    values.
 * 2. A different width, face count, format list or depth texture does not.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases describe single-face normalization and the independent target fields that are changed to require refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that a target with an omitted face count matches a one-face plan and rejects mismatched width, face count, formats, and depth texture.
 * @evidence contracts/development/testing.md#independent-expectations Uses a fully specified target and explicit single-field variants with a known expected match outcome for each.
 */
export function test_render_scene_matches_shadow_texture_profile(): void {
  const target = (
    patch: Partial<IAutoMovieRenderTextureTarget>,
  ): IAutoMovieRenderTextureTarget => ({
    owner: "o",
    width: 512,
    height: 512,
    formats: ["rgba8"],
    mipmapped: false,
    samples: 0,
    depthBytesPerTexel: 4,
    depthTexture: true,
    ...patch,
  });
  const planned: IAutoMovieRenderTextureTarget = target({ faces: 1 });
  TestValidator.equals(
    "same",
    matchesShadowTextureProfile(target({}), planned),
    true,
  );
  for (const patch of [
    { width: 256 },
    { faces: 6 as const },
    { formats: ["rg16f" as const] },
    { depthTexture: false },
  ])
    TestValidator.equals(
      JSON.stringify(patch),
      matchesShadowTextureProfile(target(patch), planned),
      false,
    );
}