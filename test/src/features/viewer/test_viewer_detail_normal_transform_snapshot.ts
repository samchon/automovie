import { createDetailNormalShaderPatch } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/predicates";

/**
 * Detail-normal registration snapshots the UV transform while borrowing the
 * texture itself. Later caller transforms cannot retarget the captured shader.
 *
 * Scenarios:
 * 1. Translation (0.25, 0.5) and repeat (2, 3), with zero rotation and centre,
 *    produce the independently derived affine matrix at registration.
 * 2. Changing the caller's translation and repeat leaves the captured matrix
 *    unchanged and distinct from the texture's current matrix.
 */
export const test_viewer_detail_normal_transform_snapshot = (): void => {
  const texture = new THREE.Texture();
  texture.offset.set(0.25, 0.5);
  texture.repeat.set(2, 3);
  const patch = createDetailNormalShaderPatch(texture, 0.75);
  texture.offset.set(0.75, 0.125);
  texture.repeat.set(4, 5);
  texture.updateMatrix();
  const shader = {
    vertexShader: THREE.ShaderLib.physical.vertexShader,
    fragmentShader: THREE.ShaderLib.physical.fragmentShader,
    uniforms: {} as Record<string, THREE.IUniform>,
  };
  patch.apply(shader);
  const captured = shader.uniforms.detailNormalTransform!.value as THREE.Matrix3;
  const expected = [2, 0, 0, 0, 3, 0, 0.25, 0.5, 1];
  TestValidator.predicate("the captured affine transform retains its registration values", captured.elements.every((value, index) => nclose(value, expected[index]!, 0)));
  TestValidator.predicate("the matrix is separately owned", captured !== texture.matrix && !captured.equals(texture.matrix));
  TestValidator.predicate("the texture stays borrowed", shader.uniforms.detailNormalMap!.value === texture);
  TestValidator.predicate("strength stays the registered value", nclose(shader.uniforms.detailNormalScale!.value as number, 0.75, 0));
  texture.dispose();
};
