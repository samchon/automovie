import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { unsignedShortHumanoid } from "./unsignedShortHumanoid";
import { set } from "./set";

/**
 * Omit view offsets and explicitly declare zero accessor offsets for default handling.
 */
export const offsetHumanoid: () => { document: ExternalModelMatrixObject; payload: Buffer } = (): { document: ExternalModelMatrixObject; payload: Buffer } => {
  const fixture: { document: ExternalModelMatrixObject; payload: Buffer } = unsignedShortHumanoid();
  set(fixture.document, ["bufferViews", 1, "byteOffset"], undefined);
  set(fixture.document, ["accessors", 1, "byteOffset"], 0);
  set(fixture.document, ["accessors", 2, "byteOffset"], 0);
  return fixture;
};
