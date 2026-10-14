import type { AutoMovieGuidePass } from "@automovie/interface";
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
import { namedFacts } from "../internal/predicates";

/** Construct one model placement with grid, line, point and sprite helpers. */
const sceneWithHelpers: () => {
  scene: THREE.Scene;
  nonMesh: THREE.Object3D[];
} = (): { scene: THREE.Scene; nonMesh: THREE.Object3D[] } => {
  const objects: Map<string, IAutoMovieModelObject> = new Map([
    ["model-a", buildModel({ ...createModel(), id: "model-a" })],
  ]);
  const { scene }: ReturnType<typeof buildScene> = buildScene(
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

  const grid: THREE.GridHelper = new THREE.GridHelper(10, 10); // LineSegments (isMesh falsy)
  const line: THREE.Line<
    THREE.BufferGeometry<
      THREE.NormalBufferAttributes,
      THREE.BufferGeometryEventMap
    >,
    THREE.LineBasicMaterial,
    THREE.Object3DEventMap
  > = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1, 0, 0),
    ]),
    new THREE.LineBasicMaterial(),
  );
  const points: THREE.Points<
    THREE.BufferGeometry<
      THREE.NormalBufferAttributes,
      THREE.BufferGeometryEventMap
    >,
    THREE.PointsMaterial,
    THREE.Object3DEventMap
  > = new THREE.Points(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 1, 0)]),
    new THREE.PointsMaterial(),
  );
  const sprite: THREE.Sprite<THREE.Object3DEventMap> = new THREE.Sprite(
    new THREE.SpriteMaterial(),
  );
  scene.add(grid, line, points, sprite);
  return { scene, nonMesh: [grid, line, points, sprite] };
};

const STRUCTURAL: AutoMovieGuidePass[] = [
  "depth",
  "normal",
  "outline",
  "mask",
  "pose",
];

/**
 * Structural guide passes hide existing non-mesh renderables before drawing and restore their visibility afterward. This unit reads real Three scene flags and the newly created pose overlay, without measuring rendered guide pixels.
 *
 * Scenarios:
 *
 * 1. Each structural pass hides the existing non-mesh renderables and restore makes them visible again.
 * 2. `beauty` leaves every non-mesh renderable visible (no override at all).
 * 3. Pose hides existing helpers while keeping its own subsequently added skeleton overlay visible.
 *
 * @evidence contracts/testing.md#behavioral-verification Applies each structural mode to a built scene carrying actual grid/line/point/sprite objects and restores it, then checks a newly created pose overlay separately; catches helper visibility bleeding into guides or suspension hiding the pass's own overlay.
 * @evidence contracts/testing.md#independent-expectations Original visibility flags and the fixed pre-existing helper population define expected hide/restore behavior; beauty preserves those flags and pose creates its own overlay after suspension. These object-state checks do not observe pixels or submitted draws.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts every structural mode with beauty and pre-existing visible helpers with the pose-owned overlay; initially hidden helper restoration, shader/material behavior and disposal have separate coverage obligations.
 * @evidence contracts/testing.md#execution-ownership This named synchronous entry uses existing generic model fixtures, maintained Viewer source and CPU-side native Three objects; it restores every pass and launches no renderer, browser, process or dynamic test registration.
 */
export function test_viewer_guide_pass_non_mesh(): void {
  // 1. every structural pass hides non-mesh renderables, restore returns them.
  for (const mode of STRUCTURAL) {
    const { scene, nonMesh }: ReturnType<typeof sceneWithHelpers> =
      sceneWithHelpers();
    const handle: ReturnType<typeof applyRenderMode> = applyRenderMode(
      scene,
      mode,
    );
    TestValidator.predicate(
      `${mode} hides every non-mesh renderable while applied`,
      nonMesh.every(
        (object: THREE.Object3D): boolean => object.visible === false,
      ),
    );
    handle.restore();
    TestValidator.predicate(
      `${mode} restore returns every non-mesh renderable to visible`,
      nonMesh.every(
        (object: THREE.Object3D): boolean => object.visible === true,
      ),
    );
  }

  // 2. beauty leaves non-mesh renderables visible.
  {
    const { scene, nonMesh }: ReturnType<typeof sceneWithHelpers> =
      sceneWithHelpers();
    const handle: ReturnType<typeof applyRenderMode> = applyRenderMode(
      scene,
      "beauty",
    );
    TestValidator.predicate(
      "beauty leaves every non-mesh renderable visible",
      nonMesh.every(
        (object: THREE.Object3D): boolean => object.visible === true,
      ),
    );
    handle.restore();
  }

  // 3. pose hides the scene's non-mesh renderables but keeps its own overlay.
  {
    const { scene, nonMesh }: ReturnType<typeof sceneWithHelpers> =
      sceneWithHelpers();
    const handle: ReturnType<typeof applyRenderMode> = applyRenderMode(
      scene,
      "pose",
    );
    const overlay: THREE.Object3D<THREE.Object3DEventMap> | undefined =
      scene.getObjectByName(POSE_OVERLAY_NAME);
    if (overlay === undefined) throw new Error("pose overlay must exist");
    TestValidator.predicate(
      "the pre-existing non-mesh renderables are hidden under pose",
      nonMesh.every(
        (object: THREE.Object3D): boolean => object.visible === false,
      ),
    );
    TestValidator.equals(
      "the pose skeleton overlay stays visible with its lines",
      namedFacts([
        ["overlayVisible", (): boolean => overlay.visible === true],
        ["overlayChildren", (): boolean => overlay.children.length > 0],
        [
          "overlayChildrenChild",
          (): boolean =>
            overlay.children.every(
              (child: THREE.Object3D<THREE.Object3DEventMap>): boolean =>
                child.visible === true,
            ),
        ],
      ]),
      {
        overlayVisible: true,
        overlayChildren: true,
        overlayChildrenChild: true,
      },
    );
    handle.restore();
    TestValidator.equals(
      "pose restore removes the overlay and unhides the non-mesh renderables",
      namedFacts([
        [
          "sceneGetObjectByNamePOSE_OVERLAY_NAME",
          (): boolean => scene.getObjectByName(POSE_OVERLAY_NAME) === undefined,
        ],
        [
          "nonMeshEveryObject",
          (): boolean =>
            nonMesh.every(
              (object: THREE.Object3D): boolean => object.visible === true,
            ),
        ],
      ]),
      { sceneGetObjectByNamePOSE_OVERLAY_NAME: true, nonMeshEveryObject: true },
    );
  }
}
