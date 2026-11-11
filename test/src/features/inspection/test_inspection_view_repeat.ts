import {
  type IAutoMovieInspectionCamera,
  type IAutoMovieViewerSubjectBounds,
  formatAutoMovieInspectionCameraView,
  parseAutoMovieInspectionView,
  resolveAutoMovieInspectionView,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/nclose";

/**
 * Every camera a record keeps can be written as a fixed view that draws it again, orthographic and vertical ones included, so a later round repeats a cell's camera exactly even when what is drawn changes; and a followed view resolves as the fit it modifies.
 *
 * Scenarios:
 *
 * 1. A fixed orthographic view `0,1,6:0,1,0@ortho=0.005` resolves to an orthographic camera whose record keeps the position, target, `+Y` up and 0.005 metres per pixel, with clips at a quarter and three and a half times the six-metre distance.
 * 2. `front@ortho` and `top@ortho` fitted to a box, and `three-quarter` in perspective, each write a repeat text that parses as a fixed view; resolved with nothing drawn to frame, as when the surface is hidden, it gives the same position, target, up, projection, scale or field of view and, for the orthographic views, clips as the fitted camera's record. `top@ortho`, looking straight down, writes its up; `front@ortho` does not need to.
 * 3. `front@follow@ortho` resolves to the same camera as `front@ortho` over the same box, because following changes only which seconds a host frames over.
 * 4. A fixed view refuses `@ortho` without a scale, a scale of zero, `@follow`, `@focus=` and an up along the line of sight; a named view refuses `@ortho=` with a scale and `@up=`; a subject's own view refuses `@follow`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves real views through the public parser, resolver and camera writer and compares the records; a writer that dropped the scale or the up, a resolver that ignored them, or a fixed orthographic camera with other clips fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected numbers are the ones this test writes (the fixed view's points and scale) or the fitted camera's own record, the property the issue asks for; clips follow the documented quarter and three-and-a-half rule; floats are compared with `nclose`.
 * @evidence contracts/development/testing.md#distinguishing-cases Horizontal against vertical lines of sight, orthographic against perspective, a followed view against its plain fit, and every refused combination. Parsing and writing every form is owned by `test_inspection_view_format`; the record carrying the repeat text by `test_capture_run_order` and `test_draw_cell_call`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_inspection_view_repeat`; it builds cameras in memory and draws nothing.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_inspection_view_repeat(): void {
  const film: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 100);
  const box: IAutoMovieViewerSubjectBounds = {
    min: { x: -0.4, y: 0, z: -0.3 },
    max: { x: 0.4, y: 1.8, z: 0.3 },
  };
  const resolve: (text: string, bounds: IAutoMovieViewerSubjectBounds | null) => IAutoMovieInspectionCamera = (
    text: string,
    bounds: IAutoMovieViewerSubjectBounds | null,
  ): IAutoMovieInspectionCamera =>
    resolveAutoMovieInspectionView({
      view: parseAutoMovieInspectionView(text),
      text,
      bounds,
      camera: film,
      seconds: 0,
      width: 960,
      height: 540,
    }).record;
  const same: (a: IAutoMovieInspectionCamera, b: IAutoMovieInspectionCamera) => boolean = (
    a: IAutoMovieInspectionCamera,
    b: IAutoMovieInspectionCamera,
  ): boolean =>
    a.projection === b.projection &&
    (["position", "target", "up"] as const).every((key: "position" | "target" | "up"): boolean =>
      (["x", "y", "z"] as const).every((axis: "x" | "y" | "z"): boolean => nclose(a[key][axis], b[key][axis])),
    ) &&
    (a.fovDeg === null ? b.fovDeg === null : b.fovDeg !== null && nclose(a.fovDeg, b.fovDeg)) &&
    (a.metresPerPixel === null
      ? b.metresPerPixel === null
      : b.metresPerPixel !== null && nclose(a.metresPerPixel, b.metresPerPixel));

  // 1. A fixed orthographic view.
  const fixed: IAutoMovieInspectionCamera = resolve("0,1,6:0,1,0@ortho=0.005", null);
  TestValidator.predicate(
    "a fixed orthographic view keeps its points, scale and clips",
    fixed.projection === "orthographic" &&
      nclose(fixed.position.z, 6) &&
      nclose(fixed.target.y, 1) &&
      nclose(fixed.up.y, 1) &&
      nclose(fixed.metresPerPixel!, 0.005) &&
      nclose(fixed.near, 1.5) &&
      nclose(fixed.far, 21),
  );

  // 2. Fitted cameras repeat through their text with nothing to frame.
  for (const text of ["front@ortho", "top@ortho", "three-quarter"]) {
    const fitted: IAutoMovieInspectionCamera = resolve(text, box);
    const repeat: string = formatAutoMovieInspectionCameraView(fitted);
    TestValidator.equals(`${text} repeats as a fixed view`, parseAutoMovieInspectionView(repeat).type, "fixed");
    const again: IAutoMovieInspectionCamera = resolve(repeat, null);
    TestValidator.predicate(`${text} repeats its camera: ${repeat}`, same(fitted, again));
    if (fitted.projection === "orthographic")
      TestValidator.predicate(
        `${text} repeats its clips`,
        nclose(fitted.near, again.near) && nclose(fitted.far, again.far),
      );
  }
  TestValidator.predicate("a view looking straight down writes its up", formatAutoMovieInspectionCameraView(resolve("top@ortho", box)).includes("@up="));
  TestValidator.predicate("a level view needs no up", !formatAutoMovieInspectionCameraView(resolve("front@ortho", box)).includes("@up="));

  // 3. Following resolves as the plain fit.
  TestValidator.predicate("a followed view resolves as its fit", same(resolve("front@follow@ortho", box), resolve("front@ortho", box)));

  // 4. Refusals.
  for (const text of [
    "0,1,6:0,1,0@ortho",
    "0,1,6:0,1,0@ortho=0",
    "0,1,6:0,1,0@follow",
    "0,1,6:0,1,0@focus=a",
    "0,5,0:0,0,0@up=0,1,0",
    "front@ortho=0.1",
    "front@up=0,1,0",
  ])
    TestValidator.error(`${text} is refused`, (): unknown => parseAutoMovieInspectionView(text));
  TestValidator.error("a subject's own view refuses @follow", (): unknown =>
    resolveAutoMovieInspectionView({
      view: parseAutoMovieInspectionView("orbit@follow"),
      text: "orbit@follow",
      bounds: box,
      camera: film,
      views: { orbit: (): { position: [number, number, number]; target: [number, number, number] } => ({ position: [0, 1, 4], target: [0, 1, 0] }) },
      seconds: 0,
      width: 960,
      height: 540,
    }),
  );
}
