import { humanoidPayload } from "./humanoidPayload";
import { rejects } from "./rejects";
import { humanoidDocument } from "./humanoidDocument";

/**
 * Apply a supplied byte mutation and assert the public humanoid profile refusal.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
 */
export const rejectsHumanoidPayload: (mutate: (payload: Buffer) => void, message: string) => boolean = (
  mutate: (payload: Buffer) => void,
  message: string,
): boolean => {
  const payload: Buffer = humanoidPayload();
  mutate(payload);
  return rejects(humanoidDocument(), message, "gltf-humanoid-v1", (uri: string): Uint8Array | null =>
    uri === "human.bin" ? payload : null,
  );
};
