import {
  type IAutoMovieModelObject,
  DEPTH_NORMALIZATION_RANGE,
  EDGE_SHELL_NAME,
  EDGE_WIDTH,
  POSE_OVERLAY_NAME,
  applyRenderMode,
  buildModel,
  buildScene,
  maskColor,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { IDENTITY_TRANSFORM, createModel } from "../internal/fixtures";
import { namedFacts, nclose, throwsError } from "../internal/predicates";

const buildTwoNodeScene: () => ReturnType<typeof buildScene> = (): ReturnType<typeof buildScene> => {
  const objects: Map<string, IAutoMovieModelObject> = new Map([
    ["model-a", buildModel({ ...createModel(), id: "model-a" })],
    ["model-b", buildModel({ ...createModel(), id: "model-b" })],
  ]);
  return buildScene(
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
        {
          id: "node-b",
          model: "model-b",
          transform: IDENTITY_TRANSFORM,
          motion: null,
          pose: null,
        },
      ],
      cameras: [],
      lights: [],
    },
    (id: string): IAutoMovieModelObject | undefined => objects.get(id),
  );
};

const meshesOf: (root: THREE.Object3D) => THREE.Mesh[] = (root: THREE.Object3D): THREE.Mesh[] => {
  const meshes: THREE.Mesh[] = [];
  root.traverse((object: THREE.Object3D<THREE.Object3DEventMap>): void => {
    if ((object as THREE.Mesh).isMesh === true)
      meshes.push(object as THREE.Mesh);
  });
  return meshes;
};

/**
 * Guide modes temporarily override native scene materials, visibility, background and overlays, then restore their borrowed state. The assertions read CPU-side scene state and generated shader programs, without capturing pixels or compiling GLSL.
 *
 * Scenarios:
 *
 * 1. `beauty` is a no-op: materials keep their exact instances.
 * 2. Depth installs the normalized-metric depth program with a default or supplied range and black background; restore returns the original materials and background.
 * 3. `normal` swaps to `MeshNormalMaterial` (the surface-normal hint, #1166).
 * 4. Outline installs black fills and back-face shells with the selected edge width and skinning program chunks; restore removes them. Program text is observed, not native shader compilation.
 * 5. Mask assigns deterministic flat node colors on black and restores materials and background.
 * 6. Pose hides meshes and adds bone-to-child lines in a named overlay; restore removes it and unhides the meshes.
 * 7. An unknown mode is a caller bug and throws.
 *
 * @evidence contracts/testing.md#behavioral-verification Applies each actual guide mode to a generic built scene and an InstancedMesh, reading temporary materials, generated shader fields, overlays and restored state; catches omitted instancing/skinning support and overrides left on borrowed sources.
 * @evidence contracts/testing.md#independent-expectations Supported mode classes, authored depth/edge values, original object identities and the fixture's 22 bone edges define expectations. The public mask palette is a delegation reference, while shader strings and CPU fields do not establish observed guide pixels.
 * @evidence contracts/testing.md#distinguishing-cases Covers beauty, default/custom depth and edge width, normal, per-node mask distinction, pose hide/overlay/restoration and unknown-mode refusal; failure retirement and scene atmosphere have separate units.
 * @evidence contracts/testing.md#execution-ownership This named portable unit calls maintained Viewer source and existing generic fixtures with real CPU-side Three graph/material objects, restores every temporary pass and starts no renderer, browser or process.
 */
