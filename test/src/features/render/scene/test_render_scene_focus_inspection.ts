import type { IAutoMovieMark } from "@automovie/interface";
import { focusAutoMovieInspection } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `focusAutoMovieInspection` bounds what an inspection focus names.
 *
 * Scenarios:
 *
 * 1. A pattern focus bounds the matching objects: the 2 m cube named `b` at
 *    x = 5 gives (4, -1, -1) to (6, 1, 1).
 * 2. A flagged focus bounds the flagged marks only: points (0, 0, 0) and
 *    (2, 4, 6) give that box.
 * 3. A pattern that matches nothing, and a flagged focus with no flagged mark,
 *    are refused.
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
    focusAutoMovieInspection({
      focus: { type: "pattern", pattern: "b" },
      objects,
      marks: [],
    }),
    { min: { x: 4, y: -1, z: -1 }, max: { x: 6, y: 1, z: 1 } },
  );
  TestValidator.equals(
    "flagged",
    focusAutoMovieInspection({ focus: { type: "flagged" }, objects, marks }),
    { min: { x: 0, y: 0, z: 0 }, max: { x: 2, y: 4, z: 6 } },
  );
  TestValidator.error("no match", (): void => {
    focusAutoMovieInspection({
      focus: { type: "pattern", pattern: "zzz" },
      objects,
      marks: [],
    });
  });
  TestValidator.error("nothing flagged", (): void => {
    focusAutoMovieInspection({ focus: { type: "flagged" }, objects, marks: [] });
  });
}