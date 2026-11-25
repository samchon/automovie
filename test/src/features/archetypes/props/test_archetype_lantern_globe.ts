import { createLight } from "@automovie/archetypes";
import type {
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieScene,
} from "@automovie/interface";
import {
  applyAutoMovieShadowParticipation,
  buildModel,
  buildScene,
  prepareAutoMovieFlames,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { renderFixtureNode } from "../../internal/renderFixtureNode";

/**
 * A lantern's globe is blended low-opacity glass that casts no shadow, and the
 * flame inside it draws before it.
 *
 * Scenarios:
 *
 * 1. The `globe` part's material blends at the producer's estimated opacity, 0.15,
 *    below one and above zero.
 * 2. Built and given shadow participation, the globe receives but casts no shadow,
 *    while the fount still casts.
 * 3. A flame at the lantern's `light` frame takes render order −1, below the
 *    globe's 0, so three.js sorts it first in the transparent list and the
 *    globe's tint blends over it from every view.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the globe material, the shadow flags and the draw order the test pins.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the lantern archetype, its render model and a flame, and reads the material, the shadow flags and the render orders.
 * @evidence contracts/development/testing.md#independent-expectations The opacity is the producer's named estimate; the draw order follows three.js sorting transparent objects by render order before distance.
 * @evidence contracts/development/testing.md#distinguishing-cases An opaque or transmissive globe, a globe that casts, or a flame drawn after the globe fails. The beauty look of the flame through the globe needs a WebGL host and is judged by eye.
 * @evidence contracts/development/testing.md#execution-ownership In-memory archetype and Three scene graph; no renderer.
 */
export function test_archetype_lantern_globe(): void {
  const lantern: IAutoMovieModel = createLight({
    id: "lantern",
    kind: "lantern",
  });
  const globe: IAutoMovieModelPart = lantern.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "globe",
  )!;
  const glass: IAutoMovieMaterial = lantern.materials.find(
    (material: IAutoMovieMaterial): boolean => material.id === globe.material,
  )!;
  TestValidator.predicate(
    "blended glass at the estimated opacity",
    glass.alphaMode === "blend" &&
      glass.opacity === createLight.LANTERN_ESTIMATES.globe &&
      glass.opacity > 0 &&
      glass.opacity < 1 &&
      (glass.transmission ?? 0) === 0,
  );

  const scene: IAutoMovieScene = {
    id: "porch",
    name: null,
    nodes: [renderFixtureNode("lantern-1", lantern.id)],
    cameras: [],
    lights: [],
  };
  const object: ReturnType<typeof buildModel> = buildModel(lantern);
  const mounted: ReturnType<typeof buildScene> = buildScene(
    scene,
    (): ReturnType<typeof buildModel> => object,
  );
  const flames: ReturnType<typeof prepareAutoMovieFlames> =
    prepareAutoMovieFlames({
      shot: {
        flames: [
          {
            id: "burner",
            node: "lantern-1",
            emitter: "light",
            seed: 1,
            size: { kind: "small", height: 0.025, radius: 0.005 },
            emission: {
              luminance: 4000,
              color: { r: 1, g: 0.55, b: 0.25, a: null, hex: null },
            },
          },
        ],
        duration: 1,
      },
      scene,
      models: [lantern],
      resolveNode: (): ReturnType<typeof buildModel> => object,
    });
  applyAutoMovieShadowParticipation(mounted.scene);
  const globeMesh: THREE.Object3D = object.parts.get("globe")!;
  const fount: THREE.Object3D = object.parts.get("fount")!;
  TestValidator.predicate(
    "the globe receives but casts no shadow; the fount casts",
    globeMesh.castShadow === false &&
      globeMesh.receiveShadow === true &&
      fount.castShadow === true,
  );
  TestValidator.predicate(
    "the flame draws before the globe",
    (object.object.getObjectByName("flame:lantern-1/burner") as THREE.Mesh)
      .renderOrder < globeMesh.renderOrder,
  );
  flames.dispose();
}
