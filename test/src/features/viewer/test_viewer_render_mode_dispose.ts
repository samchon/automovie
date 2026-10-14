import {
  type IAutoMovieModelObject,
  POSE_OVERLAY_NAME,
  applyRenderMode,
  buildModel,
  buildScene,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { IDENTITY_TRANSFORM, createModel } from "../internal/fixtures";

const buildOneNodeScene: () => ReturnType<typeof buildScene> = (): ReturnType<
  typeof buildScene
> => {
  const objects: Map<string, IAutoMovieModelObject> = new Map([
    ["model-a", buildModel({ ...createModel(), id: "model-a" })],
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
      ],
      cameras: [],
      lights: [],
    },
    (id: string): IAutoMovieModelObject | undefined => objects.get(id),
  );
};

const meshesOf: (root: THREE.Object3D) => THREE.Mesh[] = (
  root: THREE.Object3D,
): THREE.Mesh[] => {
  const meshes: THREE.Mesh[] = [];
  root.traverse((object: THREE.Object3D<THREE.Object3DEventMap>): void => {
    if ((object as THREE.Mesh).isMesh === true)
      meshes.push(object as THREE.Mesh);
  });
  return meshes;
};

/** Attach a dispose-event spy to a material or geometry; returns the counter. */
const spyDispose: (target: THREE.Material | THREE.BufferGeometry) => {
  count: number;
} = (target: THREE.Material | THREE.BufferGeometry): { count: number } => {
  const counter: { count: number } = { count: 0 };
  target.addEventListener("dispose", (): void => {
    counter.count += 1;
  });
  return counter;
};

const materialsOf: (mesh: THREE.Mesh) => THREE.Material[] = (
  mesh: THREE.Mesh,
): THREE.Material[] =>
  Array.isArray(mesh.material) ? mesh.material : [mesh.material];

/**
 * A successful restore retires the observed override materials and pose resources once and preserves borrowed originals. Outline observes its fill materials here; shell-material retirement has no independent event assertion in this unit. Public events do not measure WebGL allocations or physical release.
 *
 * Scenarios:
 *
 * 1. Depth retires every created override once, preserves borrowed materials and repeats restore without another event.
 * 2. Outline's observed replacement fill materials retire once.
 * 3. Mask retires created flat materials, preserves originals and restores the background instance.
 * 4. Pose retires the observed line geometries and shared line material once; overlay removal is asserted by the render-modes and restoration units.
 * 5. Beauty creates no override and leaves original disposal counts at zero.
 *
 * @evidence contracts/testing.md#behavioral-verification Applies and restores actual guide modes on a built generic scene while observing real owned material/geometry dispose events; catches leaking temporary overrides, double retirement and disposal of borrowed source materials.
 * @evidence contracts/testing.md#independent-expectations Each observed temporary resource has one public retirement attempt and original borrowed owners have none; original background identity pins the mask restoration. Overlay departure and outline shell-material retirement are not independently asserted here, and public events do not prove physical WebGL allocations were freed.
 * @evidence contracts/testing.md#distinguishing-cases Covers depth/outline/mask/pose/beauty and repeated successful restoration, with source/background preservation; throwing listeners and sticky failed ownership are owned by the restoration unit.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit calls maintained source and existing generic fixtures, with event listeners on actual CPU-side Three resources rather than replaced foreign methods; it acquires no browser, GPU renderer or process.
 */
