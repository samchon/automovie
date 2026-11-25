import {
  markAutoMovieMeshClearance,
  measureAutoMovieMeshClearance,
} from "@automovie/engine";
import type {
  IAutoMovieMark,
  IAutoMovieMesh,
  IAutoMovieMeshClearanceWitness,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/**
 * `markAutoMovieMeshClearance` draws each clearance witness as a segment from
 * the front surface to the back surface along the measured axis, flagged
 * where the back stands in front.
 *
 * Fixture: the unit right triangle at height z, measured along z against the
 * same triangle at z = 0.
 *
 * Scenarios:
 *
 * 1. Front at z = 0.1: every segment runs from z = 0.1 to z = 0 at one x and y,
 *    unflagged.
 * 2. Front at z = -0.1: every segment runs from z = -0.1 to z = 0, flagged.
 * 3. A mark carries kind `clearance`, path `lid/clearance/0` and its anchor.
 * 4. A witness naming vertex 7 of a three-vertex front is refused.
 */
export function test_engine_geometry_mark_mesh_clearance(): void {
  const triangle = (z: number): IAutoMovieMesh => ({
    positions: [0, 0, z, 1, 0, z, 0, 1, z],
    normals: null,
    uvs: null,
    indices: [0, 1, 2],
    skin: null,
  });
  const marks = (front: IAutoMovieMesh): IAutoMovieMark[] => {
    const witnesses: IAutoMovieMeshClearanceWitness[] = [];
    measureAutoMovieMeshClearance(front, triangle(0), "z", (w: IAutoMovieMeshClearanceWitness): void => {
      witnesses.push(w);
    });
    return markAutoMovieMeshClearance({ path: "lid", front, axis: "z", witnesses, anchor: "box" });
  };
  const segment = (mark: IAutoMovieMark): number[] =>
    mark.shape.type === "segments" ? mark.shape.points : [];

  // 1.
  const clear: IAutoMovieMark[] = marks(triangle(0.1));
  TestValidator.predicate(
    "clear",
    clear.length > 0 &&
      clear.every((mark: IAutoMovieMark): boolean => {
        const p: number[] = segment(mark);
        return (
          !mark.flagged &&
          nclose(p[2]!, 0.1) &&
          nclose(p[5]!, 0) &&
          nclose(p[0]!, p[3]!) &&
          nclose(p[1]!, p[4]!)
        );
      }),
  );

  // 2.
  const crossed: IAutoMovieMark[] = marks(triangle(-0.1));
  TestValidator.predicate(
    "crossed",
    crossed.length > 0 &&
      crossed.every(
        (mark: IAutoMovieMark): boolean =>
          mark.flagged && nclose(segment(mark)[2]!, -0.1) && nclose(segment(mark)[5]!, 0),
      ),
  );

  // 3.
  TestValidator.equals(
    "identity",
    [clear[0]!.kind, clear[0]!.path, clear[0]!.anchor],
    ["clearance", "lid/clearance/0", "box"],
  );

  // 4.
  TestValidator.error("vertex outside the front", (): void => {
    markAutoMovieMeshClearance({
      path: "lid",
      front: triangle(0.1),
      axis: "z",
      witnesses: [{ triangle: 0, backTriangle: 0, vertices: [0, 1, 7], weights: [1, 0, 0], gap: 0 }],
      anchor: null,
    });
  });
}
