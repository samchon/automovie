import {
  deriveAutoMovieSemanticMask,
  inspectAutoMovieMeshTopology,
  measureAutoMovieRenderInventory,
  mergeAutoMovieMeshes,
  transformAutoMovieMesh,
  validateModel,
} from "@automovie/engine";
import type {
  IAutoMovieCompiledInstanceSet,
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieScene,
} from "@automovie/interface";
import {
  type IAutoMovieModelObject,
  RELIEF_WEIGHT_TARGET,
  buildModel,
  detailNormalFragment,
  flattenInstancedModel,
  reliefWeightFragment,
  reliefWeightVertex,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { hasViolation, namedFacts, nclose } from "../internal/predicates";
import { instanceSetFixture, sceneFixture } from "../internal/renderFixtures";
import {
  vertexColourMesh,
  vertexColourModel,
} from "../internal/vertexColourFixture";

/**
 * Relief weights survive numerical mesh operations and select a generated normal-map slope patch for weighted parts. The unit observes arrays, material variants and program text rather than GPU fragments.
 *
 * Scenarios:
 * 1. A weighted part receives a reliefWeight material variant, a bare sharing part retains the plain material and absence of a normal map leaves it unpatched.
 * 2. Generated programs pass the weight and scale normal-map slopes after their own scale but before a detail blend, including when that patch registered first.
 * 3. Instanced flattening gives a bare neighbour weights of one.
 * 4. Validation refuses wrong length, negative and nonfinite weights; merging pads bare neighbours with ones, transformation copies weights and topology counts a nonfinite entry.
 * 5. Render-budget arithmetic charges four bytes per weighted vertex, including padded bare vertices in a flattened mixed model.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds weighted/bare material variants, generates shader output, flattens/merges/transforms mesh values and measures inventory; catches missing relief attributes, wrong stage ordering, lost unit padding and omitted buffer-byte charges.
 * @evidence contracts/testing.md#independent-expectations Authored zero/half/one values, unit padding for bare vertices and four bytes per Float32 vertex define expectations; generated shader output checks supported tangent-stage composition without proving GLSL compilation or observed surface relief.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts weighted/bare shared materials and missing normal maps, detail-first composition, malformed/negative/nonfinite values and mixed instanced padding; material disposal and native pixel inspection are separate obligations.
 * @evidence contracts/testing.md#execution-ownership This named portable unit reuses the existing vertex-color and render fixtures and maintained source with CPU-side Three objects, retires flattened resources and starts no browser, GPU, process or hidden case registration.
 */
export function test_viewer_relief_weights(): void {
  const weighted: IAutoMovieMesh = {
    ...vertexColourMesh(),
    reliefWeights: [0, 0.5, 1],
  };
  const {
    colors: _colors,
    reliefWeights: _weights,
    ...bare
  }: IAutoMovieMesh = weighted;
  const model: IAutoMovieModel = vertexColourModel([weighted, bare]);
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
  const built: IAutoMovieModelObject = buildModel(
    model,
    (): THREE.Texture<unknown, THREE.TextureEventMap> => new THREE.Texture(),
  );
  const meshes: THREE.Mesh[] = [];
  built.object.traverse((one: THREE.Object3D<THREE.Object3DEventMap>): void => {
    if (one instanceof THREE.Mesh) meshes.push(one);
  });
  const keyOf: (mesh: THREE.Mesh) => string = (mesh: THREE.Mesh): string =>
    (mesh.material as THREE.Material).customProgramCacheKey();
  const plain: IAutoMovieModelObject = buildModel(
    vertexColourModel([weighted]),
  );
  const plainMesh: THREE.Mesh<
    THREE.BufferGeometry<
      THREE.NormalBufferAttributes,
      THREE.BufferGeometryEventMap
    >,
    | THREE.Material<THREE.MaterialEventMap>
    | THREE.Material<THREE.MaterialEventMap>[],
    THREE.Object3DEventMap
  > = plain.object.getObjectByProperty("type", "Mesh") as THREE.Mesh;
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

  const vertex: string = reliefWeightVertex(
    THREE.ShaderLib.physical.vertexShader,
  );
  const after: string = reliefWeightFragment(
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

  const flattened: ReturnType<typeof flattenInstancedModel> =
    flattenInstancedModel(model);
  TestValidator.predicate(
    "flattening pads a bare neighbour with ones",
    sameWeights(
      Array.from(flattened.geometry.getAttribute("reliefWeight").array),
      [0, 0.5, 1, 1, 1, 1],
    ),
  );

  const validate: (mesh: IAutoMovieMesh) => ReturnType<typeof validateModel> = (
    mesh: IAutoMovieMesh,
  ): ReturnType<typeof validateModel> =>
    validateModel({ model: vertexColourModel([mesh]) });
  const merged: IAutoMovieMesh = mergeAutoMovieMeshes([weighted, bare]);
  TestValidator.equals(
    "the engine validates, merges, transforms and inspects the weights",
    namedFacts([
      [
        "length",
        (): boolean =>
          hasViolation(
            validate({ ...weighted, reliefWeights: [1, 1] }),
            "type",
            ".reliefWeights",
          ),
      ],
      [
        "negative",
        (): boolean =>
          hasViolation(
            validate({ ...weighted, reliefWeights: [1, -1, 1] }),
            "range",
            ".reliefWeights[1]",
          ),
      ],
      [
        "nonfinite",
        (): boolean =>
          hasViolation(
            validate({ ...weighted, reliefWeights: [1, Number.NaN, 1] }),
            "range",
            ".reliefWeights[1]",
          ),
      ],
      ["admitted", (): boolean => validate(weighted).success],
      [
        "merged",
        (): boolean => sameWeights(merged.reliefWeights, [0, 0.5, 1, 1, 1, 1]),
      ],
      [
        "transformed",
        (): boolean =>
          sameWeights(
            transformAutoMovieMesh(weighted, {
              translation: { x: 1, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0, w: 1 },
              scale: { x: 1, y: 1, z: 1 },
            }).reliefWeights,
            [0, 0.5, 1],
          ),
      ],
      [
        "topology",
        (): boolean =>
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

  const bytes: (meshes: IAutoMovieMesh[]) => number = (
    meshes: IAutoMovieMesh[],
  ): number => {
    const one: IAutoMovieModel = vertexColourModel(meshes);
    const scene: IAutoMovieScene = sceneFixture();
    scene.nodes = [{ ...scene.nodes[0]!, model: one.id }];
    const subject: { scene: IAutoMovieScene; models: IAutoMovieModel[] } = {
      scene,
      models: [one],
    };
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
  const mixed: IAutoMovieModel = vertexColourModel([
    { ...weighted, colors: undefined },
    { ...bare, colors: undefined },
  ]);
  const inventory: (instanced: boolean) => number = (
    instanced: boolean,
  ): number => {
    const scene: IAutoMovieScene = sceneFixture();
    scene.nodes = [{ ...scene.nodes[0]!, model: mixed.id }];
    scene.lights = [];
    const set: IAutoMovieCompiledInstanceSet = instanceSetFixture({
      id: "copies",
      count: 4,
      chunks: 1,
      model: mixed.id,
    });
    const subject: {
      scene: IAutoMovieScene;
      models: IAutoMovieModel[];
      instanceSets: IAutoMovieCompiledInstanceSet[];
      formations: never[];
    } = {
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
}

/**
 * Compare expected per-vertex relief values without serializing floating-point arrays.
 *
 * The existing relief scenario calls this finite predicate on actual flatten/merge/transform outputs, detecting changed length or weight values.
 * Calling cases supply the authored 0/half/one values and the contract's unit padding for bare vertices; exact finite scalar comparison catches copying or padding errors without deriving expectations from the output.
 * Covers the existing weighted and mixed bare-neighbour populations; malformed/negative/nonfinite admission remains owned by the scenario's validator cases.
 * This private portable predicate belongs to the named relief unit and acquires no host, resource or hidden case; it reads only the supplied arrays.
 */
function sameWeights(
  actual: readonly number[] | undefined,
  expected: readonly number[],
): boolean {
  return (
    actual !== undefined &&
    actual.length === expected.length &&
    actual.every((weight: number, index: number): boolean =>
      nclose(weight, expected[index]!, 0),
    )
  );
}
