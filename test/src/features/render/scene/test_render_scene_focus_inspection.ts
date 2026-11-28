import type { IAutoMovieMark } from "@automovie/interface";
import { AutoMovieRenderInspection } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `AutoMovieRenderInspection.focus` bounds what an inspection focus names.
 *
 * Scenarios:
 *
 * 1. A pattern focus bounds the matching objects: the 2 m cube named `b` at
 *    x = 5 gives (4, -1, -1) to (6, 1, 1).
 * 2. A flagged focus bounds the flagged marks only: points (0, 0, 0) and
 *    (2, 4, 6) give that box.
 * 3. A pattern that matches nothing, and a flagged focus with no flagged mark,
 *    are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names object-pattern and flagged-mark bounds and both empty-focus refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the inspection focus owner with typed native bounds and supplied marks. Reads resulting bounds and exercises missing pattern and missing flagged data.
 * @evidence contracts/development/testing.md#independent-expectations A 2 m cube centered at X 5 spans X 4 to 6 and Y and Z −1 to 1. The two literal flagged points bound (0, 0, 0) through (2, 4, 6). Other marks do not expand that box.
 */
export function test_render_scene_focus_inspection(): void {
  const cube = (x: number): THREE.Mesh => {
    const mesh: THREE.Mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2));
    mesh.position.x = x;
    mesh.updateMatrixWorld(true);
    return mesh;
  };
  const objects = [
    { path: "a", object: cube(0) },
    { path: "b", object: cube(5) },
  ];
  const flagged: IAutoMovieMark = {
    path: "flag",
    kind: "flag",
    label: "flag",
    color: 0,
    shape: { type: "points", points: [0, 0, 0, 2, 4, 6] },
    flagged: true,
    anchor: null,
  };
  const marks = [{ mark: flagged, anchor: null }];
  TestValidator.equals(
    "pattern",
    AutoMovieRenderInspection.focus({
      focus: { type: "pattern", pattern: "b" },
      objects,
      marks: [],
    }),
    { min: { x: 4, y: -1, z: -1 }, max: { x: 6, y: 1, z: 1 } },
  );
  TestValidator.equals(
    "flagged",
    AutoMovieRenderInspection.focus({ focus: { type: "flagged" }, objects, marks }),
    { min: { x: 0, y: 0, z: 0 }, max: { x: 2, y: 4, z: 6 } },
  );
  TestValidator.error("no match", (): void => {
    AutoMovieRenderInspection.focus({
      focus: { type: "pattern", pattern: "zzz" },
      objects,
      marks: [],
    });
  });
  TestValidator.error("nothing flagged", (): void => {
    AutoMovieRenderInspection.focus({ focus: { type: "flagged" }, objects, marks: [] });
  });
}