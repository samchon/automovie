import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { baseDocument } from "./baseDocument";

/**
 * Declare an embedded GLB buffer with an independent requested byte length.
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
