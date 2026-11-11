import {
  type IAutoMovieInspectionHandle,
  type IAutoMovieInspectionRequest,
  type IAutoMovieSceneRaster,
  type IAutoMovieSectionRenderer,
  applyAutoMovieInspection,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionStage } from "../internal/InspectionStage";

/**
 * An inspection that draws a scene as wire or cuts it changes the scene's own
 * materials and renderer, refuses a request it cannot apply without leaving a
 * change behind, and puts every change back when it ends.
 *
 * Scenarios:
 *
 * 1. The wire switch draws a quad's border without its interior and turns
 *    the material's flag back off afterwards, and leaves a flag that was
 *    already on as it was.
 * 2. A cut removes the side its normal points to, replaces the material's
 *    clipping planes and enables clipping on the renderer while applied, and
 *    puts the same plane list, intersection flag and renderer flag back.
 * 3. A pattern that matches nothing, a stroke that is not positive, and a
 *    curve that cannot be built are refused, each leaving layers, materials
 *    and children as they were.
 * 4. Restoring an inspection that isolated, shaded, wired, marked and cut a
 *    scene puts back its layer masks, materials, flags, planes and children,
 *    and a second restore changes nothing.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Applies the public inspection to actual three.js scenes and reads the rasterizer's pixels, the handle's legend, and the layers, materials, flags, planes, children and renderer flag before, during and after.
 * @evidence contracts/development/testing.md#independent-expectations Expected pixels follow from authored positions and sizes under the stage's fixed camera, and expected restored state from values the test set or recorded itself before applying.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts a flag that was off against one that was on, both sides of a cut, five refused requests and one that fails after isolation and shading began, the state during an inspection against the state after it, and a first restore against a second. What an inspection draws belongs to `test_viewer_inspection_apply`.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own scenes on the shared `InspectionStage` fixture, stands a plain record in for the renderer and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: The wire switch draws a quad's border without its interior and turns the material's flag back off afterwards).
 */
