import type { IAutoMovieFormationCycle } from "@automovie/render";
import {
  AutoMovieThreeKind,
  applyFormationCycleMaterial,
  buildInstancedFormation,
  formationCycleOf,
  readMaterialShaderPatches,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { compileMaterialShaderSource } from "../../../internal/compileMaterialShaderSource";
import { createFormationShadowInputs } from "../../../internal/createFormationShadowInputs";
import { readObjectOfKind } from "../../../internal/readObjectOfKind";

/**
 * `applyFormationCycleMaterial` registers the cycle injection as one keyed
 * shader patch, so applying it again replaces it instead of injecting twice.
 *
 * Scenarios, on a fresh basic material and a fixture formation's cycle:
 *
 * 1. Applied once, the material carries one patch, keyed
 *    `automovie-formation-cycle`, which is its program key, and the compiled
 *    vertex source declares the cycle's uniforms once and binds its texture.
 * 2. Applied a second time, it still carries one patch, the program key is
 *    unchanged and the compiled source declares the uniforms once.
 */
export function test_unit_render_scene_apply_formation_cycle_material(): void {
  const runtime: ReturnType<typeof buildInstancedFormation> =
    buildInstancedFormation(createFormationShadowInputs(1025));
  const cycle: IAutoMovieFormationCycle | null = formationCycleOf(
    readObjectOfKind(
      runtime.object.children,
      0,
      AutoMovieThreeKind.isInstancedMesh,
    ),
  );
  if (cycle === null) throw new Error("The fixture formation has a cycle");
  const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial();
  const declarations: () => number = (): number =>
    compileMaterialShaderSource(
      material,
      THREE.ShaderLib.basic,
    ).vertexShader.split("uniform float automovieCycleTurn;").length - 1;
  applyFormationCycleMaterial(material, cycle);
  TestValidator.equals(
    "applied once",
    [
      readMaterialShaderPatches(material).length,
      material.customProgramCacheKey(),
      declarations(),
      compileMaterialShaderSource(material, THREE.ShaderLib.basic).uniforms
        .automovieCycleTexture === cycle.uniforms.automovieCycleTexture,
    ],
    [1, "automovie-formation-cycle", 1, true],
  );
  applyFormationCycleMaterial(material, cycle);
  TestValidator.equals(
    "applied twice, injected once",
    [
      readMaterialShaderPatches(material).length,
      material.customProgramCacheKey(),
      declarations(),
    ],
    [1, "automovie-formation-cycle", 1],
  );
  material.dispose();
  runtime.dispose();
}
