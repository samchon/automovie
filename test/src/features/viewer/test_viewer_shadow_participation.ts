import { IAutoMovieSpace } from "@automovie/interface";
import {
  SPACE_GROUP_NAME,
  applyAutoMovieShadowParticipation,
  buildModel,
  buildScene,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import type * as THREE from "three";

import { IDENTITY_TRANSFORM, createModel } from "../internal/fixtures";
import { namedFacts } from "../internal/predicates";

const FLOOR_POLYGON: { x: number; y: number; z: number; }[] = [
  { x: -2, y: 0, z: -1 },
  { x: 2, y: 0, z: -1 },
  { x: 2, y: 0, z: 1 },
  { x: -2, y: 0, z: 1 },
];

const SPACE: IAutoMovieSpace = {
  id: "space-1",
  surfaces: [{ id: "floor", kind: "floor", polygon: FLOOR_POLYGON }],
  walkable: ["floor"],
};

const sceneOf: () => THREE.Scene<THREE.Object3DEventMap> = (): THREE.Scene<THREE.Object3DEventMap> =>
  buildScene(
    {
      id: "scene-1",
      name: null,
      nodes: [
        {
          id: "node-a",
          model: "model-a",
          transform: IDENTITY_TRANSFORM,
          motion: null,
          pose: null,
        },
      ],
      cameras: [],
      lights: [
        {
          id: "sun",
          type: "directional",
          transform: IDENTITY_TRANSFORM,
          color: { r: 1, g: 1, b: 1, a: null, hex: null },
          intensity: 1,
          castShadow: true,
        },
      ],
      space: SPACE,
    },
    (): import("../../../../packages/viewer/src/IAutoMovieModelObject").IAutoMovieModelObject => buildModel({ ...createModel(), id: "model-a" }),
  ).scene;

/** Every mesh under one object, in traversal order. */
const meshesUnder: (root: THREE.Object3D) => THREE.Mesh[] = (root: THREE.Object3D): THREE.Mesh[] => {
  const out: THREE.Mesh[] = [];
  root.traverse((object: THREE.Object3D<THREE.Object3DEventMap>): void => {
    if ((object as THREE.Mesh).isMesh === true) out.push(object as THREE.Mesh);
  });
  return out;
};

/**
 * Exercises the object-role shadow flags of a built scene and a later host-added mesh.
 *
 * Scenarios:
 * 1. Built model meshes cast and receive shadows by their CPU participation flags.
 * 2. Semantic support meshes neither cast nor receive by those flags.
 * 3. Grid, line, points and sprite nodes retain their excluded flags.
 * 4. A later mesh receives participation while reapplication preserves prior model flags.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual model/scene builders and participation projection, checking mesh flags, semantic support exclusion and nonmesh state before and after reapplication.
 * @evidence contracts/testing.md#independent-expectations Authored model/support roles and separately retained pre-pass flags define expectations; flags alone do not certify submitted shadows, pixels or GPU depth storage.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts model/support meshes, grid/line/points/sprite nodes, a late mesh and an unchanged second projection so blanket Object3D marking fails.
 * @evidence contracts/testing.md#execution-ownership The named entry owns actual CPU Three graphs and existing portable model inputs; it creates no native renderer/browser, captures no production image and replaces no foreign method.
 */
export async function test_viewer_shadow_participation(): Promise<void> {
  const THREE: typeof import("three") = await import("three");
  const scene: THREE.Scene<THREE.Object3DEventMap> = sceneOf();
  const ground: THREE.Object3D<THREE.Object3DEventMap> = scene.getObjectByName(SPACE_GROUP_NAME)!;
  const groundMeshes: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>[] = meshesUnder(ground);
  const nodeMeshes: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>[] = meshesUnder(scene.getObjectByName("node-a")!);

  TestValidator.equals(
    "solids cast and receive while a support patch participates in neither",
    namedFacts([
      ["the model contributed meshes", (): boolean => nodeMeshes.length > 0],
      [
        "and every one of them casts",
        (): boolean => nodeMeshes.every((mesh: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>): boolean => mesh.castShadow === true),
      ],
      [
        "and receives",
        (): boolean => nodeMeshes.every((mesh: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>): boolean => mesh.receiveShadow === true),
      ],
      ["the space contributed a patch", (): boolean => groundMeshes.length > 0],
      // The whole distinction in one assertion. A blanket rule passes every other fact in this case and fails this one.
      [
        "which receives nothing",
        (): boolean => groundMeshes.every((mesh: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>): boolean => mesh.receiveShadow === false),
      ],
      [
        "and casts nothing",
        (): boolean => groundMeshes.every((mesh: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>): boolean => mesh.castShadow === false),
      ],
    ]),
    {
      "the model contributed meshes": true,
      "and every one of them casts": true,
      "and receives": true,
      "the space contributed a patch": true,
      "which receives nothing": true,
      "and casts nothing": true,
    },
  );

  const grid: THREE.GridHelper = new THREE.GridHelper(10, 10);
  const line: THREE.Line<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.LineBasicMaterial, THREE.Object3DEventMap> = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1, 0, 0),
    ]),
    new THREE.LineBasicMaterial(),
  );
  const points: THREE.Points<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.PointsMaterial, THREE.Object3DEventMap> = new THREE.Points(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 1, 0)]),
    new THREE.PointsMaterial(),
  );
  const sprite: THREE.Sprite<THREE.Object3DEventMap> = new THREE.Sprite(new THREE.SpriteMaterial());
  const late: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial, THREE.Object3DEventMap> = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial(),
  );
  scene.add(grid, line, points, sprite, late);

  const before: string[] = nodeMeshes.map(
    (mesh: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>): string => `${String(mesh.castShadow)}/${String(mesh.receiveShadow)}`,
  );
  applyAutoMovieShadowParticipation(scene);
  const after: string[] = nodeMeshes.map(
    (mesh: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>): string => `${String(mesh.castShadow)}/${String(mesh.receiveShadow)}`,
  );

  TestValidator.equals(
    "non-mesh renderables stay out of it, and a second pass is a no-op",
    namedFacts([
      [
        "a grid, line, point cloud and sprite neither cast nor receive",
        (): boolean =>
          [grid, line, points, sprite].every(
            (object: THREE.Sprite<THREE.Object3DEventMap> | THREE.Line<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.LineBasicMaterial, THREE.Object3DEventMap> | THREE.Points<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.PointsMaterial, THREE.Object3DEventMap>): boolean =>
              object.castShadow === false && object.receiveShadow === false,
          ),
      ],
      // A host assembling its own graph adds meshes after `buildScene` has returned, so the pass has to be callable rather than only internal.
      ["a mesh added afterwards casts", (): boolean => late.castShadow === true],
      ["and receives", (): boolean => late.receiveShadow === true],
      [
        "and the second pass changed nothing",
        (): boolean => after.join() === before.join(),
      ],
    ]),
    {
      "a grid, line, point cloud and sprite neither cast nor receive": true,
      "a mesh added afterwards casts": true,
      "and receives": true,
      "and the second pass changed nothing": true,
    },
  );
}
