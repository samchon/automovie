import { AutoMovieRenderDetailNormalShading } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../../internal/predicates";

/**
 * Detail-normal registration snapshots the UV transform while borrowing the
 * texture, so later caller transforms cannot retarget the captured uniform.
 *
 * Scenarios:
 *
 * 1. Translation (0.25, 0.5) and repeat (2, 3), with zero rotation and centre,
 *    produce the independently derived affine matrix at registration.
 * 2. Changing the caller's translation and repeat leaves the captured matrix
 *    unchanged and distinct from the texture's current matrix.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the captured transform, borrowed texture and later caller mutation.
 * @evidence contracts/development/testing.md#behavioral-verification Creates a real texture, registers its detail-normal patch and invokes its material callback to read the captured UV transform. Mutates the source texture before comparing it with the retained uniform.
 * @evidence contracts/development/testing.md#independent-expectations With zero rotation and center, repeat 2 by 3 gives the diagonal and offset (0.25, 0.5) gives the affine translation. Later changes distinguish an owned matrix from the caller's live one.
 */
export function test_render_scene_create_detail_normal_shader_patch(): void {
  const texture: THREE.Texture = new THREE.Texture();
  texture.offset.set(0.25, 0.5);
  texture.repeat.set(2, 3);
  const patch: ReturnType<typeof AutoMovieRenderDetailNormalShading.createShaderPatch> =
    AutoMovieRenderDetailNormalShading.createShaderPatch(texture, 0.75);
  texture.offset.set(0.75, 0.125);
  texture.repeat.set(4, 5);
  texture.updateMatrix();
  const shader: Parameters<typeof patch.apply>[0] = {
    vertexShader: THREE.ShaderLib.physical.vertexShader,
    fragmentShader: THREE.ShaderLib.physical.fragmentShader,
    uniforms: {} as Record<string, THREE.IUniform>,
  };
  patch.apply(shader);
  const captured: THREE.Matrix3 = shader.uniforms.detailNormalTransform!.value;
  const expected: number[] = [2, 0, 0, 0, 3, 0, 0.25, 0.5, 1];
  TestValidator.predicate(
    "the captured affine transform retains its registration values",
    captured.elements.every((value: number, index: number): boolean =>
      nclose(value, expected[index]!, 0),
    ),
  );
  TestValidator.predicate(
    "the matrix is separately owned",
    captured !== texture.matrix && !captured.equals(texture.matrix),
  );
  TestValidator.predicate(
    "the texture stays borrowed",
    shader.uniforms.detailNormalMap!.value === texture,
  );
  TestValidator.predicate(
    "strength stays the registered value",
    nclose(shader.uniforms.detailNormalScale!.value, 0.75, 0),
  );
  texture.dispose();
}
