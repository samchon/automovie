import { AutoMovieEngineMaterial } from "@automovie/engine";
import type {
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieProceduralSurface,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieThreeKind,
  type IAutoMovieModelObject,
  type IMaterialShaderSource,
  AutoMovieRenderSceneLayout,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { compileMaterialShaderSource } from "../../internal/compileMaterialShaderSource";
import { createSkinnedTubeModel } from "../../internal/createSkinnedTubeModel";

/**
 * A skinned mesh samples its procedural surface at the bind pose, so the
 * pattern stays on the same surface points while the mesh bends.
 *
 * Scenarios:
 *
 * 1. A skinned tube with a plaster surface, built by `buildModel`, compiles a
 *    vertex stage that takes the sample point from the `position` attribute
 *    after `begin_vertex` and before three's morph and skinning chunks move the
 *    vertex.
 * 2. Bending the tube's spine bone 90° moves its upper vertices (three's CPU
 *    skinning of the same mesh moves them by more than 0.1 m), while the
 *    attribute the sample point reads is unchanged, so every vertex samples the
 *    same pattern value as in its bind pose.
 */
export function test_render_scene_build_model_procedural_skinned(): void {
  const surface: IAutoMovieProceduralSurface = {
    kind: "plaster",
    seed: 4,
    scale: 0.05,
    colors: [
      { r: 0.2, g: 0.2, b: 0.2, a: 1, hex: null },
      { r: 0.8, g: 0.8, b: 0.8, a: 1, hex: null },
    ],
    roughness: [0.5, 0.9],
    relief: 0,
  };
  const model: IAutoMovieModel = createSkinnedTubeModel();
  model.materials = model.materials.map(
    (material: IAutoMovieMaterial): IAutoMovieMaterial => ({
      ...material,
      procedural: surface,
    }),
  );
  const built: IAutoMovieModelObject = AutoMovieRenderSceneLayout.buildModel(model);
  let mesh: THREE.SkinnedMesh | null = null;
  built.object.traverse((object: THREE.Object3D): void => {
    if (AutoMovieThreeKind.isSkinnedMesh(object)) mesh = object;
  });
  const skinned: THREE.SkinnedMesh = mesh!;

  // 1. The sample point precedes deformation.
  const shader: IMaterialShaderSource = compileMaterialShaderSource(
    skinned.material,
  );
  const assigned: number = shader.vertexShader.indexOf(
    "vAutoMovieProceduralPoint = position;",
  );
  TestValidator.predicate(
    "the sample point is read before morphing and skinning",
    assigned > shader.vertexShader.indexOf("#include <begin_vertex>") &&
      assigned < shader.vertexShader.indexOf("#include <morphtarget_vertex>") &&
      assigned < shader.vertexShader.indexOf("#include <skinning_vertex>"),
  );

  // 2. Bend 90° and compare.
  const position: THREE.BufferAttribute = skinned.geometry.getAttribute(
    "position",
  ) as THREE.BufferAttribute;
  const before: number[] = Array.from(position.array);
  const spine: THREE.Bone = skinned.skeleton.bones.find(
    (bone: THREE.Bone): boolean => bone.name === "spine",
  )!;
  spine.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
  built.object.updateMatrixWorld(true);
  skinned.skeleton.update();
  let moved: number = 0;
  for (let index: number = 0; index < position.count; ++index) {
    const rest: THREE.Vector3 = new THREE.Vector3().fromBufferAttribute(
      position,
      index,
    );
    const bent: THREE.Vector3 = skinned.applyBoneTransform(index, rest.clone());
    moved = Math.max(moved, bent.distanceTo(rest));
  }
  const after: number[] = Array.from(position.array);
  let same: boolean = after.every(
    (value: number, k: number): boolean => value === before[k],
  );
  for (let index: number = 0; index < position.count && same; ++index) {
    const point: IAutoMovieVector3 = {
      x: after[3 * index]!,
      y: after[3 * index + 1]!,
      z: after[3 * index + 2]!,
    };
    const rest: IAutoMovieVector3 = {
      x: before[3 * index]!,
      y: before[3 * index + 1]!,
      z: before[3 * index + 2]!,
    };
    same =
      AutoMovieEngineMaterial.sampleProceduralSurface({ surface, point })
        .value ===
      AutoMovieEngineMaterial.sampleProceduralSurface({ surface, point: rest })
        .value;
  }
  TestValidator.predicate(
    `the bend moves the skin (${moved.toFixed(3)} m) but not the sampled bind pose`,
    moved > 0.1 && same,
  );
}
