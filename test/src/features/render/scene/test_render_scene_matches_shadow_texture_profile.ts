import type { IAutoMovieRenderTextureTarget } from "@automovie/interface";
import {
  matchesAutoMovieShadowTextureProfile
} from "../../../../../packages/render/src/scene/internal/matchesAutoMovieShadowTextureProfile";
import { TestValidator } from "@nestia/e2e";

/**
 * `matchesAutoMovieShadowTextureProfile` compares size, faces, samples,
 * mipmapping, depth and formats of an actual target to the planned one.
 *
 * Scenarios:
 *
 * 1. An actual target with no `faces` matches a one-face plan with the same
 *    values.
 * 2. A different width, face count, format list or depth texture does not.
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
    matchesAutoMovieShadowTextureProfile(target({}), planned),
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
      matchesAutoMovieShadowTextureProfile(target(patch), planned),
      false,
    );
}