import { AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieMaterial,
  IAutoMovieMaterialWear,
  IAutoMovieMeasureFeatureEdges,
  IAutoMovieMesh,
  IAutoMovieModel,
} from "@automovie/interface";
import {
  AutoMovieRenderThreeKind,
  type IAutoMovieRenderModelObject,
  type IAutoMovieRenderMaterialShaderSource,
  AutoMovieRenderSceneLayout,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { compileMaterialShaderSource } from "../../internal/compileMaterialShaderSource";
import { createSkinnedTubeModel } from "../../internal/createSkinnedTubeModel";
import { singleMaterial } from "../../internal/singleMaterial";

/**
 * A skinned mesh is worn at its bind pose: its feature edges are measured once
 * on the authored positions, and posing moves the skin without moving the
 * wear.
 *
 * Scenarios:
 *
 * 1. Building a skinned tube whose material declares edge wear gives a skinned
 *    mesh drawn non-indexed, carrying its skin indices and weights for every
 *    corner and a `wearList` per vertex.
 * 2. The wear texture holds exactly the feature edges
 *    `measureFeatureEdges` finds on the authored bind-pose mesh.
 * 3. Bending the spine bone 90° moves the skinned vertices (three's CPU skinning
 *    moves them by more than 0.1 m) while the `position` attribute the wear
 *    distances read stays at bind pose, so each fragment's distances, and its
 *    wear, stay on the same surface points.
 * 4. Disposing the part's material disposes its edge texture, which only that
 *    material's program reads.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names authored wear on a skinned object and its skin, geometry and texture lifecycle.
 * @evidence contracts/development/testing.md#behavioral-verification Builds a typed worn skinned tube, reads native vertex and edge texture data, rotates a spine bone and samples native CPU skinning. Checks texture disposal through the material owner.
 * @evidence contracts/development/testing.md#independent-expectations The Engine's authored-position edge measurement supplies the reference endpoints. Non-indexed triangle corners retain their own skin weights and wear list. Rotating the spine moves rendered positions by more than 0.1 m without mutating the bind data. Disposal retires the sole texture with its material.
 */
export function test_render_scene_build_model_wear_skinned(): void {
  const wear: IAutoMovieMaterialWear = {
    seed: 9,
    edge: {
      color: { r: 0.5, g: 0.45, b: 0.4, a: 1, hex: null },
      roughness: 0.9,
      width: 0.02,
      amount: 0.8,
    },
  };
  const model: IAutoMovieModel = createSkinnedTubeModel();
  model.materials = model.materials.map(
    (material: IAutoMovieMaterial): IAutoMovieMaterial => ({
      ...material,
      wear,
    }),
  );
  const built: IAutoMovieRenderModelObject = AutoMovieRenderSceneLayout.buildModel(model);
  let found: THREE.SkinnedMesh | null = null;
  built.object.traverse((object: THREE.Object3D): void => {
    if (AutoMovieRenderThreeKind.isSkinnedMesh(object)) found = object;
  });
  const mesh: THREE.SkinnedMesh = found!;
  const geometry: THREE.BufferGeometry = mesh.geometry;

  // 1. Non-indexed, skin kept, list per vertex.
  const count: number = geometry.getAttribute("position").count;
  TestValidator.predicate(
    "the worn skinned mesh is non-indexed with skin and list attributes",
    geometry.index === null &&
      geometry.getAttribute("skinIndex").count === count &&
      geometry.getAttribute("skinWeight").count === count &&
      geometry.getAttribute("wearList").count === count,
  );

  // 2. Edges measured at bind pose.
  const source: (typeof model.parts)[number]["geometry"] =
    model.parts[0]!.geometry;
  if (source.type !== "mesh") throw new Error("Expected a mesh part");
  const record: IAutoMovieMesh = source.mesh;
  const expected: IAutoMovieMeasureFeatureEdges.IResult =
    AutoMovieEngineGeometry.measureFeatureEdges({
      positions: new Float32Array(record.positions),
      indices: record.indices!,
      reach: 0.02,
    });
  const material: THREE.Material = singleMaterial(mesh.material);
  const shader: IAutoMovieRenderMaterialShaderSource = compileMaterialShaderSource(material);
  const texture: THREE.DataTexture = shader.uniforms.uWearEdges!.value;
  const data: THREE.TypedArray | null = texture.image.data;
  if (data === null) throw new Error("Expected wear edge data");
  TestValidator.predicate(
    `the texture holds the ${expected.edges.length} bind-pose edges`,
    expected.edges.every(
      (edge: IAutoMovieMeasureFeatureEdges.IEdge, e: number): boolean =>
        data[8 * e] === edge.a.x &&
        data[8 * e + 1] === edge.a.y &&
        data[8 * e + 6] === edge.b.z &&
        data[8 * e + 3] === (edge.convex ? 1 : 0),
    ),
  );

  // 3. Bend and compare.
  const position: THREE.BufferAttribute = geometry.getAttribute(
    "position",
  ) as THREE.BufferAttribute;
  const before: number[] = Array.from(position.array);
  const spine: THREE.Bone = mesh.skeleton.bones.find(
    (bone: THREE.Bone): boolean => bone.name === "spine",
  )!;
  spine.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
  built.object.updateMatrixWorld(true);
  mesh.skeleton.update();
  let moved: number = 0;
  for (let index: number = 0; index < position.count; ++index) {
    const rest: THREE.Vector3 = new THREE.Vector3().fromBufferAttribute(
      position,
      index,
    );
    moved = Math.max(
      moved,
      mesh.applyBoneTransform(index, rest.clone()).distanceTo(rest),
    );
  }
  const after: number[] = Array.from(position.array);
  const assigned: number = shader.vertexShader.indexOf(
    "vWearPoint = position;",
  );
  TestValidator.predicate(
    `the bend moves the skin (${moved.toFixed(3)} m) but not the worn bind pose`,
    moved > 0.1 &&
      after.every((value: number, k: number): boolean => value === before[k]) &&
      assigned > 0 &&
      assigned < shader.vertexShader.indexOf("#include <skinning_vertex>"),
  );

  // 4. Disposing the part's material releases its edge texture.
  let released: boolean = false;
  texture.addEventListener("dispose", (): void => {
    released = true;
  });
  material.dispose();
  TestValidator.predicate(
    "disposing the worn material disposes its edge texture",
    released,
  );
}
