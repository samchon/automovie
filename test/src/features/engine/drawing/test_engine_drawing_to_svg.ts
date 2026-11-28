import { AutoMovieEngineDrawing } from "@automovie/engine";
import type {
  IAutoMovieDrawing,
  IAutoMovieDrawingView,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { drawingView } from "../../internal/drawingFixtures";
import { throwsError } from "../../internal/throwsError";

/** A 2 m x 1 m sheet at 1:50 with a cut and a hidden wall line and a note. */
const SHEET: IAutoMovieDrawing = {
  version: 1,
  protocol: "automovie.drawing.v1",
  view: "plan-ground",
  projection: "plan",
  discipline: "architectural",
  scale: 50,
  environment: "atelier",
  frame: {
    origin: { x: 0, y: 1.2, z: 0 },
    right: { x: 1, y: 0, z: 0 },
    up: { x: 0, y: 0, z: -1 },
    normal: { x: 0, y: 1, z: 0 },
  },
  extent: { min: { x: 0, y: 0 }, max: { x: 2, y: 1 } },
  lines: [
    {
      owner: "wall",
      space: null,
      layer: "walls",
      role: "cut",
      from: { x: 0, y: 0 },
      to: { x: 2, y: 0 },
    },
    {
      owner: "beam",
      space: "hall",
      layer: "beams",
      role: "hidden",
      from: { x: 0, y: 1 },
      to: { x: 2, y: 1 },
    },
  ],
  regions: [],
  openings: [],
  dimensions: [],
  annotations: [
    {
      id: "note",
      text: "A<B",
      status: "resolved",
      at: { x: 1, y: 0.5 },
      reason: null,
    },
  ],
  gaps: [],
  digest: "sha256:0",
};

/**
 * `drawingToSvg` writes a sheet as an SVG at the view's scale: 1000 /
 * scale millimetres per metre, a 10 mm margin, and y flipped so that up on the
 * page is up on the sheet.
 *
 * Scenarios, on a 2 m x 1 m sheet at 1:50 (20 mm per metre):
 *
 * 1. The page is 2 x 20 + 20 = 60 mm wide and 1 x 20 + 20 = 40 mm high.
 * 2. The cut line from (0, 0) to (2, 0) is drawn from (10, 30) to (50, 30) at the
 *    cut weight 0.5; the hidden line from (0, 1) to (2, 1) at y = 10 with its
 *    dash 1,1.
 * 3. The note at (1, 0.5) is at (30, 20) and its text is escaped.
 * 4. A view of another sheet, a stroke weight of zero and a text height of zero
 *    are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names scaled sheet dimensions, cut and hidden line styles, escaped note coordinates, and the view and style refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Calls Drawing.autoMovieDrawingToSvg with a literal two-line sheet and authored view, checks SVG content, then exercises mismatched view id and nonpositive style fields.
 * @evidence contracts/development/testing.md#independent-expectations The 1:50 scale gives 20 mm/m. With 10 mm margins the page is 60 by 40 mm, the world y values 0 and 1 map to y = 30 and 10, and the midpoint note maps to (30, 20). The authored cut weight, dash and escaped less-than character give literal text expectations.
 */
export function test_engine_drawing_to_svg(): void {
  const view: IAutoMovieDrawingView = drawingView();
  const svg: string = AutoMovieEngineDrawing.autoMovieDrawingToSvg({
    drawing: SHEET,
    view,
  });
  TestValidator.predicate(
    "the page",
    svg.includes('width="60.000mm"') &&
      svg.includes('height="40.000mm"') &&
      svg.includes('viewBox="0 0 60.000 40.000"'),
  );
  TestValidator.predicate(
    "the lines",
    svg.includes(
      'x1="10.000" y1="30.000" x2="50.000" y2="30.000" stroke="currentColor" stroke-width="0.500"',
    ) &&
      svg.includes('x1="10.000" y1="10.000" x2="50.000" y2="10.000"') &&
      svg.includes('stroke-dasharray="1.000,1.000"'),
  );
  TestValidator.predicate(
    "the note",
    svg.includes('x="30.000" y="20.000"') && svg.includes(">A&lt;B</text>"),
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      (): string =>
        AutoMovieEngineDrawing.autoMovieDrawingToSvg({
          drawing: SHEET,
          view: { ...view, id: "other" },
        }),
      "cannot be drawn with the pen",
    ) &&
      throwsError(
        (): string =>
          AutoMovieEngineDrawing.autoMovieDrawingToSvg({
            drawing: SHEET,
            view: {
              ...view,
              style: {
                ...view.style,
                weights: { ...view.style.weights, cut: 0 },
              },
            },
          }),
        "stroke weight",
      ) &&
      throwsError(
        (): string =>
          AutoMovieEngineDrawing.autoMovieDrawingToSvg({
            drawing: SHEET,
            view: { ...view, style: { ...view.style, textHeight: 0 } },
          }),
        "text height",
      ),
  );
}
