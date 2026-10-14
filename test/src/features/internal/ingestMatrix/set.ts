import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import type { ExternalModelMatrixPath } from "./ExternalModelMatrixPath";

/**
 * Apply a requested test-field mutation without reading the implementation under test.
 */
export const set: (
  document: ExternalModelMatrixObject,
  path: ExternalModelMatrixPath,
  value: unknown,
) => ExternalModelMatrixObject = (
  document: ExternalModelMatrixObject,
  path: ExternalModelMatrixPath,
  value: unknown,
): ExternalModelMatrixObject => {
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
