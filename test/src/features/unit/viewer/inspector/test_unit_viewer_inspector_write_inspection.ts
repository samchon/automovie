import { parseAutoMovieInspectionRequest } from "@automovie/render";
import { writeAutoMovieInspectorInspection } from "@automovie/viewer/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `writeAutoMovieInspectorInspection` writes an inspection as the text by which
 * the inspector tells two inspections apart.
 *
 * Scenarios:
 *
 * 1. The absent inspection is `[]`.
 * 2. A depth shade is `[["shade","depth"]]`, and two equal inspections write the
 *    same text.
 */
export function test_unit_viewer_inspector_write_inspection(): void {
  const request = (
    entries: [string, string][],
  ): { inspection: ReturnType<typeof parseAutoMovieInspectionRequest> } => {
    const values: Map<string, string> = new Map<string, string>(entries);
    return {
      inspection: parseAutoMovieInspectionRequest(
        (key: string): string | undefined => values.get(key),
      ),
    };
  };
  TestValidator.equals("absent", writeAutoMovieInspectorInspection(request([])), "[]");
  TestValidator.equals(
    "shade",
    writeAutoMovieInspectorInspection(request([["shade", "depth"]])),
    '[["shade","depth"]]',
  );
  TestValidator.equals(
    "equal",
    writeAutoMovieInspectorInspection(request([["shade", "depth"]])),
    writeAutoMovieInspectorInspection(request([["shade", "depth"]])),
  );
}