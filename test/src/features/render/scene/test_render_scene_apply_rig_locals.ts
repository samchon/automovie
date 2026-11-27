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