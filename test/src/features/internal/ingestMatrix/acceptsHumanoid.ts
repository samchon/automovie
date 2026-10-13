import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { inspect } from "./inspect";

/**
 * Exercise humanoid inspection over one independently encoded document/payload pair.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
 */
export const acceptsHumanoid: (fixture: {
  document: ExternalModelMatrixObject;
  payload: Buffer;
}) => boolean = (fixture: {
  document: ExternalModelMatrixObject;
  payload: Buffer;
}): boolean => {
  inspect(fixture.document, "gltf-humanoid-v1", (uri: string): Uint8Array | null =>
    uri === "human.bin" ? fixture.payload : null,
  );
  return true;
};
