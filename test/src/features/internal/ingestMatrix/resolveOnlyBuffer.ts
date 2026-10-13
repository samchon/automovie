import { basePayload } from "./basePayload";

/**
 * Resolve only the declared static mesh sidecar to its independent twelve-byte payload.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
 */
export const resolveOnlyBuffer: (uri: string) => Uint8Array | null = (uri: string): Uint8Array | null =>
  uri === "mesh.bin" ? basePayload() : null;
