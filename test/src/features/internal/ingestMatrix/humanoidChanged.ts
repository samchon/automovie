import type { ExternalModelMatrixPath } from "./ExternalModelMatrixPath";
import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { set } from "./set";
import { humanoidDocument } from "./humanoidDocument";

/**
 * Mutate one field of a fresh humanoid document to create a boundary twin.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
 */
export const humanoidChanged: (path: ExternalModelMatrixPath, value: unknown) => ExternalModelMatrixObject = (path: ExternalModelMatrixPath, value: unknown): ExternalModelMatrixObject =>
  set(humanoidDocument(), path, value);
