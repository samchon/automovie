import { isAutoMoviePlainBeautyRequest, AutoMovieRenderInspectionRequest } from "@automovie/render";;
import { TestValidator } from "@nestia/e2e";

/**
 * `isAutoMoviePlainBeautyRequest` is true when an inspection request leaves the
 * beauty picture as it is.
 *
 * Scenarios:
 *
 * 1. The absent request is plain, and so are ones that change only stroke or
 *    reach.
 * 2. Another shade, a part or hide pattern, a mark, a trail, a colour, a label,
 *    a section and x-ray each make it not plain.
 */
export function test_render_draw_is_plain_beauty_request(): void {
  const request = (
    entries: [string, string][],
  ): ReturnType<typeofAutoMovieRenderInspectionRequest.parseRequestt> => {
    const values: Map<string, string> = new Map<string, string>(entries);
    returnAutoMovieRenderInspectionRequest.parseRequestt((key: string): string | undefined =>
      values.get(key),
    );
  };
  TestValidator.equals("absent", isAutoMoviePlainBeautyRequest(request([])), true);
  for (const entries of [
    [["stroke", "5"]],
    [["reach", "2"]],
  ] satisfies [string, string][][])
    TestValidator.equals(
      JSON.stringify(entries),
      isAutoMoviePlainBeautyRequest(request(entries)),
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
      isAutoMoviePlainBeautyRequest(request(entries)),
      false,
    );
}