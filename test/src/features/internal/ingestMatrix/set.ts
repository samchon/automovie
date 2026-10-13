import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import type { ExternalModelMatrixPath } from "./ExternalModelMatrixPath";

/**
 * Apply a requested test-field mutation without reading the implementation under test.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
 */
export const set: (document: ExternalModelMatrixObject, path: ExternalModelMatrixPath, value: unknown) => ExternalModelMatrixObject = (document: ExternalModelMatrixObject, path: ExternalModelMatrixPath, value: unknown): ExternalModelMatrixObject => {
  let cursor: unknown = document;
  for (const part of path.slice(0, -1))
    cursor = Array.isArray(cursor)
      ? cursor[part as number]
      : (cursor as ExternalModelMatrixObject)[part];
  const last: number | string = path[path.length - 1]!;
  if (Array.isArray(cursor)) cursor[last as number] = value;
  else (cursor as ExternalModelMatrixObject)[last] = value;
  return document;
};
