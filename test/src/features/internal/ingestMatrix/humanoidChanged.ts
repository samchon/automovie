import type { ExternalModelMatrixPath } from "./ExternalModelMatrixPath";
import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { set } from "./set";
import { humanoidDocument } from "./humanoidDocument";

/**
 * Mutate one field of a fresh humanoid document to create a boundary twin.
 */
export const humanoidChanged: (path: ExternalModelMatrixPath, value: unknown) => ExternalModelMatrixObject = (path: ExternalModelMatrixPath, value: unknown): ExternalModelMatrixObject =>
  set(humanoidDocument(), path, value);