export function test_viewer_render_mode_dispose(): void {
  const { scene }: ReturnType<typeof buildScene> = buildOneNodeScene();
  const meshes: THREE.Mesh<
    THREE.BufferGeometry<
      THREE.NormalBufferAttributes,
      THREE.BufferGeometryEventMap
    >,
    | THREE.Material<THREE.MaterialEventMap>
    | THREE.Material<THREE.MaterialEventMap>[],
    THREE.Object3DEventMap
  >[] = meshesOf(scene);
  const originalSpies: { count: number }[] = meshes.flatMap(
    (
      mesh: THREE.Mesh<
        THREE.BufferGeometry<
          THREE.NormalBufferAttributes,
          THREE.BufferGeometryEventMap
        >,
        | THREE.Material<THREE.MaterialEventMap>
        | THREE.Material<THREE.MaterialEventMap>[],
        THREE.Object3DEventMap
      >,
    ): { count: number }[] => materialsOf(mesh).map(spyDispose),
  );

  // 1. depth: created disposed once, originals never, restore-twice safe.
  const depth: ReturnType<typeof applyRenderMode> = applyRenderMode(
    scene,
    "depth",
  );
  const depthSpies: { count: number }[] = meshes.flatMap(
    (
      mesh: THREE.Mesh<
        THREE.BufferGeometry<
          THREE.NormalBufferAttributes,
          THREE.BufferGeometryEventMap
        >,
        | THREE.Material<THREE.MaterialEventMap>
        | THREE.Material<THREE.MaterialEventMap>[],
        THREE.Object3DEventMap
      >,
    ): { count: number }[] => materialsOf(mesh).map(spyDispose),
  );
  depth.restore();
  TestValidator.predicate(
    "depth override materials disposed exactly once",
    depthSpies.every((spy: { count: number }): boolean => spy.count === 1),
  );
  depth.restore();
  TestValidator.predicate(
    "second restore is a no-op (no double dispose)",
    depthSpies.every((spy: { count: number }): boolean => spy.count === 1),
  );

  // 2. outline: same contract.
  const outline: ReturnType<typeof applyRenderMode> = applyRenderMode(
    scene,
    "outline",
  );
  const outlineSpies: { count: number }[] = meshes.flatMap(
    (
      mesh: THREE.Mesh<
        THREE.BufferGeometry<
          THREE.NormalBufferAttributes,
          THREE.BufferGeometryEventMap
        >,
        | THREE.Material<THREE.MaterialEventMap>
        | THREE.Material<THREE.MaterialEventMap>[],
        THREE.Object3DEventMap
      >,
    ): { count: number }[] => materialsOf(mesh).map(spyDispose),
  );
  outline.restore();
  TestValidator.predicate(
    "outline override materials disposed exactly once",
    outlineSpies.every((spy: { count: number }): boolean => spy.count === 1),
  );

  // 3. mask: created per-node materials disposed once, background restored.
  const background:
    | THREE.Color
    | THREE.Texture<unknown, THREE.TextureEventMap>
    | null = scene.background;
  const mask: ReturnType<typeof applyRenderMode> = applyRenderMode(
    scene,
    "mask",
  );
  const maskSpies: { count: number }[] = meshes.flatMap(
    (
      mesh: THREE.Mesh<
        THREE.BufferGeometry<
          THREE.NormalBufferAttributes,
          THREE.BufferGeometryEventMap
        >,
        | THREE.Material<THREE.MaterialEventMap>
        | THREE.Material<THREE.MaterialEventMap>[],
        THREE.Object3DEventMap
      >,
    ): { count: number }[] => materialsOf(mesh).map(spyDispose),
  );
  mask.restore();
  TestValidator.predicate(
    "mask materials disposed exactly once",
    maskSpies.every((spy: { count: number }): boolean => spy.count === 1),
  );
  TestValidator.predicate(
    "mask restores the background instance",
    scene.background === background,
  );

  // 4. pose: line geometries and the shared line material disposed once.
  const pose: ReturnType<typeof applyRenderMode> = applyRenderMode(
    scene,
    "pose",
  );
  const overlay: THREE.Object3D<THREE.Object3DEventMap> | undefined =
    scene.getObjectByName(POSE_OVERLAY_NAME);
  if (overlay === undefined) throw new Error("pose overlay must exist");
  const lines: THREE.Line<
    THREE.BufferGeometry<
      THREE.NormalBufferAttributes,
      THREE.BufferGeometryEventMap
    >,
    | THREE.Material<THREE.MaterialEventMap>
    | THREE.Material<THREE.MaterialEventMap>[],
    THREE.Object3DEventMap
  >[] = overlay.children as THREE.Line[];
  TestValidator.predicate(
    "pose constructed at least one line",
    lines.length > 0,
  );
  const geometrySpies: { count: number }[] = lines.map(
    (
      line: THREE.Line<
        THREE.BufferGeometry<
          THREE.NormalBufferAttributes,
          THREE.BufferGeometryEventMap
        >,
        | THREE.Material<THREE.MaterialEventMap>
        | THREE.Material<THREE.MaterialEventMap>[],
        THREE.Object3DEventMap
      >,
    ): { count: number } => spyDispose(line.geometry),
  );
  const lineMaterialSpy: { count: number } = spyDispose(
    lines[0]!.material as THREE.Material,
  );
  pose.restore();
  TestValidator.predicate(
    "pose line geometries disposed exactly once",
    geometrySpies.every((spy: { count: number }): boolean => spy.count === 1),
  );
  TestValidator.equals(
    "pose shared line material disposed exactly once",
    lineMaterialSpy.count,
    1,
  );
  pose.restore();
  TestValidator.equals(
    "pose second restore does not double-dispose",
    lineMaterialSpy.count,
    1,
  );

  // 5. Beauty leaves the original material retirement counts unchanged.
  const beauty: ReturnType<typeof applyRenderMode> = applyRenderMode(
    scene,
    "beauty",
  );
  beauty.restore();
  beauty.restore();
  TestValidator.predicate(
    "borrowed originals were never disposed by any mode",
    originalSpies.every((spy: { count: number }): boolean => spy.count === 0),
  );
}
