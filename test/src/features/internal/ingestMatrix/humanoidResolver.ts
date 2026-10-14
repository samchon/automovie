import { humanoidPayload } from "./humanoidPayload";

/**
 * Resolve only the declared humanoid buffer to independent skin payload bytes.
 */
export const humanoidResolver: (uri: string) => Uint8Array | null = (uri: string): Uint8Array | null =>
  uri === "human.bin" ? humanoidPayload() : null;
