import type { IAutoMovieRigLocalTransform } from "@automovie/interface";
import { AutoMovieRenderImportedModel, AutoMovieRenderSceneMotion } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `applyRigLocals` writes each mapped bone's local transform and the
 * root's, with unit scale.
 *
 * Scenarios:
 *
 * 1. A root at (1, 0, 0) and a hips local at (0, 2, 0) with a quarter turn about
 *    Z are written to the model's wrapper and to the hips node, scale 1.
 * 2. Locals that do not match the mapped bones, and a quaternion that is not a
 *    unit, are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names mapped world wrapper and bone-local transforms, unit scale and the invalid local cases.
 * @evidence contracts/development/testing.md#behavioral-verification Builds an imported model wrapper on native Three.js objects. Writes typed rig locals with applyRigLocals and reads the resulting transforms. Calls the same function with a missing bone and a non-unit quaternion.
 * @evidence contracts/development/testing.md#independent-expectations The wrapper translates to (1, 0, 0), while the hip translates locally to (0, 2, 0) and turns one quarter about Z. Both have unit scale. An empty mapping or invalid quaternion must refuse.
 */
export function test_render_scene_apply_rig_locals(): void {
  const hips: THREE.Object3D = new THREE.Object3D();
  const rig: THREE.Group = new THREE.Group();
  rig.add(hips);
  const model = AutoMovieRenderImportedModel.create({
    object: rig,
    bones: { hips },
  });
  const half: number = Math.SQRT1_2;
  const local = (
    translation: [number, number, number],
    rotation: [number, number, number, number],
  ): IAutoMovieRigLocalTransform => ({ translation, rotation });
  const root: IAutoMovieRigLocalTransform = local([1, 0, 0], [0, 0, 0, 1]);
  AutoMovieRenderSceneMotion.applyRigLocals(
    model,
    new Map([["hips", local([0, 2, 0], [0, 0, half, half])]]),
    root,
  );
  TestValidator.equals(
    "written",
    [
      model.object.position.toArray(),
      hips.position.toArray(),
      hips.quaternion.toArray(),
      hips.scale.toArray(),
    ],
    [[1, 0, 0], [0, 2, 0], [0, 0, half, half], [1, 1, 1]],
  );
  TestValidator.error("missing bone", (): void => {
    AutoMovieRenderSceneMotion.applyRigLocals(model, new Map(), root);
  });
  TestValidator.error("not a unit quaternion", (): void => {
    AutoMovieRenderSceneMotion.applyRigLocals(
      model,
      new Map([["hips", local([0, 0, 0], [0, 0, 0, 2])]]),
      root,
    );
  });
}