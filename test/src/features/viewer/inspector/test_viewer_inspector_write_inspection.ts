import { AutoMovieRenderInspectionRequest } from "@automovie/render";
import {
  writeInspectorInspection
} from "../../../../../packages/viewer/src/inspector/internal/writeInspectorInspection";
import { TestValidator } from "@nestia/e2e";

/**
 * `writeInspectorInspection` writes an inspection as the text by which
 * the inspector tells two inspections apart.
 *
 * Scenarios:
 *
 * 1. The absent inspection is `[]`.
 * 2. A depth shade is `[["shade","depth"]]`, and two equal inspections write the
 *    same text.
 */
export function test_viewer_inspector_write_inspection(): void {
  const request = (
    entries: [string, string][],
  ): { inspection: ReturnType<typeof AutoMovieRenderInspectionRequest.parseRequest> } => {
    const values: Map<string, string> = new Map<string, string>(entries);
    return {
      inspection: AutoMovieRenderInspectionRequest.parseRequest(
        (key: string): string | undefined => values.get(key),
      ),
    };
  };
  TestValidator.equals("absent", writeInspectorInspection(request([])), "[]");
  TestValidator.equals(
    "shade",
    writeInspectorInspection(request([["shade", "depth"]])),
    '[["shade","depth"]]',
  );
  TestValidator.equals(
    "equal",
    writeInspectorInspection(request([["shade", "depth"]])),
    writeInspectorInspection(request([["shade", "depth"]])),
  );
}