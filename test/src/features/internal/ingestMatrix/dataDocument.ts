import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { changed } from "./changed";

/**
 * Replace the static buffer URI with a declared data-URI payload for byte admission.
 */
export const dataDocument: (uri: string) => ExternalModelMatrixObject = (uri: string): ExternalModelMatrixObject =>
  changed(["buffers", 0, "uri"], uri);
