import { type IAutoMovieRenderViewerViewpoint, AutoMovieRenderSubjectViewpoint } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `viewerNamedViewpoints` lists the eight named views.
 *
 * Scenarios:
 *
 * 1. Without an argument: the eight ids in order, each with its azimuth and
 *    elevation and the default distance factor 1.25.
 * 2. A given factor is carried by every view, and each call returns fresh
 *    records.
 * 3. A factor of zero or below is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases describe the eight defaults, a caller-selected distance factor, fresh records, and inadmissible factors.
 * @evidence contracts/development/testing.md#behavioral-verification Checks the named views' IDs, order, orientation, and shared distance factor, verifies fresh records, and refuses zero or negative factors.
 * @evidence contracts/development/testing.md#independent-expectations Uses a literal list of eight view ID and angle records with factor 1.25, along with an explicit factor override.
 */
export function test_render_scene_named_viewpoints(): void {
  const view = (
    id: string,
    azimuthDeg: number,
    elevationDeg: number,
    distanceFactor: number,
  ): IAutoMovieRenderViewerViewpoint => ({
    id,
    azimuthDeg,
    elevationDeg,
    distanceFactor,
  });
  TestValidator.equals("default plan", AutoMovieRenderSubjectViewpoint.autoMovieViewerNamedViewpoints(), [
    view("front", 0, 0, 1.25),
    view("back", 180, 0, 1.25),
    view("right", 90, 0, 1.25),
    view("left", 270, 0, 1.25),
    view("top", 0, 90, 1.25),
    view("bottom", 0, -90, 1.25),
    view("three-quarter", 45, 20, 1.25),
    view("three-quarter-back", 225, 20, 1.25),
  ]);

  const far: IAutoMovieRenderViewerViewpoint[] = AutoMovieRenderSubjectViewpoint.autoMovieViewerNamedViewpoints(2);
  TestValidator.equals(
    "given factor",
    far.map((entry: IAutoMovieRenderViewerViewpoint): number => entry.distanceFactor),
    [2, 2, 2, 2, 2, 2, 2, 2],
  );
  far[0]!.azimuthDeg = 12;
  TestValidator.equals(
    "fresh records",
    AutoMovieRenderSubjectViewpoint.autoMovieViewerNamedViewpoints(2)[0]!.azimuthDeg,
    0,
  );

  for (const factor of [0, -1])
    TestValidator.error(`factor ${factor}`, (): void => {
      AutoMovieRenderSubjectViewpoint.autoMovieViewerNamedViewpoints(factor);
    });
}
