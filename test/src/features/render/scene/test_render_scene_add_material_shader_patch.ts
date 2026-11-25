import {
  type IMaterialShaderPatch,
  addMaterialShaderPatch,
  readMaterialShaderPatches,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { MeshBasicMaterial } from "three";

/**
 * Shader registration preserves order until one key is registered again.
 *
 * Scenarios:
 *
 * 1. Two keys compile in their registration order and name the program key in that
 *    same order.
 * 2. Replacing the first key keeps the other patch and adds the replacement once
 *    at the end. Other materials do not inherit either registration.
 */
export function test_render_scene_add_material_shader_patch(): void {
  const material: MeshBasicMaterial = new MeshBasicMaterial();
  const untouched: MeshBasicMaterial = new MeshBasicMaterial();
  const first: IMaterialShaderPatch = { key: "first", apply: () => {} };
  const second: IMaterialShaderPatch = { key: "second", apply: () => {} };
  const replacement: IMaterialShaderPatch = { key: "first", apply: () => {} };

  addMaterialShaderPatch(material, first);
  addMaterialShaderPatch(material, second);
  const original: readonly IMaterialShaderPatch[] =
    readMaterialShaderPatches(material);
  TestValidator.predicate(
    "original registration order",
    original[0] === first && original[1] === second,
  );
  TestValidator.equals(
    "original program key",
    material.customProgramCacheKey(),
    "first+second",
  );

  addMaterialShaderPatch(material, replacement);
  const registered: readonly IMaterialShaderPatch[] =
    readMaterialShaderPatches(material);
  TestValidator.predicate(
    "replacement is unique and last",
    registered.length === 2 &&
      registered[0] === second &&
      registered[1] === replacement,
  );
  TestValidator.equals(
    "replacement program key",
    material.customProgramCacheKey(),
    "second+first",
  );
  TestValidator.equals(
    "another material remains untouched",
    readMaterialShaderPatches(untouched),
    [],
  );
}
