import {
  deriveAutoMovieSemanticMask,
  inspectAutoMovieMeshTopology,
  measureAutoMovieRenderInventory,
  mergeAutoMovieMeshes,
  transformAutoMovieMesh,
  validateModel,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import {
  RELIEF_WEIGHT_TARGET,
  buildModel,
  detailNormalFragment,
  flattenInstancedModel,
  reliefWeightFragment,
  reliefWeightVertex,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { hasViolation, namedFacts } from "../internal/predicates";
import { instanceSetFixture, sceneFixture } from "../internal/renderFixtures";
import {
  vertexColourMesh,
  vertexColourModel,
} from "../internal/vertexColourFixture";

/**
 * A mesh's relief weights scale its material's normal-map slopes vertex by
 * vertex.
 *
 * Scenarios:
 * 1. A weighted part draws with a variant of its material that reads the
 *    `reliefWeight` attribute; a bare part sharing the material keeps the
 *    plain one; a material without a normal map is left unpatched.
 * 2. The vertex shader passes the weight, and the fragment shader scales the
 *    normal map's slopes right after their own scale, before a detail blend
 *    even when that patch ran first.
 * 3. Instanced flattening gives a bare neighbour weights of one.
 * 4. Validation refuses a buffer of the wrong length and a negative or
 *    nonfinite weight; merging pads a bare mesh with ones; transforming
 *    copies the weights; topology counts a nonfinite one.
 * 5. The render budget charges four bytes a vertex, and a flattened mixed
 *    model the ones its bare vertices take.
 */
export const test_viewer_relief_weights = (): void => {
  const weighted: IAutoMovieMesh = {
    ...vertexColourMesh(),
    reliefWeights: [0, 0.5, 1],
  };
  const { colors: _colors, reliefWeights: _weights, ...bare } = weighted;
  const model = vertexColourModel([weighted, bare]);
  model.materials = [
    {
      ...model.materials[0]!,
      normalTexture: {
        asset: "relief.png",
        texCoord: 0,
        colorSpace: "linear",
      },
    },
  ];
  const built = buildModel(model, () => new THREE.Texture());
  const meshes: THREE.Mesh[] = [];
  built.object.traverse((one) => {
    if (one instanceof THREE.Mesh) meshes.push(one);
  });
  const keyOf = (mesh: THREE.Mesh) =>
    (mesh.material as THREE.Material).customProgramCacheKey();
  const plain = buildModel(vertexColourModel([weighted]));
  const plainMesh = plain.object.getObjectByProperty(
    "type",
    "Mesh",
  ) as THREE.Mesh;
  TestValidator.equals(
    "a weighted part reads its weights through its own variant",
    [
      meshes[0]!.geometry.hasAttribute("reliefWeight"),
      keyOf(meshes[0]!).includes("automovie-relief-weights"),
      meshes[1]!.geometry.hasAttribute("reliefWeight"),
      keyOf(meshes[1]!).includes("automovie-relief-weights"),
      meshes[0]!.material === meshes[1]!.material,
      keyOf(plainMesh).includes("automovie-relief-weights"),
    ],
    [true, true, false, false, false, false],
  );

  const vertex = reliefWeightVertex(THREE.ShaderLib.physical.vertexShader);
  const after = reliefWeightFragment(
    detailNormalFragment(THREE.ShaderLib.physical.fragmentShader),
  );
  TestValidator.predicate(
    "the shaders pass the weight and scale the normal map's slopes first",
    vertex.includes("vReliefWeight = reliefWeight;") &&
      after.indexOf("mapN.xy *= vReliefWeight;") >
        after.indexOf(RELIEF_WEIGHT_TARGET) &&
      after.indexOf("mapN.xy *= vReliefWeight;") <
        after.indexOf("vec3 detailN"),
  );

  const flattened = flattenInstancedModel(model);
  TestValidator.equals(
    "flattening pads a bare neighbour with ones",
    Array.from(flattened.geometry.getAttribute("reliefWeight").array),
    [0, 0.5, 1, 1, 1, 1],
  );

  const validate = (mesh: IAutoMovieMesh) =>
    validateModel({ model: vertexColourModel([mesh]) });
  const merged = mergeAutoMovieMeshes([weighted, bare]);
  TestValidator.equals(
    "the engine validates, merges, transforms and inspects the weights",
    namedFacts([
      [
        "length",
        () =>
          hasViolation(
            validate({ ...weighted, reliefWeights: [1, 1] }),
            "type",
            ".reliefWeights",
          ),
      ],
      [
        "negative",
        () =>
          hasViolation(
            validate({ ...weighted, reliefWeights: [1, -1, 1] }),
            "range",
            ".reliefWeights[1]",
          ),
      ],
      [
        "nonfinite",
        () =>
          hasViolation(
            validate({ ...weighted, reliefWeights: [1, Number.NaN, 1] }),
            "range",
            ".reliefWeights[1]",
          ),
      ],
      ["admitted", () => validate(weighted).success],
      [
        "merged",
        () =>
          JSON.stringify(merged.reliefWeights) ===
          JSON.stringify([0, 0.5, 1, 1, 1, 1]),
      ],
      [
        "transformed",
        () =>
          JSON.stringify(
            transformAutoMovieMesh(weighted, {
              translation: { x: 1, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0, w: 1 },
              scale: { x: 1, y: 1, z: 1 },
            }).reliefWeights,
          ) === JSON.stringify([0, 0.5, 1]),
      ],
      [
        "topology",
        () =>
          inspectAutoMovieMeshTopology({
            ...weighted,
            reliefWeights: [1, Number.POSITIVE_INFINITY, 1],
          }).nonFinite === 1,
      ],
    ]),
    {
      length: true,
      negative: true,
      nonfinite: true,
      admitted: true,
      merged: true,
      transformed: true,
      topology: true,
    },
  );

  const bytes = (meshes: IAutoMovieMesh[]) => {
    const one = vertexColourModel(meshes);
    const scene = sceneFixture();
    scene.nodes = [{ ...scene.nodes[0]!, model: one.id }];
    const subject = { scene, models: [one] };
    return measureAutoMovieRenderInventory({
      subject,
      mask: deriveAutoMovieSemanticMask(subject),
    }).models[0]!.geometryBytes;
  };
  TestValidator.equals(
    "the budget charges four bytes a weighted vertex",
    bytes([weighted]) - bytes([{ ...weighted, reliefWeights: undefined }]),
    12,
  );
  // an instanced mixed model is flattened: its bare vertices take ones
  const mixed = vertexColourModel([
    { ...weighted, colors: undefined },
    { ...bare, colors: undefined },
  ]);
  const inventory = (instanced: boolean) => {
    const scene = sceneFixture();
    scene.nodes = [{ ...scene.nodes[0]!, model: mixed.id }];
    scene.lights = [];
    const set = instanceSetFixture({
      id: "copies",
      count: 4,
      chunks: 1,
      model: mixed.id,
    });
    const subject = {
      scene,
      models: [mixed],
      instanceSets: instanced ? [set] : [],
      formations: [],
    };
    return measureAutoMovieRenderInventory({
      subject,
      mask: deriveAutoMovieSemanticMask(subject),
    }).models[0]!.geometryBytes;
  };
  TestValidator.equals(
    "a flattened mixed model pays ones for its bare vertices",
    inventory(true) - inventory(false),
    12,
  );
  for (const result of [flattened]) {
    result.geometry.dispose();
    for (const material of new Set(result.materials)) material.dispose();
  }
};
