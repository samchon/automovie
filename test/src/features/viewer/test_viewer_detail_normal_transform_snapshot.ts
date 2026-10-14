import { createDetailNormalShaderPatch } from "../../../../packages/viewer/src/detailNormalShading/createDetailNormalShaderPatch";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/predicates";

/**
 * Detail-normal registration snapshots the UV transform while borrowing the texture, so later caller transforms cannot retarget the captured uniform.
 *
 * Scenarios:
 * 1. Translation (0.25, 0.5) and repeat (2, 3), with zero rotation and centre,
 *    produce the independently derived affine matrix at registration.
 * 2. Changing the caller's translation and repeat leaves the captured matrix
 *    unchanged and distinct from the texture's current matrix.
 *
 * @evidence contracts/testing.md#behavioral-verification Registers the actual detail-normal operation, changes the caller texture transform and applies the operation to a native shader-shaped record. The attached transform must retain registration values while the texture remains borrowed and strength remains 0.75.
 * @evidence contracts/testing.md#independent-expectations With zero rotation and centre, repeat (2,3) and offset (0.25,0.5) independently give column-major affine entries [2,0,0,0,3,0,0.25,0.5,1]. This checks captured uniform values and identity, not source spelling, GPU compilation or rendered normals.
 * @evidence contracts/testing.md#distinguishing-cases The post-registration offset/repeat change contrasts with retained matrix coefficients and the still-identical texture reference. Combined-map and detail-only material admission belong to the material unit; this case owns the transform snapshot boundary.
 * @evidence contracts/testing.md#execution-ownership This named portable unit directly invokes patch registration/application using Three metadata objects, then disposes its texture. No renderer, browser, GPU or dynamically registered test is acquired.
 */
export function test_viewer_detail_normal_transform_snapshot(): void {
  const texture: THREE.Texture = new THREE.Texture();
  texture.offset.set(0.25, 0.5);
  texture.repeat.set(2, 3);
  const patch: ReturnType<typeof createDetailNormalShaderPatch> = createDetailNormalShaderPatch(texture, 0.75);
  texture.offset.set(0.75, 0.125);
  texture.repeat.set(4, 5);
  texture.updateMatrix();
  const shader: Parameters<typeof patch.apply>[0] = {
    vertexShader: THREE.ShaderLib.physical.vertexShader,
    fragmentShader: THREE.ShaderLib.physical.fragmentShader,
    uniforms: {} as Record<string, THREE.IUniform>,
  };
  patch.apply(shader);
  const captured: THREE.Matrix3 = shader.uniforms.detailNormalTransform!.value as THREE.Matrix3;
  const expected: number[] = [2, 0, 0, 0, 3, 0, 0.25, 0.5, 1];
  TestValidator.predicate("the captured affine transform retains its registration values", captured.elements.every((value: number, index: number): boolean => nclose(value, expected[index]!, 0)));
  TestValidator.predicate("the matrix is separately owned", captured !== texture.matrix && !captured.equals(texture.matrix));
  TestValidator.predicate("the texture stays borrowed", shader.uniforms.detailNormalMap!.value === texture);
  TestValidator.predicate("strength stays the registered value", nclose(shader.uniforms.detailNormalScale!.value as number, 0.75, 0));
  texture.dispose();
}
