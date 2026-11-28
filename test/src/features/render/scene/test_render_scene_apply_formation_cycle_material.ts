import { type IAutoMovieRenderFormationCycle, AutoMovieRenderMaterial, AutoMovieRenderFormationCycle } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { compileMaterialShaderSource } from "../../internal/compileMaterialShaderSource";
import { createFormationCycleLiteral } from "../../internal/createFormationCycleLiteral";

/**
 * `applyFormationCycleMaterial` registers the cycle injection as one keyed
 * shader patch, so applying it again replaces it instead of injecting twice.
 *
 * Scenarios, on a fresh basic material and the smallest cycle:
 *
 * 1. Applied once, the material carries one patch, keyed
 *    `automovie-formation-cycle`, which is its program key, and the compiled
 *    vertex source declares the cycle's uniforms once and binds its texture.
 * 2. Applied a second time, it still carries one patch, the program key is
 *    unchanged and the compiled source declares the uniforms once.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the keyed patch, shader and texture produced at the first application and kept at the second.
 * @evidence contracts/development/testing.md#behavioral-verification Applies a literal formation cycle to a basic Three.js material, then reads registered patches, the actual cache key and the compiled vertex declarations and texture uniform.
 * @evidence contracts/development/testing.md#independent-expectations One keyed policy must leave exactly one patch and uniform declaration regardless of whether it is applied once or twice. The first shader must hold the same texture object as the fixture, with the cache key automovie-formation-cycle.
 */
export function test_render_scene_apply_formation_cycle_material(): void {
  const cycle: IAutoMovieRenderFormationCycle = createFormationCycleLiteral();
  const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial();
  const declarations: () => number = (): number =>
    compileMaterialShaderSource(
      material,
      THREE.ShaderLib.basic,
    ).vertexShader.split("uniform float automovieCycleTurn;").length - 1;
  AutoMovieRenderFormationCycle.applyFormationCycleMaterial(material, cycle);
  TestValidator.equals(
    "applied once",
    [
      AutoMovieRenderMaterial.readShaderPatches(material).length,
      material.customProgramCacheKey(),
      declarations(),
      compileMaterialShaderSource(material, THREE.ShaderLib.basic).uniforms
        .automovieCycleTexture === cycle.uniforms.automovieCycleTexture,
    ],
    [1, "automovie-formation-cycle", 1, true],
  );
  AutoMovieRenderFormationCycle.applyFormationCycleMaterial(material, cycle);
  TestValidator.equals(
    "applied twice, injected once",
    [
      AutoMovieRenderMaterial.readShaderPatches(material).length,
      material.customProgramCacheKey(),
      declarations(),
    ],
    [1, "automovie-formation-cycle", 1],
  );
  material.dispose();
}
