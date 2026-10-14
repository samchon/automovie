import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { baseDocument } from "./baseDocument";

/**
 * Declare a sparse FLOAT VEC3 accessor with independently bounded index/value views.
 */
export const sparseDocument: () => ExternalModelMatrixObject =
  (): ExternalModelMatrixObject => {
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
