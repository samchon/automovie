import { isAutoMoviePlainBeautyRequest, parseAutoMovieInspectionRequest } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `isAutoMoviePlainBeautyRequest` is true when an inspection request leaves the
 * beauty picture as it is.
 *
 * Scenarios:
 *
 * 1. The absent request is plain.
 * 2. Another shade, a part or hide pattern, a mark, a trail, a colour, a label,
 *    a section and x-ray each make it not plain; stroke and reach do not.
 */
export function test_unit_render_draw_is_plain_beauty_request(): void {
  const request = (
    values: Record<string, string>,
  ): ReturnType<typeof parseAutoMovieInspectionRequest> =>
    parseAutoMovieInspectionRequest((key: string): string | undefined =>
      Object.hasOwn(values, key) ? values[key] : undefined,
    );
  TestValidator.equals("absent", isAutoMoviePlainBeautyRequest(request({})), true);
  for (const values of [
    { stroke: "5" },
    { reach: "2" },
  ])
    TestValidator.equals(
      JSON.stringify(values),
      isAutoMoviePlainBeautyRequest(request(values)),
      true,
    );
  for (const values of [
    { shade: "depth" },
    { parts: "hero" },
    { hide: "hero" },
    { marks: "defect" },
    { trail: "hero" },
    { color: "hero=ff0000" },
    { label: "hero" },
    { section: "x:0.2" },
    { xray: "1" },
  ])
    TestValidator.equals(
      JSON.stringify(values),
      isAutoMoviePlainBeautyRequest(request(values)),
      false,
    );
}