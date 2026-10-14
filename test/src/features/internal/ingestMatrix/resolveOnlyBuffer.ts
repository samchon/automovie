import { basePayload } from "./basePayload";

/**
 * Resolve only the declared static mesh sidecar to its independent twelve-byte payload.
 */
export const resolveOnlyBuffer: (uri: string) => Uint8Array | null = (
  uri: string,
): Uint8Array | null => (uri === "mesh.bin" ? basePayload() : null);