export function test_viewer_inspection_restore(): void {
  const red: number[] = InspectionStage.RED;
  const blue: number[] = InspectionStage.BLUE;

  // 1. Wire: a quad sized so that its border is pixel row 20.
  const sheet: THREE.Mesh = InspectionStage.quad("sheet", 0xff0000, 0, 2.075);
  const wired: THREE.MeshBasicMaterial =
    sheet.material as THREE.MeshBasicMaterial;
  const mesh: THREE.Scene = InspectionStage.scene(sheet);
  const wire: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: mesh,
    request: InspectionStage.ask({ wire: true }),
  });
  TestValidator.equals(
    "wire draws the border without the interior",
    [wired.wireframe, ...InspectionStage.column(mesh, [20, 26])],
    [true, red, blue],
  );
  wire.restore();
  TestValidator.equals(
    "and the restore fills the quad again",
    [wired.wireframe, ...InspectionStage.column(mesh, [26])],
    [false, red],
  );
  wired.wireframe = true;
  applyAutoMovieInspection({
    scene: mesh,
    request: InspectionStage.ask({ wire: true }),
  }).restore();
  TestValidator.equals("a flag that was on stays on", wired.wireframe, true);

  // 2. Section.
  const slab: THREE.Mesh = InspectionStage.quad("slab", 0xff0000);
  const clipped: THREE.MeshBasicMaterial =
    slab.material as THREE.MeshBasicMaterial;
  const prior: THREE.Plane[] = [
    new THREE.Plane(new THREE.Vector3(0, 1, 0), 100),
  ];
  clipped.clippingPlanes = prior;
  clipped.clipIntersection = true;
  const solid: THREE.Scene = InspectionStage.scene(slab);
  const renderer: IAutoMovieSectionRenderer = { localClippingEnabled: false };
  const halves = (stage: THREE.Scene): number[][] => {
    const raster: IAutoMovieSceneRaster = InspectionStage.draw(stage);
    return [
      InspectionStage.at(raster, 26, 32),
      InspectionStage.at(raster, 38, 32),
    ];
  };
  const cut = (x: number): IAutoMovieInspectionHandle =>
    applyAutoMovieInspection({
      scene: solid,
      request: InspectionStage.ask({
        section: { point: { x: 0, y: 0, z: 0 }, normal: { x, y: 0, z: 0 } },
      }),
      renderer,
    });
  const beyond: IAutoMovieInspectionHandle = cut(1);
  TestValidator.equals("a +X cut removes the +X side", halves(solid), [
    red,
    blue,
  ]);
  const plane: THREE.Plane | undefined = clipped.clippingPlanes?.[0];
  TestValidator.predicate(
    "the material holds one plane facing against the cut direction",
    clipped.clippingPlanes !== prior &&
      clipped.clippingPlanes?.length === 1 &&
      plane !== undefined &&
      plane.normal.x === -1 &&
      Math.abs(plane.normal.y) === 0 &&
      Math.abs(plane.normal.z) === 0 &&
      Math.abs(plane.constant) === 0,
  );
  TestValidator.equals(
    "clipping is by union and enabled on the renderer",
    [clipped.clipIntersection, renderer.localClippingEnabled],
    [false, true],
  );
  beyond.restore();
  TestValidator.predicate(
    "the restore puts the same plane list back",
    clipped.clippingPlanes === prior,
  );
  TestValidator.equals(
    "with the intersection flag, the renderer flag and the whole quad",
    [clipped.clipIntersection, renderer.localClippingEnabled, ...halves(solid)],
    [true, false, red, red],
  );
  const before: IAutoMovieInspectionHandle = cut(-1);
  TestValidator.equals("a -X cut removes the -X side", halves(solid), [
    blue,
    red,
  ]);
  before.restore();

  // 3. Refusals.
  const [kept, keptLeft, keptRight]: [THREE.Scene, THREE.Mesh, THREE.Mesh] =
    InspectionStage.pair();
  const materials: (THREE.Material | THREE.Material[])[] = [
    keptLeft.material,
    keptRight.material,
  ];
  const untouched = (): boolean =>
    keptLeft.layers.mask === 1 &&
    keptRight.layers.mask === 1 &&
    keptLeft.material === materials[0] &&
    keptRight.material === materials[1] &&
    kept.children.length === 2;
  const refusals: [title: string, request: IAutoMovieInspectionRequest][] = [
    ["parts that match nothing", InspectionStage.ask({ parts: ["nobody"] })],
    [
      "one unmatched pattern among matched ones",
      InspectionStage.ask({ parts: ["left", "nobody"] }),
    ],
    [
      "hide that matches nothing",
      InspectionStage.ask({ hide: ["nobody"], shade: "clay" }),
    ],
    ["a zero stroke", InspectionStage.ask({ stroke: 0 })],
    [
      "a stroke that is not a number",
      InspectionStage.ask({ stroke: Number.NaN }),
    ],
  ];
  for (const [title, request] of refusals) {
    TestValidator.error(`${title} is refused`, (): void => {
      applyAutoMovieInspection({ scene: kept, request });
    });
    TestValidator.predicate(`${title} leaves the scene untouched`, untouched());
  }
  TestValidator.error("a curve that cannot be built is refused", (): void => {
    applyAutoMovieInspection({
      scene: kept,
      request: InspectionStage.ask({
        parts: ["left"],
        shade: "clay",
        curves: ["guide"],
      }),
      constructions: [
        {
          parent: keptLeft,
          curves: [
            InspectionStage.curve("rail", "guide", false, [0, 0, 0, 1, 0]),
          ],
        },
      ],
    });
  });
  TestValidator.predicate(
    "and the isolation and shade made before it are undone",
    untouched(),
  );

  // 4. Restore.
  const [whole, first, second]: [THREE.Scene, THREE.Mesh, THREE.Mesh] =
    InspectionStage.pair();
  second.layers.mask = 5;
  const originals: (THREE.Material | THREE.Material[])[] = [
    first.material,
    second.material,
  ];
  const host: IAutoMovieSectionRenderer = { localClippingEnabled: false };
  const state = (): unknown[] => [
    first.layers.mask,
    second.layers.mask,
    first.material === originals[0],
    second.material === originals[1],
    (originals[0] as THREE.MeshBasicMaterial).wireframe,
    (originals[0] as THREE.MeshBasicMaterial).clippingPlanes,
    whole.children.length,
    host.localClippingEnabled,
  ];
  const everything: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: whole,
    request: InspectionStage.ask({
      parts: ["left"],
      shade: "clay",
      wire: true,
      defects: ["open"],
      section: { point: { x: 0, y: 0, z: 0 }, normal: { x: 0, y: 1, z: 0 } },
    }),
    renderer: host,
  });
  TestValidator.equals(
    "while applied the scene is isolated, shaded, marked and cut",
    [state().slice(0, 4), state().slice(6), everything.legend],
    [
      [1, 0, false, false],
      [3, true],
      [{ label: "open edge", color: 0xff3b30, count: 4 }],
    ],
  );
  everything.restore();
  TestValidator.equals(
    "the restore puts layers, materials, flags, planes and children back",
    state(),
    [1, 5, true, true, false, null, 2, false],
  );
  second.layers.mask = 7;
  host.localClippingEnabled = true;
  everything.restore();
  TestValidator.equals(
    "a second restore changes nothing",
    [second.layers.mask, host.localClippingEnabled, whole.children.length],
    [7, true, 2],
  );
}
