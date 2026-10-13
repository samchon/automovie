import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { unsignedShortHumanoid } from "./unsignedShortHumanoid";
import { set } from "./set";

/**
 * Omit view offsets and explicitly declare zero accessor offsets for default handling.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
 */
export const offsetHumanoid: () => { document: ExternalModelMatrixObject; payload: Buffer } = (): { document: ExternalModelMatrixObject; payload: Buffer } => {
  const fixture: { document: ExternalModelMatrixObject; payload: Buffer } = unsignedShortHumanoid();
  set(fixture.document, ["bufferViews", 1, "byteOffset"], undefined);
  set(fixture.document, ["accessors", 1, "byteOffset"], 0);
  set(fixture.document, ["accessors", 2, "byteOffset"], 0);
  return fixture;
};
