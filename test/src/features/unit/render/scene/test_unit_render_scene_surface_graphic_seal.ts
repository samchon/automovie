import { createPoolWater } from "@automovie/archetypes";
import type {
  IAutoMovieModel,
  IAutoMovieScene,
  IAutoMovieSurfaceGraphicTrack,
} from "@automovie/interface";
import {
  type IAutoMovieRenderModeHandle,
  type IAutoMovieSurfaceGraphicsObject,
  applyRenderMode,
  buildModel,
  buildScene,
  prepareAutoMovieSurfaceGraphics,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../../../internal/nclose";
import { renderFixtureIdentity } from "../../../internal/renderFixtureIdentity";
import { renderFixtureNode } from "../../../internal/renderFixtureNode";

/**
 * A surface graphic seals its own coverage in depth after its layers, so a
 * blended host face it lies on, a pool's water at opacity 0.42, neither dims it
 * in beauty nor holds it out of the graphics plate.
 *
 * Scenarios, on the pool water's `water` surface with a graphic of no
 * background, an opaque rect, a half-transparent rect and a feed:
 *
 * 1. Each layer that writes colour has one seal: a mesh on the same geometry whose
 *    material writes depth and no colour, after the last layer's render order,
 *    discarding below 1/510 coverage with the layer's own opacity; the
 *    background-less face, which writes no colour, has none.
 * 2. The feed's seal samples no texture, since the feed is drawn into while the
 *    scene renders, and covers its quad.
 * 3. The pool's water is a blended host: its holdout under the plate writes no
 *    depth and multiplies what lies beneath by one minus its opacity, so where
 *    the seals wrote the graphic's depth first the water's holdout is hidden.
 * 4. Under the plate's render mode every seal keeps its material, as the graphic's
 *    own layers do, and restoring the mode leaves them as they were.
 */
export async function test_unit_render_scene_surface_graphic_seal(): Promise<void> {
  const pool: IAutoMovieModel = createPoolWater({ id: "pool" });
  const scene: IAutoMovieScene = {
    id: "natatorium",
    name: null,
    nodes: [renderFixtureNode("pool-a", pool.id)],
    cameras: [
      {
        id: "deck",
        transform: renderFixtureIdentity,
        fovY: 60,
        near: 0.1,
        far: 100,
        depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 1 },
      },
    ],
    lights: [],
  } as IAutoMovieScene;
  const track: IAutoMovieSurfaceGraphicTrack = {
    node: "pool-a",
    surface: "water",
    keys: [
      {
        time: 0,
        graphic: {
          emission: { kind: "printed" },
          background: null,
          layers: [
            {
              kind: "rect",
              x: 0.1,
              y: 0.1,
              width: 0.2,
              height: 0.2,
              color: { r: 1, g: 1, b: 1, a: null, hex: null },
            },
            {
              kind: "rect",
              x: 0.5,
              y: 0.1,
              width: 0.2,
              height: 0.2,
              color: { r: 1, g: 0, b: 0, a: 0.5, hex: null },
            },
            {
              kind: "feed",
              x: 0.1,
              y: 0.5,
              width: 0.4,
              height: 0.4,
              camera: "deck",
              pixels: 16,
            },
          ],
        },
      },
    ],
  };
  const object: ReturnType<typeof buildModel> = buildModel(pool);
  const mounted: ReturnType<typeof buildScene> = buildScene(
    scene,
    (): ReturnType<typeof buildModel> => object,
  );
  const graphics: IAutoMovieSurfaceGraphicsObject =
    await prepareAutoMovieSurfaceGraphics({
      shot: { surfaceGraphics: [track], duration: 1 },
      scene,
      models: [pool],
      resolveNode: (): ReturnType<typeof buildModel> => object,
    });
  graphics.apply(0);
  const key: THREE.Object3D = object.object.getObjectByName(
    "surface-graphic:pool-a/water",
  )!.children[0]!.children[0]!;
  const meshes: THREE.Mesh[] = key.children as THREE.Mesh[];
  const [face, opaque, translucent, feed, ...seals]: THREE.Mesh[] = meshes;
  const material: (mesh: THREE.Mesh) => THREE.MeshBasicMaterial = (
    mesh: THREE.Mesh,
  ): THREE.MeshBasicMaterial => mesh.material as THREE.MeshBasicMaterial;

  // 1. One seal per colour-writing layer, after the last layer.
  const sealed: THREE.Mesh[] = [opaque!, translucent!, feed!];
  TestValidator.predicate(
    "each colour-writing layer has one depth-only seal after the last layer",
    !material(face!).colorWrite &&
      seals.length === 3 &&
      seals.every(
        (seal: THREE.Mesh, index: number): boolean =>
          seal.geometry === sealed[index]!.geometry &&
          !material(seal).colorWrite &&
          material(seal).depthWrite &&
          material(seal).transparent &&
          nclose(material(seal).alphaTest, 1 / 510, 1e-12) &&
          nclose(material(seal).opacity, material(sealed[index]!).opacity, 0) &&
          seal.renderOrder === face!.renderOrder + 4 &&
          sealed.every(
            (layer: THREE.Mesh): boolean =>
              seal.renderOrder > layer.renderOrder,
          ),
      ) &&
      nclose(material(seals[1]!).opacity, 0.5, 0),
  );

  // 2. The feed's seal samples no texture.
  TestValidator.predicate(
    "the feed's seal samples no texture",
    material(feed!).map !== null && material(seals[2]!).map === null,
  );

  // 3-4. The water's holdout and the seals under the plate.
  const water: THREE.Mesh = object.object
    .getObjectsByProperty("isMesh", true)
    .find(
      (entry: THREE.Object3D): boolean =>
        !meshes.includes(entry as THREE.Mesh) &&
        (entry as THREE.Mesh).material instanceof THREE.Material &&
        ((entry as THREE.Mesh).material as THREE.Material).transparent,
    ) as THREE.Mesh;
  const before: THREE.Material[] = seals.map(
    (seal: THREE.Mesh): THREE.Material => seal.material as THREE.Material,
  );
  const plate: IAutoMovieRenderModeHandle = applyRenderMode(
    mounted.scene,
    "graphics",
  );
  const holdout: THREE.Material = water.material as THREE.Material;
  const kept: boolean = seals.every(
    (seal: THREE.Mesh, index: number): boolean =>
      seal.material === before[index],
  );
  plate.restore();
  TestValidator.predicate(
    "the plate holds the water out by its opacity behind the seals and keeps every seal",
    !holdout.depthWrite &&
      holdout.depthTest &&
      holdout.blendDst === THREE.OneMinusSrcAlphaFactor &&
      nclose(holdout.opacity, 0.42) &&
      kept &&
      seals.every(
        (seal: THREE.Mesh, index: number): boolean =>
          seal.material === before[index],
      ),
  );
  graphics.dispose();
}
