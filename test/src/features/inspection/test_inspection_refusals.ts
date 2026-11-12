import {
  type IAutoMovieInspectionHandle,
  type IAutoMovieInspectionRequest,
  type IAutoMovieSectionRenderer,
  applyAutoMovieInspection,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionScene } from "../internal/InspectionScene";

/**
 * A request the inspection cannot apply is refused without leaving a change behind, and a cut sets and puts back the clipping state it borrows.
 *
 * Scenarios:
 *
 * 1. `parts` matching nothing, one unmatched pattern among matched ones, `hide` matching nothing, a zero stroke and a stroke that is not a number are each refused, leaving both quads' layers and materials and the scene's children as they were.
 * 2. A mark that fails to build after isolation and the clay shade began is refused, and the isolation and the shade are undone.
 * 3. A `+x` cut gives a quad's material one plane facing -X through the origin, clips by union and switches the renderer's local clipping on; `restore` puts back the same plane list, its intersection flag and the renderer's switch.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Applies the public inspection to refused and accepted requests and reads layer masks, materials, children, clipping planes, the intersection flag and the renderer switch before, during and after.
 * @evidence contracts/development/testing.md#independent-expectations Expected states are those the test recorded before applying; the plane follows three.js's convention that a clipping plane keeps the side its normal points to, so cutting +X away keeps a plane facing -X.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts five refused requests, a failure before any change against one after changes began, and the clipping state during a cut against after it. Restoring marks and shades of an accepted request belongs to `test_inspection_restore`.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own scenes, stands a plain record in for the renderer and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: parts matching nothing, one unmatched pattern among matched ones, hide matching nothing).
 */
export function test_inspection_refusals(): void {
  // 1. Refused requests.
  const left: THREE.Mesh = InspectionScene.quad("left", -2, 1);
  const right: THREE.Mesh = InspectionScene.quad("right", 2, 1);
  const kept: THREE.Scene = InspectionScene.scene(left, right);
  const materials: (THREE.Material | THREE.Material[])[] = [
    left.material,
    right.material,
  ];
  const untouched = (): boolean =>
    left.layers.mask === 1 &&
    right.layers.mask === 1 &&
    left.material === materials[0] &&
    right.material === materials[1] &&
    kept.children.length === 2;
  const refusals: [title: string, request: IAutoMovieInspectionRequest][] = [
    ["parts that match nothing", InspectionScene.ask({ parts: ["nobody"] })],
    [
      "one unmatched pattern among matched ones",
      InspectionScene.ask({ parts: ["left", "nobody"] }),
    ],
    [
      "hide that matches nothing",
      InspectionScene.ask({ hide: ["nobody"], shade: "clay" }),
    ],
    ["a zero stroke", InspectionScene.ask({ stroke: 0 })],
    [
      "a stroke that is not a number",
      InspectionScene.ask({ stroke: Number.NaN }),
    ],
  ];
  for (const [title, request] of refusals) {
    TestValidator.error(`${title} is refused`, (): void => {
      applyAutoMovieInspection({ scene: kept, request });
    });
    TestValidator.predicate(`${title} leaves the scene untouched`, untouched());
  }

  // 2. A failure after changes began.
  TestValidator.error("a mark that cannot be built is refused", (): void => {
    applyAutoMovieInspection({
      scene: kept,
      request: InspectionScene.ask({
        parts: ["left"],
        shade: "clay",
        marks: ["probe"],
      }),
      marks: [
        InspectionScene.mark("left/rail", "probe", 0x00aa00, {
          type: "polyline",
          points: [0, 0, 0, 1, 0],
          closed: false,
        }),
      ],
    });
  });
  TestValidator.predicate(
    "and the isolation and shade made before it are undone",
    untouched(),
  );

  // 3. A cut.
  const slab: THREE.Mesh = InspectionScene.quad("slab");
  const clipped: THREE.Material = slab.material as THREE.Material;
  const prior: THREE.Plane[] = [
    new THREE.Plane(new THREE.Vector3(0, 1, 0), 100),
  ];
  clipped.clippingPlanes = prior;
  clipped.clipIntersection = true;
  const solid: THREE.Scene = InspectionScene.scene(slab);
  const renderer: IAutoMovieSectionRenderer = { localClippingEnabled: false };
  const cut: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: solid,
    request: InspectionScene.ask({
      section: { point: { x: 0, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 } },
    }),
    renderer,
  });
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
  cut.restore();
  TestValidator.equals(
    "the restore puts the plane list, the intersection flag and the switch back",
    [
      clipped.clippingPlanes === prior,
      clipped.clipIntersection,
      renderer.localClippingEnabled,
    ],
    [true, true, false],
  );
}
