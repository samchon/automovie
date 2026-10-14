import type { ExternalModelMatrixPath } from "./ExternalModelMatrixPath";
import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { set } from "./set";
import { baseDocument } from "./baseDocument";

/**
 * Mutate one field of a fresh static document for a negative twin.
 */
export const changed: (path: ExternalModelMatrixPath, value: unknown) => ExternalModelMatrixObject = (path: ExternalModelMatrixPath, value: unknown): ExternalModelMatrixObject =>
  set(baseDocument(), path, value);
