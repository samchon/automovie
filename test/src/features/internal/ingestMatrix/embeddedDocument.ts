import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { baseDocument } from "./baseDocument";

/**
 * Declare an embedded GLB buffer with an independent requested byte length.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
 */
export const embeddedDocument: (byteLength?: number) => ExternalModelMatrixObject = (byteLength: number = 12): ExternalModelMatrixObject => {
  const document: ExternalModelMatrixObject = baseDocument();
  document.buffers = [{ byteLength }];
  document.bufferViews = [{ buffer: 0, byteLength: 4 }];
  document.accessors = [
    { bufferView: 0, componentType: 5126, count: 1, type: "SCALAR" },
  ];
  return document;
};
