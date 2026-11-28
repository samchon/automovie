import { AutoMovieRenderInspectionRequest } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `formatInspectionRequest` writes the keys that differ from the
 * absent request, in the order the request lists them.
 *
 * Scenarios:
 *
 * 1. The absent request writes nothing.
 * 2. A request read from values writes those values back, switches as 1 and 0
 *    and colours as six hexadecimal digits.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases describe the text emitted for an absent request and a request with explicit switches and colors.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that an absent request writes no options and that a populated request retains key ordering, switch values, and six-digit hexadecimal colors.
 * @evidence contracts/development/testing.md#independent-expectations Compares with an empty result and a literal sequence of options, including the encoded switches and colors.
 */
export function test_render_scene_format_inspection_request(): void {
  const read = (
    values: [string, string][],
  ): ReturnType<typeof AutoMovieRenderInspectionRequest.parseRequest> => {
    const map: Map<string, string> = new Map<string, string>(values);
    return AutoMovieRenderInspectionRequest.parseRequest((key: string): string | undefined =>
      map.get(key),
    );
  };
  TestValidator.equals(
    "absent",
    AutoMovieRenderInspectionRequest.formatRequest(read([])),
    [],
  );
  const values: [string, string][] = [
    ["parts", "hero,lamp"],
    ["shade", "depth"],
    ["surface", "0"],
    ["xray", "1"],
    ["stroke", "4"],
    ["color", "hero=00ff08"],
    ["ticks", "8"],
  ];
  TestValidator.equals(
    "round trip",
    AutoMovieRenderInspectionRequest.formatRequest(read(values)),
    values,
  );
}