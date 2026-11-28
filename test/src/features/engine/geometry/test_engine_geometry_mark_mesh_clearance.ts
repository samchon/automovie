import { AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieMark,
  IAutoMovieMesh,
  IAutoMovieMeshClearanceWitness,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../internal/predicates";

/**
 * `markMeshClearance` draws each clearance witness as a segment from
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
 * 4. Unsupported axes, out-of-range and fractional vertices, nonfinite witness
 *    fields and an unrepresentable endpoint are refused.
 * 5. Finite affine extrapolation preserves authored weights and a null anchor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names signed witness direction, marking metadata, finite extrapolation and input and endpoint refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Measures pairs of actual projected triangles and builds marks, then supplies explicit raw witnesses exercising invalid and extrapolative coordinates.
 * @evidence contracts/development/testing.md#independent-expectations Equal XY coordinates imply axis-aligned segments. The two authored front z values straddle the back's zero plane, so only the negative one is flagged.
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
    AutoMovieEngineGeometry.measureMeshClearance(front, triangle(0), "z", (w: IAutoMovieMeshClearanceWitness): void => {
      witnesses.push(w);
    });
    return AutoMovieEngineGeometry.markMeshClearance({ path: "lid", front, axis: "z", witnesses, anchor: "box" });
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

  const witness: IAutoMovieMeshClearanceWitness = {
    triangle: 0,
    backTriangle: 0,
    vertices: [0, 1, 2],
    weights: [-1, 1, 1],
    gap: -1,
  };
  const mark = (
    proposal: IAutoMovieMeshClearanceWitness,
    front: IAutoMovieMesh = triangle(0),
    axis: "x" | "y" | "z" = "z",
  ): IAutoMovieMark =>
    AutoMovieEngineGeometry.markMeshClearance({ path: "lid", front, axis, witnesses: [proposal], anchor: null })[0]!;
  const extrapolated = mark(witness);
  TestValidator.equals(
    "finite affine extrapolation",
    [segment(extrapolated), extrapolated.flagged, extrapolated.anchor],
    [[1, 1, 0, 1, 1, 1], true, null],
  );
  const refusals: [string, () => unknown, string][] = [
    ["fractional vertex", () => mark({ ...witness, vertices: [0.5, 1, 2] }), "names vertex 0.5"],
    ["nonfinite weight", () => mark({ ...witness, weights: [NaN, 0, 1] }), "finite weights"],
    ["nonfinite gap", () => mark({ ...witness, gap: Infinity }), "finite gap"],
    ["nonfinite front", () => mark(witness, triangle(Infinity)), "finite front positions"],
    ["unknown axis", () => mark(witness, triangle(0), "w" as unknown as "z"), "axis must be"],
    ["unrepresentable endpoint", () => mark({
      ...witness, weights: [1, 0, 0], gap: -Number.MAX_VALUE,
    }, triangle(Number.MAX_VALUE)), "finite endpoints"],
  ];
  TestValidator.equals(
    "malformed witnesses and marks",
    refusals.filter(([, attempt, message]) => !throwsError(attempt, message)).map(([name]) => name),
    [],
  );

  // 4.
  TestValidator.error("vertex outside the front", (): void => {
    AutoMovieEngineGeometry.markMeshClearance({
      path: "lid",
      front: triangle(0.1),
      axis: "z",
      witnesses: [{ triangle: 0, backTriangle: 0, vertices: [0, 1, 7], weights: [1, 0, 0], gap: 0 }],
      anchor: null,
    });
  });
}
