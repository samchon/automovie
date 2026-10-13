import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { embeddedDocument } from "./embeddedDocument";

/**
 * Declare a second URI-less buffer to isolate the GLB buffer-zero ownership rule.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
 */
export const secondEmbeddedBuffer: () => ExternalModelMatrixObject = (): ExternalModelMatrixObject => {
  const document: ExternalModelMatrixObject = embeddedDocument();
  document.buffers = [{ byteLength: 12 }, { byteLength: 4 }];
  return document;
};
