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
 * 1. The film camera, a fixed camera with fractional and negative coordinates, a fixed orthographic camera with and without an up direction, a bare name, a name with `@ortho`, `@follow`, `@focus=<pattern>`, `@flagged` and `@ortho` with each focus are written as the documented text and read back as equal views.
 * 2. A view's text written in another switch order, `front@flagged@ortho` or `0,5,0:0,0,0@up=0,0,-1@ortho=0.004`, reads to a view that is written in the one fixed order, `front@ortho@flagged` and `0,5,0:0,0,0@ortho=0.004@up=0,0,-1`.
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
    [
      {
        type: "fixed",
        position: { x: 0.1, y: -2, z: 5 },
        target: { x: 0, y: 1.25, z: -0.5 },
        metresPerPixel: null,
        up: null,
      },
      "0.1,-2,5:0,1.25,-0.5",
    ],
    [
      {
        type: "fixed",
        position: { x: 0, y: 5, z: 0 },
        target: { x: 0, y: 0, z: 0 },
        metresPerPixel: 0.004,
        up: { x: 0, y: 0, z: -1 },
      },
      "0,5,0:0,0,0@ortho=0.004@up=0,0,-1",
    ],
    [
      {
        type: "fixed",
        position: { x: 1, y: 2, z: 3 },
        target: { x: 0, y: 1, z: 0 },
        metresPerPixel: 0.0125,
        up: null,
      },
      "1,2,3:0,1,0@ortho=0.0125",
    ],
    [
      {
        type: "named",
        name: "front",
        orthographic: false,
        follow: false,
        focus: null,
      },
      "front",
    ],
    [
      {
        type: "named",
        name: "front",
        orthographic: true,
        follow: false,
        focus: null,
      },
      "front@ortho",
    ],
    [
      {
        type: "named",
        name: "right",
        orthographic: false,
        follow: false,
        focus: { type: "pattern", pattern: "hero/arm/*" },
      },
      "right@focus=hero/arm/*",
    ],
    [
      {
        type: "named",
        name: "top",
        orthographic: false,
        follow: false,
        focus: { type: "flagged" },
      },
      "top@flagged",
    ],
    [
      {
        type: "named",
        name: "top",
        orthographic: true,
        follow: false,
        focus: { type: "flagged" },
      },
      "top@ortho@flagged",
    ],
    [
      {
        type: "named",
        name: "orbit",
        orthographic: true,
        follow: false,
        focus: { type: "pattern", pattern: "a" },
      },
      "orbit@ortho@focus=a",
    ],
    [
      {
        type: "named",
        name: "right",
        orthographic: true,
        follow: true,
        focus: { type: "flagged" },
      },
      "right@ortho@follow@flagged",
    ],
  ];
  for (const [view, text] of cases) {
    TestValidator.equals(
      `${text} is written`,
      formatAutoMovieInspectionView(view),
      text,
    );
    TestValidator.equals(
      `${text} reads back`,
      parseAutoMovieInspectionView(formatAutoMovieInspectionView(view)),
      view,
    );
  }

  // 2. One order.
  TestValidator.equals(
    "switches are written in one order",
    formatAutoMovieInspectionView(
      parseAutoMovieInspectionView("front@flagged@ortho"),
    ),
    "front@ortho@flagged",
  );
  TestValidator.equals(
    "a fixed camera's switches are written in one order",
    formatAutoMovieInspectionView(
      parseAutoMovieInspectionView("0,5,0:0,0,0@up=0,0,-1@ortho=0.004"),
    ),
    "0,5,0:0,0,0@ortho=0.004@up=0,0,-1",
  );
}
