import { pngChunks } from "./pngChunks";


/** Rebuild supplied PNG input chunks while retaining the signature and caller-defined malformed field. */
export const rebuildPng = (
  bytes: Uint8Array,
  edit: (chunk: { type: string; data: Uint8Array }) => Buffer | null,
): Uint8Array =>
  Buffer.concat([
    bytes.subarray(0, 8),
    ...pngChunks(bytes).flatMap((chunk) => {
      const rebuilt = edit(chunk);
      return rebuilt === null ? [] : [rebuilt];
    }),
  ]);

