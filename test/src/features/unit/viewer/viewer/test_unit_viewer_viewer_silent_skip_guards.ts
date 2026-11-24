import { IAutoMovieSkeleton } from "@automovie/interface";
import {
  applyPose,
  buildScene,
  createImportedModelObject,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { IDENTITY_TRANSFORM } from "../../../internal/fixtures";
import { throwsError } from "../../../internal/predicates";

const TWO_BONES: IAutoMovieSkeleton = {
  id: "partial",
  bones: [
    { bone: "hips", parent: null, rest: IDENTITY_TRANSFORM, constraint: null },
    {
      bone: "head",
      parent: "hips",
      rest: IDENTITY_TRANSFORM,
      constraint: null,
    },
  ],
};

/**
 * Exercises explicit unresolved-model refusal and the existing partial imported bone-map report.
 *
 * Scenarios:
 * 1. An unresolved scene model refuses with both supplied node and model ids.
 * 2. The existing partial imported skeleton reports its missing head; a complete existing bone map reports none, without adding a Human case.
 */
export function test_unit_viewer_viewer_silent_skip_guards(): void {
  // 1. unresolvable scene node throws instead of shifting the mask palette
  TestValidator.predicate(
    "an unresolvable scene node throws with its ids",
    throwsError(
      (): import("@automovie/render").IAutoMovieSceneObject =>
        buildScene(
          {
            id: "scene-1",
            name: null,
            nodes: [
              {
                id: "node-ghost",
                model: "model-ghost",
                transform: IDENTITY_TRANSFORM,
                motion: null,
                pose: null,
              },
            ],
            cameras: [],
            lights: [],
          },
          (): undefined => undefined,
        ),
      ['scene node "node-ghost"', 'model "model-ghost"', "could not resolve"],
    ),
  );

  // 2. applyPose reports the bones the model map does not carry
  const hipsOnly: THREE.Object3D<THREE.Object3DEventMap> = new THREE.Object3D();
  const partial: import("@automovie/render").IAutoMovieModelObject =
    createImportedModelObject({
      object: new THREE.Object3D(),
      bones: { hips: hipsOnly },
    });
  const pose: { skeleton: string; root: null; joints: never[] } = {
    skeleton: TWO_BONES.id,
    root: null,
    joints: [],
  };
  TestValidator.equals(
    "unmapped skeleton bones are reported, mapped ones are not",
    applyPose(partial, pose, TWO_BONES),
    ["head"],
  );
  const full: import("@automovie/render").IAutoMovieModelObject =
    createImportedModelObject({
      object: new THREE.Object3D(),
      bones: { hips: new THREE.Object3D(), head: new THREE.Object3D() },
    });
  TestValidator.equals(
    "a complete bone map reports nothing skipped",
    applyPose(full, pose, TWO_BONES),
    [],
  );
}
