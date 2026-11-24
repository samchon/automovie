import { createDevice } from "@automovie/archetypes";
import type {
  IAutoMovieModel,
  IAutoMovieScene,
  IAutoMovieSurfaceGraphicTrack,
} from "@automovie/interface";
import {
  AUTOMOVIE_GUIDE_PASSES,
  type IAutoMovieRenderModeHandle,
  type IAutoMovieSurfaceGraphicsObject,
  applyRenderMode,
  buildModel,
  buildScene,
  prepareAutoMovieSurfaceGraphics,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { renderFixtureNode } from "../internal/renderFixtureNode";

/**
 * The `graphics` pass draws surface graphics as beauty does and holds every
 * other mesh out as depth only, over no backdrop.
 *
 * Scenarios:
 *
 * 1. `graphics` is a listed guide pass.
 * 2. Under the pass, the phone's graphic meshes keep their beauty materials, and
 *    every other opaque mesh, the phone's case included, takes a material that
 *    writes depth but no colour, so an occluder still hides the screen.
 * 3. A mesh `buildModel` bound with a dual-quaternion skin holds out on a holdout
 *    of its own that carries the skinning patch, so it occludes where beauty
 *    draws it; a plain mesh's holdout carries no such patch.
 * 4. The scene's backdrop is removed and its fog kept.
 * 5. Restoring the pass puts back every material, the backdrop and the fog.
 * 6. A blended glass mesh of opacity 0.15, such as a lantern globe before a
 *    screen, holds out only its opacity: its holdout writes no depth and blends
 *    with a zero source and a one-minus-source-alpha destination at alpha 0.15,
 *    so a graphic seen through it keeps 0.85 of its coverage, as beauty shows
 *    it through the glass.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the pass membership, material, skinning, backdrop and restore facts the test pins.
 * @evidence contracts/development/testing.md#behavioral-verification Applies the pass through applyRenderMode to a mounted phone with a prepared graphic and reads materials, background and fog.
 * @evidence contracts/development/testing.md#independent-expectations The pass rules come from issue #4100: graphics as in beauty, everything else depth-only, transparent background; the skinning rule is applyRenderMode's, that every pass which swaps a material carries a mesh's deformation onto the replacement.
 * @evidence contracts/development/testing.md#distinguishing-cases A case drawn in colour, a glass held out as opaque, a graphic replaced, a skin held out without its skinning patch or sharing one holdout, a black backdrop or a lost fog fails. Alpha readback and the occluder's half-screen matte need a WebGL host and belong to the visual check.
 * @evidence contracts/development/testing.md#execution-ownership In-memory Three scene graph; no renderer.
 */
export async function test_render_graphics_plate(): Promise<void> {
  TestValidator.predicate(
    "graphics is a guide pass",
    AUTOMOVIE_GUIDE_PASSES.includes("graphics"),
  );
  const phone: IAutoMovieModel = createDevice({ id: "phone", kind: "phone" });
  const scene: IAutoMovieScene = {
    id: "desk",
    name: null,
    nodes: [renderFixtureNode("phone-a", phone.id)],
    cameras: [],
    lights: [],
  };
  const object: ReturnType<typeof buildModel> = buildModel(phone);
  const mounted: ReturnType<typeof buildScene> = buildScene(
    scene,
    (): ReturnType<typeof buildModel> => object,
  );
  const tracks: IAutoMovieSurfaceGraphicTrack[] = [
    {
      node: "phone-a",
      surface: "screen",
      keys: [
        {
          time: 0,
          graphic: {
            emission: { kind: "emissive", luminance: 200 },
            background: { r: 0.1, g: 0.1, b: 0.1, a: null, hex: null },
            layers: [],
          },
        },
      ],
    },
  ];
  const graphics: IAutoMovieSurfaceGraphicsObject =
    await prepareAutoMovieSurfaceGraphics({
      shot: { surfaceGraphics: tracks, duration: 1 },
      scene,
      models: [phone],
      resolveNode: (): ReturnType<typeof buildModel> => object,
    });
  graphics.apply(0);
  const fog: THREE.Fog = new THREE.Fog(0x808080, 1, 30);
  const backdrop: THREE.Color = new THREE.Color(0x203040);
  mounted.scene.fog = fog;
  mounted.scene.background = backdrop;
  const graphicMeshes: Set<THREE.Object3D> = new Set();
  object.object
    .getObjectByName("surface-graphic:phone-a/screen")!
    .traverse((entry: THREE.Object3D): void => {
      if ((entry as THREE.Mesh).isMesh === true) graphicMeshes.add(entry);
    });
  const before: Map<THREE.Mesh, THREE.Material | THREE.Material[]> = new Map();
  mounted.scene.traverse((entry: THREE.Object3D): void => {
    if ((entry as THREE.Mesh).isMesh === true)
      before.set(entry as THREE.Mesh, (entry as THREE.Mesh).material);
  });

  // A dual-quaternion skin as buildModel marks one, and a second plain mesh.
  const skinned: THREE.Mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.1),
    new THREE.MeshStandardMaterial(),
  );
  skinned.userData.automovieDualQuaternionSkinning = true;
  const plain: THREE.Mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.1),
    new THREE.MeshStandardMaterial(),
  );
  // A blended glass, as buildModel draws a blend material, before the screen.
  const glass: THREE.Mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.1),
    new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.15 }),
  );
  mounted.scene.add(skinned, plain, glass);
  before.set(skinned, skinned.material);
  before.set(plain, plain.material);

  const handle: IAutoMovieRenderModeHandle = applyRenderMode(
    mounted.scene,
    "graphics",
  );
  const skinnedHoldout: THREE.Material = skinned.material as THREE.Material;
  const plainHoldout: THREE.Material = plain.material as THREE.Material;
  TestValidator.predicate(
    "a dual-quaternion skin holds out with its skinning patch, on a holdout of its own",
    skinnedHoldout !== plainHoldout &&
      skinnedHoldout
        .customProgramCacheKey()
        .includes("automovie-dual-quaternion-skinning") &&
      !plainHoldout
        .customProgramCacheKey()
        .includes("automovie-dual-quaternion-skinning"),
  );
  let graphicsKept: boolean = true;
  let othersHeldOut: boolean = true;
  const glassHoldout: THREE.Material = glass.material as THREE.Material;
  TestValidator.predicate(
    "a blended glass holds out only its opacity and writes no depth",
    glassHoldout.depthWrite === false &&
      glassHoldout.transparent === true &&
      glassHoldout.opacity === 0.15 &&
      glassHoldout.blending === THREE.CustomBlending &&
      glassHoldout.blendEquation === THREE.AddEquation &&
      glassHoldout.blendSrc === THREE.ZeroFactor &&
      glassHoldout.blendDst === THREE.OneMinusSrcAlphaFactor &&
      glassHoldout.blendSrcAlpha === THREE.ZeroFactor &&
      glassHoldout.blendDstAlpha === THREE.OneMinusSrcAlphaFactor,
  );
  for (const [mesh, material] of before) {
    if (graphicMeshes.has(mesh)) graphicsKept &&= mesh.material === material;
    else if (mesh !== glass)
      othersHeldOut &&=
        (mesh.material as THREE.Material).colorWrite === false &&
        (mesh.material as THREE.Material).depthWrite === true;
  }
  TestValidator.predicate("graphics keep their beauty materials", graphicsKept);
  TestValidator.predicate("every other mesh writes depth only", othersHeldOut);
  TestValidator.predicate(
    "no backdrop, fog kept",
    mounted.scene.background === null && mounted.scene.fog === fog,
  );
  handle.restore();
  TestValidator.predicate(
    "restore puts everything back",
    [...before].every(
      ([mesh, material]: [
        THREE.Mesh,
        THREE.Material | THREE.Material[],
      ]): boolean => mesh.material === material,
    ) &&
      mounted.scene.background === backdrop &&
      mounted.scene.fog === fog,
  );
  graphics.dispose();
}
