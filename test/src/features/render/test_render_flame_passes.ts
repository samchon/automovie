import { createLight } from "@automovie/archetypes";
import { deriveAutoMovieSemanticMask } from "@automovie/engine";
import type {
  AutoMovieGuidePass,
  IAutoMovieFlameCue,
  IAutoMovieModel,
  IAutoMovieScene,
  IAutoMovieSemanticMask,
  IAutoMovieSemanticMaskEntry,
} from "@automovie/interface";
import {
  type IAutoMovieFlamesObject,
  type IAutoMovieRenderModeHandle,
  applyRenderMode,
  attachAutoMovieSemanticMask,
  buildModel,
  buildScene,
  prepareAutoMovieFlames,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { renderFixtureNode } from "../internal/renderFixtureNode";

/**
 * A candle's flame is an ordinary mesh in every guide pass, with its own mask
 * colour, and is absent outside its burning interval.
 *
 * Scenarios:
 *
 * 1. The mesh is named `flame:candle-1/wick`, parented under the candle's model
 *    object at the `light` frame, and the palette holds that id with kind
 *    `flame` and owner `node:candle-1`.
 * 2. In the mask pass the flame mesh takes that entry's colour.
 * 3. In the depth, normal and outline passes the flame mesh stays drawn.
 * 4. Outside `on` = [0.5, 2) the mesh is hidden; inside it is shown, and its
 *    positions change between two times inside the interval while equalling a
 *    fresh preparation at the same time.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the candle fixture, the passes and the interval cases.
 * @evidence contracts/development/testing.md#behavioral-verification Prepares the flames through the public preparer, derives the palette with the engine and applies each pass through applyRenderMode, reading names, materials, visibility and positions.
 * @evidence contracts/development/testing.md#independent-expectations The id, kind and owner follow the mask identity in issue #4094; the interval follows the authored `on`.
 * @evidence contracts/development/testing.md#distinguishing-cases A flame hidden in a structural pass, one painted another colour, or one drawn outside its interval fails. Pixel readback needs a WebGL host and belongs to the visual check.
 * @evidence contracts/development/testing.md#execution-ownership In-memory Three scene graph; no renderer.
 */
export function test_render_flame_passes(): void {
  const candle: IAutoMovieModel = createLight({ id: "candle", kind: "candle" });
  const scene: IAutoMovieScene = {
    id: "table",
    name: null,
    nodes: [renderFixtureNode("candle-1", candle.id)],
    cameras: [],
    lights: [],
  };
  const flames: IAutoMovieFlameCue[] = [
    {
      id: "wick",
      node: "candle-1",
      emitter: "light",
      seed: 3,
      size: { kind: "small", height: 0.03, radius: 0.006 },
      on: [0.5, 2],
      emission: {
        luminance: 5000,
        color: { r: 1, g: 0.6, b: 0.3, a: null, hex: null },
      },
    },
  ];
  const prepare: () => {
    flames: IAutoMovieFlamesObject;
    mounted: ReturnType<typeof buildScene>;
    object: ReturnType<typeof buildModel>;
  } = (): {
    flames: IAutoMovieFlamesObject;
    mounted: ReturnType<typeof buildScene>;
    object: ReturnType<typeof buildModel>;
  } => {
    const object: ReturnType<typeof buildModel> = buildModel(candle);
    const mounted: ReturnType<typeof buildScene> = buildScene(
      scene,
      (): ReturnType<typeof buildModel> => object,
    );
    return {
      flames: prepareAutoMovieFlames({
        shot: { flames, duration: 3 },
        scene,
        models: [candle],
        resolveNode: (): ReturnType<typeof buildModel> => object,
      }),
      mounted,
      object,
    };
  };
  const {
    flames: built,
    mounted,
    object,
  }: ReturnType<typeof prepare> = prepare();
  const mesh: THREE.Mesh = object.object.getObjectByName(
    "flame:candle-1/wick",
  ) as THREE.Mesh;

  // 1. Identity.
  const mask: IAutoMovieSemanticMask = deriveAutoMovieSemanticMask({
    scene,
    models: [candle],
    flames,
  });
  const entry: IAutoMovieSemanticMaskEntry | undefined = mask.entries.find(
    (candidate: IAutoMovieSemanticMaskEntry): boolean =>
      candidate.id === "flame:candle-1/wick",
  );
  TestValidator.equals(
    "flame identity",
    [mesh.name, mesh.parent === object.object, entry?.kind, entry?.owner],
    ["flame:candle-1/wick", true, "flame", "node:candle-1"],
  );

  // 2 and 3. Passes, at a time inside the interval.
  built.apply(1);
  attachAutoMovieSemanticMask(mounted.scene, { design: scene, mask });
  for (const pass of [
    "mask",
    "depth",
    "normal",
    "outline",
  ] as AutoMovieGuidePass[]) {
    const handle: IAutoMovieRenderModeHandle = applyRenderMode(
      mounted.scene,
      pass,
    );
    let drawn: boolean = false;
    mounted.scene.traverseVisible((candidate: THREE.Object3D): void => {
      if (candidate === mesh) drawn = true;
    });
    TestValidator.predicate(`${pass} draws the flame`, drawn);
    if (pass === "mask")
      TestValidator.equals(
        "mask colour is the flame's entry",
        `#${(mesh.material as THREE.MeshBasicMaterial).color.getHexString().toUpperCase()}`,
        entry?.color,
      );
    handle.restore();
  }

  // 4. The interval, and time-exact shapes.
  built.apply(0.25);
  TestValidator.equals("hidden before on", mesh.visible, false);
  built.apply(2);
  TestValidator.equals("hidden at the end of on", mesh.visible, false);
  built.apply(0.75);
  const early: number[] = Array.from(
    mesh.geometry.getAttribute("position").array,
  );
  built.apply(1.5);
  const late: number[] = Array.from(
    mesh.geometry.getAttribute("position").array,
  );
  const fresh: ReturnType<typeof prepare> = prepare();
  fresh.flames.apply(1.5);
  TestValidator.predicate(
    "the shape moves and equals a fresh seek",
    mesh.visible &&
      early.some(
        (value: number, index: number): boolean => value !== late[index],
      ) &&
      Array.from(
        (
          fresh.object.object.getObjectByName(
            "flame:candle-1/wick",
          ) as THREE.Mesh
        ).geometry.getAttribute("position").array,
      ).every((value: number, index: number): boolean => value === late[index]),
  );
  built.dispose();
  fresh.flames.dispose();
}
