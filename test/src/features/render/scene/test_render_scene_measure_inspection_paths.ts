import type {
  IAutoMovieInspectionDrawable,
  IAutoMovieMark,
} from "@automovie/interface";
import { AutoMovieRenderInspectionGeometry } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import {
  BoxGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
} from "three";

import { vclose } from "../../internal/vclose";

/** Every placement and extent in this fixture is an exact integer. */
const BOUND_TOLERANCE: number = 0;

/**
 * Inspection paths unite drawable bounds and world-space mark endpoints.
 *
 * Scenarios:
 *
 * 1. A centered box of size two and an arrow share one path. The first instance
 *    translates the arrow by +3 X, the anchor by +2 Y. The arrow reaches (4, 2,
 *    4), extending the box from (-1,-1,-1) to (4,2,4).
 * 2. An unselected object and a chosen mark without vertices yield no row.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The case names the shared path, instance transform, anchor transform, and controls that should yield no path row.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that the path bounds include the drawn box and transformed mark endpoint while unselected geometry and an empty mark leave no row.
 * @evidence contracts/development/testing.md#independent-expectations Combines the fixture box from `(-1,-1,-1)` to `(1,1,1)` with the hand-computed transformed mark endpoint `(4,2,4)`.
 */
export function test_render_scene_measure_inspection_paths(): void {
  const geometry: BoxGeometry = new BoxGeometry(2, 2, 2);
  const material: MeshBasicMaterial = new MeshBasicMaterial();
  const node: Mesh = new Mesh(geometry, material);
  const anchor: InstancedMesh = new InstancedMesh(geometry, material, 2);
  anchor.position.y = 2;
  anchor.setMatrixAt(0, new Matrix4().makeTranslation(3, 0, 0));
  anchor.setMatrixAt(1, new Matrix4().makeTranslation(100, 0, 0));
  const arrow: IAutoMovieMark = {
    path: "body",
    kind: "axis",
    label: "Axis",
    color: 0,
    shape: { type: "arrows", origins: [0, 0, 0], vectors: [1, 0, 4] },
    flagged: false,
    anchor: null,
  };
  const measured: IAutoMovieInspectionDrawable[] =
    AutoMovieRenderInspectionGeometry.measurePaths({
      objects: [
        { path: "body", object: node },
        { path: "skipped", object: node },
      ],
      marks: [
        { mark: arrow, anchor },
        {
          mark: {
            ...arrow,
            path: "empty",
            shape: { type: "points", points: [] },
          },
          anchor: null,
        },
      ],
      choose: (path: string): boolean => path !== "skipped",
    });
  TestValidator.equals(
    "selected nonempty paths",
    measured.map((entry) => entry.path),
    ["body"],
  );
  const bounds: IAutoMovieInspectionDrawable = measured[0]!;
  TestValidator.predicate(
    "box union with first instance arrow",
    () =>
      vclose(bounds.min, { x: -1, y: -1, z: -1 }, BOUND_TOLERANCE) &&
      vclose(bounds.max, { x: 4, y: 2, z: 4 }, BOUND_TOLERANCE),
  );
}
