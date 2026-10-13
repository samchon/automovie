import { pngChunks } from "./pngChunks";


/** Rebuild supplied PNG input chunks while retaining the signature and caller-defined malformed field. */
export function rebuildPng(
  bytes: Uint8Array,
  edit: (chunk: { type: string; data: Uint8Array }) => Buffer | null,
): Uint8Array {
  return Buffer.concat([
    bytes.subarray(0, 8),
    ...pngChunks(bytes).flatMap((chunk: { type: string; data: Uint8Array }): Buffer[] => {
      const rebuilt: Buffer | null = edit(chunk);
      return rebuilt === null ? [] : [rebuilt];
    }),
  ]);
}

