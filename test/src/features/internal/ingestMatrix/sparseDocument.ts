import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { baseDocument } from "./baseDocument";

/**
 * Declare a sparse FLOAT VEC3 accessor with independently bounded index/value views.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
 */
export const sparseDocument: () => ExternalModelMatrixObject = (): ExternalModelMatrixObject => {
  const document: ExternalModelMatrixObject = baseDocument();
  document.bufferViews = [
    { buffer: 0, byteOffset: 0, byteLength: 12 },
    { buffer: 0, byteOffset: 0, byteLength: 12 },
  ];
  document.accessors = [
    {
      componentType: 5126,
      count: 1,
      type: "VEC3",
      sparse: {
        count: 1,
        indices: { bufferView: 0, componentType: 5121 },
        values: { bufferView: 1 },
      },
    },
  ];
  return document;
};
