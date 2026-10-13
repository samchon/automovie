import { humanoidPayload } from "./humanoidPayload";

/**
 * Resolve only the declared humanoid buffer to independent skin payload bytes.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
 */
export const humanoidResolver: (uri: string) => Uint8Array | null = (uri: string): Uint8Array | null =>
  uri === "human.bin" ? humanoidPayload() : null;
