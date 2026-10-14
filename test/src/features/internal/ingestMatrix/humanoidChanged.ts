import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import type { ExternalModelMatrixPath } from "./ExternalModelMatrixPath";
import { humanoidDocument } from "./humanoidDocument";
import { set } from "./set";

/**
 * Mutate one field of a fresh humanoid document to create a boundary twin.
 */
export const humanoidChanged: (
  path: ExternalModelMatrixPath,
  value: unknown,
) => ExternalModelMatrixObject = (
  path: ExternalModelMatrixPath,
  value: unknown,
): ExternalModelMatrixObject => set(humanoidDocument(), path, value);
