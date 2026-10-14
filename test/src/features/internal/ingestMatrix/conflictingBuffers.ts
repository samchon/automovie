import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { baseDocument } from "./baseDocument";

/**
 * Declare one URI with two incompatible byte lengths to distinguish resource identity conflicts.
 */
export const conflictingBuffers: () => ExternalModelMatrixObject =
  (): ExternalModelMatrixObject => {
    const document: ExternalModelMatrixObject = baseDocument();
    document.buffers = [
      { byteLength: 12, uri: "mesh.bin" },
      { byteLength: 16, uri: "mesh.bin" },
    ];
    return document;
  };
