import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { embeddedDocument } from "./embeddedDocument";

/**
 * Declare a second URI-less buffer to isolate the GLB buffer-zero ownership rule.
 */
export const secondEmbeddedBuffer: () => ExternalModelMatrixObject =
  (): ExternalModelMatrixObject => {
    const document: ExternalModelMatrixObject = embeddedDocument();
    document.buffers = [{ byteLength: 12 }, { byteLength: 4 }];
    return document;
  };
