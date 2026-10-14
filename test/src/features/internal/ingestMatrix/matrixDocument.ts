import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { baseDocument } from "./baseDocument";

/**
 * Declare narrow-component matrices whose column-padding byte sizes are independently specified.
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
