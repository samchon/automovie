import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { baseDocument } from "./baseDocument";

/**
 * Declare narrow-component matrices whose column-padding byte sizes are independently specified.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
 */
export const matrixDocument: () => ExternalModelMatrixObject = (): ExternalModelMatrixObject => {
  const document: ExternalModelMatrixObject = baseDocument();
  document.buffers = [{ byteLength: 56, uri: "matrix.bin" }];
  document.bufferViews = [
    { buffer: 0, byteOffset: 0, byteLength: 12 },
    { buffer: 0, byteOffset: 12, byteLength: 8 },
    { buffer: 0, byteOffset: 20, byteLength: 12 },
    { buffer: 0, byteOffset: 32, byteLength: 24 },
  ];
  document.accessors = [
    { bufferView: 0, componentType: 5126, count: 1, type: "VEC3" },
    { bufferView: 1, componentType: 5121, count: 1, type: "MAT2" },
    { bufferView: 2, componentType: 5121, count: 1, type: "MAT3" },
    { bufferView: 3, componentType: 5123, count: 1, type: "MAT3" },
  ];
  return document;
};