export function test_viewer_render_modes(): void {
  const { scene }: ReturnType<typeof buildScene> = buildTwoNodeScene();
  const instances: THREE.InstancedMesh<THREE.BoxGeometry, THREE.MeshBasicMaterial, THREE.Object3DEventMap> = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial(),
    2,
  );
  instances.setMatrixAt(0, new THREE.Matrix4().makeTranslation(-2, 0, 0));
  instances.setMatrixAt(1, new THREE.Matrix4().makeTranslation(2, 0, 0));
  scene.add(instances);
  const meshes: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>[] = meshesOf(scene);
  const originals: (THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[])[] = meshes.map((mesh: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>): THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[] => mesh.material);

  const beauty: ReturnType<typeof applyRenderMode> = applyRenderMode(scene, "beauty");
  TestValidator.predicate(
    "beauty leaves material instances untouched",
    meshes.every((mesh: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>, i: number): boolean => mesh.material === originals[i]),
  );
  beauty.restore();

  const backgroundBefore: THREE.Color | THREE.Texture<unknown, THREE.TextureEventMap> | null = scene.background;
  const depth: ReturnType<typeof applyRenderMode> = applyRenderMode(scene, "depth");
  TestValidator.predicate(
    "depth swaps every mesh to the normalized-metric shader",
    meshes.every(
      (mesh: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>): boolean =>
        mesh.material instanceof THREE.ShaderMaterial &&
        nclose(mesh.material.uniforms.depthRange!.value as number,
          DEPTH_NORMALIZATION_RANGE, 0) &&
        mesh.material.fragmentShader.includes("vViewZ / depthRange") &&
        mesh.material.vertexShader.includes("instanceMatrix"),
    ),
  );
  TestValidator.predicate(
    "the generated depth program includes its skinning chunk",
    meshes.every(
      (mesh: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>): boolean =>
        mesh.material instanceof THREE.ShaderMaterial &&
        mesh.material.vertexShader.includes("skinning_vertex"),
    ),
  );
  TestValidator.equals(
    "depth installs a black background",
    namedFacts([
      [
        "sceneBackgroundInstanceof",
        (): boolean => scene.background instanceof THREE.Color,
      ],
      [
        "sceneBackgroundGetHex",
        (): boolean =>
          scene.background instanceof THREE.Color &&
          scene.background.getHex() === 0x000000,
      ],
    ]),
    { sceneBackgroundInstanceof: true, sceneBackgroundGetHex: true },
  );
  depth.restore();
  TestValidator.predicate(
    "depth restore returns the original instances",
    meshes.every((mesh: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>, i: number): boolean => mesh.material === originals[i]),
  );
  TestValidator.equals(
    "depth restore returns the background",
    scene.background,
    backgroundBefore,
  );

  const customRange: ReturnType<typeof applyRenderMode> = applyRenderMode(scene, "depth", { depthRange: 8 });
  TestValidator.predicate(
    "an explicit depthRange overrides the default",
    meshes.every(
      (mesh: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>): boolean =>
        mesh.material instanceof THREE.ShaderMaterial &&
        nclose(mesh.material.uniforms.depthRange!.value as number, 8, 0),
    ),
  );
  customRange.restore();

  const normal: ReturnType<typeof applyRenderMode> = applyRenderMode(scene, "normal");
  TestValidator.predicate(
    "normal swaps to the surface-normal material",
    meshes.every((mesh: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>): boolean => mesh.material instanceof THREE.MeshNormalMaterial),
  );
  normal.restore();

  const outlineBackground: THREE.Color | THREE.Texture<unknown, THREE.TextureEventMap> | null = scene.background;
  const outline: ReturnType<typeof applyRenderMode> = applyRenderMode(scene, "outline");
  TestValidator.predicate(
    "outline fills every mesh black",
    meshes.every(
      (mesh: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>): boolean =>
        mesh.material instanceof THREE.MeshBasicMaterial &&
        mesh.material.color.getHex() === 0x000000,
    ),
  );
  const shells: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>[] = meshesOf(scene).filter((m: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>): boolean => m.name === EDGE_SHELL_NAME);
  TestValidator.equals(
    "outline adds one inverted-hull shell per mesh",
    shells.length,
    meshes.length,
  );
  TestValidator.predicate(
    "shells push outward by the metric edge width, back-face, skinned-aware",
    shells.every(
      (shell: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>): boolean =>
        shell.material instanceof THREE.ShaderMaterial &&
        shell.material.side === THREE.BackSide &&
        nclose(shell.material.uniforms.edgeWidth!.value as number, EDGE_WIDTH, 0) &&
        shell.material.vertexShader.includes("skinning_vertex") &&
        shell.material.vertexShader.includes("instanceMatrix"),
    ),
  );
  TestValidator.equals(
    "outline installs a black background",
    namedFacts([
      [
        "sceneBackgroundInstanceof",
        (): boolean => scene.background instanceof THREE.Color,
      ],
      [
        "sceneBackgroundGetHex",
        (): boolean =>
          scene.background instanceof THREE.Color &&
          scene.background.getHex() === 0x000000,
      ],
    ]),
    { sceneBackgroundInstanceof: true, sceneBackgroundGetHex: true },
  );
  outline.restore();
  TestValidator.equals(
    "outline restore removes shells and returns materials and background",
    namedFacts([
      [
        "meshesOfSceneM",
        (): boolean => meshesOf(scene).every((m: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>): boolean => m.name !== EDGE_SHELL_NAME),
      ],
      [
        "meshesMeshI",
        (): boolean => meshes.every((mesh: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>, i: number): boolean => mesh.material === originals[i]),
      ],
      [
        "sceneBackgroundOutlineBackground",
        (): boolean => scene.background === outlineBackground,
      ],
    ]),
    {
      meshesOfSceneM: true,
      meshesMeshI: true,
      sceneBackgroundOutlineBackground: true,
    },
  );

  const wideEdge: ReturnType<typeof applyRenderMode> = applyRenderMode(scene, "outline", { edgeWidth: 0.05 });
  TestValidator.predicate(
    "an explicit edgeWidth overrides the default",
    meshesOf(scene)
      .filter((m: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>): boolean => m.name === EDGE_SHELL_NAME)
      .every(
        (shell: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>): boolean =>
          shell.material instanceof THREE.ShaderMaterial &&
          nclose(shell.material.uniforms.edgeWidth!.value as number, 0.05, 0),
      ),
  );
  wideEdge.restore();

  const background: THREE.Color | THREE.Texture<unknown, THREE.TextureEventMap> | null = scene.background;
  const mask: ReturnType<typeof applyRenderMode> = applyRenderMode(scene, "mask");
  const maskMaterials: THREE.MeshBasicMaterial[] = meshes.map(
    (mesh: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>): THREE.MeshBasicMaterial => mesh.material as THREE.MeshBasicMaterial,
  );
  TestValidator.predicate(
    "mask uses flat unlit materials",
    maskMaterials.every(
      (material: THREE.MeshBasicMaterial): boolean => material instanceof THREE.MeshBasicMaterial,
    ),
  );
  TestValidator.predicate(
    "mask colors differ between the two nodes",
    maskMaterials[0]!.color.getHex() !== maskMaterials[1]!.color.getHex(),
  );
  TestValidator.equals(
    "mask palette is deterministic by node index",
    maskMaterials[0]!.color.getHex(),
    maskColor(0).getHex(),
  );
  TestValidator.equals(
    "mask blacks out the background",
    (scene.background as THREE.Color).getHex(),
    0x000000,
  );
  mask.restore();
  TestValidator.equals(
    "mask restore returns materials and background",
    namedFacts([
      [
        "meshesEveryMesh",
        (): boolean => meshes.every((mesh: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>, i: number): boolean => mesh.material === originals[i]),
      ],
      ["sceneBackgroundBackground", (): boolean => scene.background === background],
    ]),
    { meshesEveryMesh: true, sceneBackgroundBackground: true },
  );

  const pose: ReturnType<typeof applyRenderMode> = applyRenderMode(scene, "pose");
  TestValidator.predicate(
    "pose hides every mesh",
    meshes.every((mesh: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>): boolean => mesh.visible === false),
  );
  const overlay: THREE.Object3D<THREE.Object3DEventMap> | undefined = scene.getObjectByName(POSE_OVERLAY_NAME);
  if (overlay === undefined) throw new Error("pose overlay must exist");
  TestValidator.equals(
    "one line per bone with a bone parent, per node",
    overlay.children.length,
    22,
  );
  pose.restore();
  TestValidator.equals(
    "pose restore removes the overlay and unhides",
    namedFacts([
      [
        "sceneGetObjectByNamePOSE_OVERLAY_NAME",
        (): boolean => scene.getObjectByName(POSE_OVERLAY_NAME) === undefined,
      ],
      ["meshesEveryMesh", (): boolean => meshes.every((mesh: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>): boolean => mesh.visible === true)],
    ]),
    { sceneGetObjectByNamePOSE_OVERLAY_NAME: true, meshesEveryMesh: true },
  );

  TestValidator.predicate(
    "unknown mode throws",
    throwsError(
      (): ReturnType<typeof applyRenderMode> => applyRenderMode(scene, "sketch" as never),
      'unknown render mode "sketch"',
    ),
  );
}
