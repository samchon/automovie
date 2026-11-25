import {
  formatAutoMovieInspectionRequest,
  parseAutoMovieInspectionRequest,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `formatAutoMovieInspectionRequest` writes the keys that differ from the
 * absent request, in the order the request lists them.
 *
 * Scenarios:
 *
 * 1. The absent request writes nothing.
 * 2. A request read from values writes those values back, switches as 1 and 0
 *    and colours as six hexadecimal digits.
 */
export function test_unit_render_scene_format_inspection_request(): void {
  const read = (
    values: [string, string][],
  ): ReturnType<typeof parseAutoMovieInspectionRequest> => {
    const map: Map<string, string> = new Map<string, string>(values);
    return parseAutoMovieInspectionRequest((key: string): string | undefined =>
      map.get(key),
    );
  };
  TestValidator.equals(
    "absent",
    formatAutoMovieInspectionRequest(read([])),
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
    formatAutoMovieInspectionRequest(read(values)),
    values,
  );
}