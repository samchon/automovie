import type { IParsedContainer } from "./IParsedContainer";
import { decodeJson } from "./decodeJson";

/*
 * Decode one GLB 2.0 container's mandatory JSON and optional BIN chunk.
 */
export function decodeGlb(
  bytes: Uint8Array,
  vrmExtension: boolean,
): IParsedContainer {
  if (bytes.byteLength < 20)
    throw new Error("GLB/VRM container is shorter than its mandatory header.");
  const view: DataView = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  );
  if (view.getUint32(0, true) !== GLB_MAGIC)
    throw new Error("GLB/VRM container has an invalid magic value.");
  if (view.getUint32(4, true) !== 2)
    throw new Error("Only GLB container version 2 is supported.");
  if (view.getUint32(8, true) !== bytes.byteLength)
    throw new Error("GLB declared length does not match resident bytes.");
  const jsonLength: number = view.getUint32(12, true);
  if (
    jsonLength === 0 ||
    jsonLength % 4 !== 0 ||
    view.getUint32(16, true) !== GLB_JSON_CHUNK ||
    20 + jsonLength > bytes.byteLength
  )
    throw new Error("GLB first chunk is not one aligned JSON chunk.");
  let cursor: number = 20 + jsonLength;
  let bin: Uint8Array | null = null;
  while (cursor < bytes.byteLength) {
    if (cursor + 8 > bytes.byteLength)
      throw new Error("GLB contains a truncated chunk header.");
    const length: number = view.getUint32(cursor, true);
    if (length % 4 !== 0 || cursor + 8 + length > bytes.byteLength)
      throw new Error("GLB contains an unaligned or truncated chunk.");
    const type: number = view.getUint32(cursor + 4, true);
    if (type !== GLB_BIN_CHUNK || bin !== null)
      throw new Error(
        "GLB may contain only one optional BIN chunk after its JSON chunk.",
      );
    bin = bytes.subarray(cursor + 8, cursor + 8 + length);
    cursor += 8 + length;
  }
  return {
    json: decodeJson(bytes.subarray(20, 20 + jsonLength)),
    format: vrmExtension ? "vrm" : "glb",
    bin,
  };
}

const GLB_MAGIC: number = 0x46546c67;

const GLB_JSON_CHUNK: number = 0x4e4f534a;

const GLB_BIN_CHUNK: number = 0x004e4942;
