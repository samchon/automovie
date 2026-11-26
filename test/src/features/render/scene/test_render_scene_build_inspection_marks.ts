import type { IAutoMovieMark } from "@automovie/interface";
import { AutoMovieRenderInspectionMarks } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `buildAutoMovieInspectionMarks` draws marks as lines and points.
 *
 * Scenarios:
 *
 * 1. A polyline, a segment pair, an arrow and a point set build one overlay
 *    that updates, resizes and disposes.
 * 2. A polyline of one place, segments that do not pair up, arrows whose
 *    origins and vectors differ, coordinates that are not triples and a mark
 *    without coordinates are each refused with the mark's path.
 */
export function test_render_scene_build_inspection_marks(): void {
  const mark = (
    path: string,
    shape: IAutoMovieMark["shape"],
  ): IAutoMovieMark => ({
    path,
    kind: "curve",
    label: "curve",
    color: 0x00ff00,
    shape,
    flagged: false,
    anchor: null,
  });
  const set = (...shapes: [string, IAutoMovieMark["shape"]][]) => [
    {
      anchor: null,
      marks: shapes.map(([path, shape]) => ({ mark: mark(path, shape), color: 0x00ff00 })),
    },
  ];
  const overlay = AutoMovieRenderInspectionMarks.build(
    set(
      ["line", { type: "polyline", points: [0, 0, 0, 1, 0, 0, 1, 1, 0], closed: true }],
      ["pair", { type: "segments", points: [0, 0, 0, 0, 1, 0] }],
      ["arrow", { type: "arrows", origins: [0, 0, 0], vectors: [0, 0, 1] }],
      ["dots", { type: "points", points: [2, 2, 2] }],
    ),
    { stroke: 3, xray: false },
  );
  TestValidator.predicate("drawn", overlay.object.children.length > 0);
  overlay.update();
  overlay.resize(200, 100);
  overlay.dispose();

  const refused: [string, IAutoMovieMark["shape"]][] = [
    ["one", { type: "polyline", points: [0, 0, 0], closed: false }],
    ["odd", { type: "segments", points: [0, 0, 0, 1, 1, 1, 2, 2, 2] }],
    ["arrows", { type: "arrows", origins: [0, 0, 0], vectors: [0, 0, 1, 1, 1, 1] }],
    ["partial", { type: "points", points: [0, 0, 0, 1] }],
    ["empty", { type: "points", points: [] }],
  ];
  for (const [path, shape] of refused) {
    let message: string = "";
    try {
      AutoMovieRenderInspectionMarks.build(set([path, shape]), { stroke: 3, xray: false });
    } catch (error) {
      message = error instanceof Error ? error.message : "";
    }
    TestValidator.equals(path, message.includes(path), true);
  }
}