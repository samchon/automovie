import { AutoMovieRenderInspectionRequest, AutoMovieRenderDraw } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `isPlainBeautyRequest` is true when an inspection request leaves the
 * beauty picture as it is.
 *
 * Scenarios:
 *
 * 1. The absent request is plain, and so are ones that change only stroke or
 *    reach.
 * 2. Another shade, a part or hide pattern, a mark, a trail, a colour, a label,
 *    a section and x-ray each make it not plain.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Admits requests that leave the beauty picture plain and identifies inspection options that alter it.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the plain-beauty predicate for an absent request, stroke and reach changes, and each authored visual modifier.
 * @evidence contracts/development/testing.md#independent-expectations The explicit input and boolean list distinguishes every visual change from the absent or layout-only requests.
 */
export function test_render_draw_is_plain_beauty_request(): void {
  const request = (
    entries: [string, string][],
  ): ReturnType<typeof AutoMovieRenderInspectionRequest.parseRequest> => {
    const values: Map<string, string> = new Map<string, string>(entries);
    return AutoMovieRenderInspectionRequest.parseRequest((key: string): string | undefined =>
      values.get(key),
    );
  };
  TestValidator.equals("absent", AutoMovieRenderDraw.isAutoMoviePlainBeautyRequest(request([])), true);
  for (const entries of [
    [["stroke", "5"]],
    [["reach", "2"]],
  ] satisfies [string, string][][])
    TestValidator.equals(
      JSON.stringify(entries),
      AutoMovieRenderDraw.isAutoMoviePlainBeautyRequest(request(entries)),
      true,
    );
  for (const entries of [
    [["shade", "depth"]],
    [["parts", "hero"]],
    [["hide", "hero"]],
    [["marks", "defect"]],
    [["trail", "hero"]],
    [["color", "hero=ff0000"]],
    [["label", "hero"]],
    [["section", "x:0.2"]],
    [["xray", "1"]],
  ] satisfies [string, string][][])
    TestValidator.equals(
      JSON.stringify(entries),
      AutoMovieRenderDraw.isAutoMoviePlainBeautyRequest(request(entries)),
      false,
    );
}