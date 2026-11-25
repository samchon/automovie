import { planAutoMovieShadowTextureTarget } from "@automovie/render/internal";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `planAutoMovieShadowTextureTarget` plans the target a light's shadow needs.
 *
 * Scenarios:
 *
 * 1. A directional shadow of map size 512 and a 4096 limit is 512 by 512, one
 *    face, one RGBA8 format and a depth texture for its map.
 * 2. A variance blur target is one RG16F format with no depth texture.
 * 3. A point shadow is square with six faces: 512 under a 4096 limit, and the
 *    limit 256 when that is smaller than the map size.
 */
export function test_unit_render_scene_plan_shadow_texture_target(): void {
  const directional: THREE.LightShadow = new THREE.DirectionalLight().shadow;
  const map = planAutoMovieShadowTextureTarget(
    "scene",
    "key",
    directional,
    false,
    "pcf",
    "map",
    4096,
  );
  TestValidator.equals(
    "map",
    {
      width: map.width,
      height: map.height,
      faces: map.faces,
      formats: map.formats,
      depthTexture: map.depthTexture,
    },
    {
      width: 512,
      height: 512,
      faces: 1,
      formats: ["rgba8"],
      depthTexture: true,
    },
  );
  const blur = planAutoMovieShadowTextureTarget(
    "scene",
    "key",
    directional,
    false,
    "vsm",
    "blur",
    4096,
  );
  TestValidator.equals(
    "blur",
    [blur.formats, blur.depthTexture],
    [["rg16f"], false],
  );
  const point: THREE.LightShadow = new THREE.PointLight().shadow;
  for (const [limit, edge] of [
    [4096, 512],
    [256, 256],
  ] as const) {
    const target = planAutoMovieShadowTextureTarget(
      "scene",
      "lamp",
      point,
      true,
      "pcf",
      "map",
      limit,
    );
    TestValidator.equals(
      `point ${limit}`,
      [target.width, target.height, target.faces],
      [edge, edge, 6],
    );
  }
}