import { deriveAutoMovieSemanticMask } from "@automovie/engine";
import { IAutoMovieScene, IAutoMovieSpace } from "@automovie/interface";
import {
  SPACE_GROUP_NAME,
  applyAutoMovieSemanticMask,
  applyRenderMode,
  auditAutoMovieSemanticMaskScene,
  buildModel,
  buildScene,
  buildSpaceObject,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { IDENTITY_TRANSFORM, createModel } from "../internal/fixtures";
import { namedFacts } from "../internal/predicates";

const SPACE: IAutoMovieSpace = {
  id: "space-1",
  surfaces: [
    {
      id: "floor",
      kind: "floor",
      polygon: [
        { x: -2, y: 0, z: -1 },
        { x: 2, y: 0, z: -1 },
        { x: 2, y: 0, z: 1 },
        { x: -2, y: 0, z: 1 },
      ],
    },
  ],
  walkable: ["floor"],
};

const DESIGN: IAutoMovieScene = {
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
  space: SPACE,
};

/** The one support-patch mesh in a freshly built copy of the design. */
const built: () => { scene: THREE.Scene; patch: THREE.Mesh } = (): {
  scene: THREE.Scene;
  patch: THREE.Mesh;
} => {
  const scene: THREE.Scene<THREE.Object3DEventMap> = buildScene(
    DESIGN,
    (): import("@automovie/viewer").IAutoMovieModelObject =>
      buildModel({ ...createModel(), id: "model-a" }),
  ).scene;
  return {
    scene,
    patch: scene.getObjectByName(SPACE_GROUP_NAME)!.children[0] as THREE.Mesh,
  };
};

/**
 * Exercises semantic support material write flags and reversible structural material installation.
 *
 * Scenarios:
 * 1. Direct and embedded support materials disable beauty writes while model materials retain color/depth writes.
 * 2. Depth, normal, outline and legacy mask install structural materials and repeated restore retains the original reference.
 * 3. Semantic audit/painting counts graph membership and restores support material.
 * 4. Beauty leaves that nonwriting support material installed.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls direct space/scene builders, the existing depth/normal/outline/mask modes, semantic audit/paint and healthy beauty; checks flags, membership counts and material identities.
 * @evidence contracts/testing.md#independent-expectations Authored support versus model roles define independent color/depth-write expectations; audit counts establish graph membership, not submitted or visible pixels.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts direct/embedded support, model materials, depth/normal/outline/legacy/semantic mask, repeated restore and beauty retaining the nonwriting support material.
 * @evidence contracts/testing.md#execution-ownership The named portable entry owns CPU Three graphs and pass handles, restores every installed pass and makes no browser, native renderer or physical-floor observation.
 */
export function test_viewer_space_ground_beauty(): void {
  const direct: { scene: THREE.Scene; patch: THREE.Mesh } = built();
  const beautyMaterial: THREE.Material<THREE.MaterialEventMap> = direct.patch
    .material as THREE.Material;
  const embeddedPatch: THREE.Mesh<
    THREE.BufferGeometry<
      THREE.NormalBufferAttributes,
      THREE.BufferGeometryEventMap
    >,
    | THREE.Material<THREE.MaterialEventMap>
    | THREE.Material<THREE.MaterialEventMap>[],
    THREE.Object3DEventMap
  > = buildSpaceObject(SPACE).children[0] as THREE.Mesh;
  const embeddedMaterial: THREE.Material<THREE.MaterialEventMap> =
    embeddedPatch.material as THREE.Material;
  const modelMaterials: THREE.Material[] = [];
  direct.scene
    .getObjectByName("node-a")!
    .traverse((object: THREE.Object3D<THREE.Object3DEventMap>): void => {
      if ((object as THREE.Mesh).isMesh === true)
        modelMaterials.push((object as THREE.Mesh).material as THREE.Material);
    });
  TestValidator.equals(
    "only authored geometry retains beauty color/depth write flags",
    namedFacts([
      ["the space contributed a patch", (): true => direct.patch.isMesh],
      [
        "the patch writes no beauty colour",
        (): boolean => !beautyMaterial.colorWrite,
      ],
      [
        "the patch writes no beauty depth",
        (): boolean => !beautyMaterial.depthWrite,
      ],
      [
        "a directly embedded patch writes neither",
        (): boolean =>
          !embeddedMaterial.colorWrite && !embeddedMaterial.depthWrite,
      ],
      [
        "the model contributed meshes",
        (): boolean => modelMaterials.length > 0,
      ],
      [
        "authored meshes still write colour and depth",
        (): boolean =>
          modelMaterials.every(
            (material: THREE.Material<THREE.MaterialEventMap>): boolean =>
              material.colorWrite && material.depthWrite,
          ),
      ],
    ]),
    {
      "the space contributed a patch": true,
      "the patch writes no beauty colour": true,
      "the patch writes no beauty depth": true,
      "a directly embedded patch writes neither": true,
      "the model contributed meshes": true,
      "authored meshes still write colour and depth": true,
    },
  );

  for (const mode of ["depth", "normal", "outline", "mask"] as const) {
    const handle: import("@automovie/viewer").IAutoMovieRenderModeHandle =
      applyRenderMode(direct.scene, mode);
    TestValidator.predicate(
      `${mode} gives the support patch a structural material`,
      direct.patch.material !== beautyMaterial,
    );
    handle.restore();
    handle.restore();
    TestValidator.predicate(
      `${mode} restores the exact non-beauty material`,
      direct.patch.material === beautyMaterial,
    );
  }

  const mask: import("@automovie/interface").IAutoMovieSemanticMask =
    deriveAutoMovieSemanticMask({ scene: DESIGN, models: [] });
  TestValidator.equals(
    "semantic audit resolves the support patch without beauty participation",
    auditAutoMovieSemanticMaskScene({
      scene: direct.scene,
      design: DESIGN,
      mask,
    }),
    { unresolved: [], unaddressed: 0 },
  );
  const semantic: import("@automovie/viewer").IAutoMovieSemanticMaskHandle =
    applyAutoMovieSemanticMask({
      scene: direct.scene,
      design: DESIGN,
      mask,
    });
  TestValidator.equals(
    "direct semantic masking paints the support patch",
    {
      materialChanged: direct.patch.material !== beautyMaterial,
      painted: semantic.painted,
      unaddressed: semantic.unaddressed,
      unresolved: semantic.unresolved,
    },
    { materialChanged: true, painted: 2, unaddressed: 0, unresolved: [] },
  );
  semantic.restore();
  semantic.restore();
  TestValidator.predicate(
    "semantic restore returns the exact non-beauty material",
    direct.patch.material === beautyMaterial,
  );

  const beauty: import("@automovie/viewer").IAutoMovieRenderModeHandle =
    applyRenderMode(direct.scene, "beauty");
  TestValidator.predicate(
    "beauty leaves the non-writing material in place",
    direct.patch.material === beautyMaterial &&
      !beautyMaterial.colorWrite &&
      !beautyMaterial.depthWrite,
  );
  beauty.restore();
}
