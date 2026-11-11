import {
  type IAutoMovieInspectionView,
  formatAutoMovieInspectionView,
  parseAutoMovieInspectionView,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * Writing a view gives the text that reads back to it, for every form the parser reads.
 *
 * Scenarios:
 *
 * 1. The film camera, a fixed camera with fractional and negative coordinates, a bare name, and a name with `@ortho`, `@focus=<pattern>`, `@flagged` and `@ortho` with each focus are written as the documented text and read back as equal views.
 * 2. A view's text written in another switch order, `front@flagged@ortho`, reads to a view that is written in the one fixed order, `front@ortho@flagged`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public formatter and parser and compares texts and views.
 * @evidence contracts/development/testing.md#independent-expectations Expected texts are written out from the documented grammar, and the round trip is checked against the view the test wrote, not against the formatter's output.
 * @evidence contracts/development/testing.md#distinguishing-cases Every form and switch combination, and a text in a non-canonical order against its canonical writing. Refused texts belong to `test_inspection_views`.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit writes its own views and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: The film camera, a fixed camera with fractional and negative coordinates).
 */
export function test_inspection_view_format(): void {
  // 1. Every form.
  const cases: [IAutoMovieInspectionView, string][] = [
    [{ type: "film" }, "film"],
    [{ type: "fixed", position: { x: 0.1, y: -2, z: 5 }, target: { x: 0, y: 1.25, z: -0.5 } }, "0.1,-2,5:0,1.25,-0.5"],
    [{ type: "named", name: "front", orthographic: false, focus: null }, "front"],
    [{ type: "named", name: "front", orthographic: true, focus: null }, "front@ortho"],
    [{ type: "named", name: "right", orthographic: false, focus: { type: "pattern", pattern: "hero/arm/*" } }, "right@focus=hero/arm/*"],
    [{ type: "named", name: "top", orthographic: false, focus: { type: "flagged" } }, "top@flagged"],
    [{ type: "named", name: "top", orthographic: true, focus: { type: "flagged" } }, "top@ortho@flagged"],
    [{ type: "named", name: "orbit", orthographic: true, focus: { type: "pattern", pattern: "a" } }, "orbit@ortho@focus=a"],
  ];
  for (const [view, text] of cases) {
    TestValidator.equals(`${text} is written`, formatAutoMovieInspectionView(view), text);
    TestValidator.equals(`${text} reads back`, parseAutoMovieInspectionView(formatAutoMovieInspectionView(view)), view);
  }

  // 2. One order.
  TestValidator.equals(
    "switches are written in one order",
    formatAutoMovieInspectionView(parseAutoMovieInspectionView("front@flagged@ortho")),
    "front@ortho@flagged",
  );
}
