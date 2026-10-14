import type { IParsedContainer } from "./IParsedContainer";
import { decodeJson } from "./decodeJson";

const GLB_MAGIC: number = 0x46546c67;

const GLB_JSON_CHUNK: number = 0x4e4f534a;

const GLB_BIN_CHUNK: number = 0x004e4942;

/**
 * Decode one GLB 2.0 container's mandatory JSON and optional BIN chunk.
 *
 * @evidence contracts/common.md#principled-implementation Magic, version, exact length, four-byte chunk alignment and JSON-first ordering establish the container; BIN remains a read-only input view.
 * @evidence contracts/common.md#clear-and-simple-design Container framing belongs here while strict JSON and duplicate-member checks belong to the shared JSON decoder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unexpected or repeated trailing chunks and invalid extents throw rather than truncating or guessing a payload.
 * @evidence contracts/common.md#meaningful-documentation Comments give version/alignment rules, optional BIN aliasing and suffix-provided VRM container identity.
 * @evidence contracts/performance.md#efficient-algorithms Header/chunk scanning is O(chunk count); JSON decoding is O(JSON bytes), and BIN bytes are not copied.
 * @evidence contracts/performance.md#reuse-equivalent-work The same decoded JSON owner serves both GLB and plain glTF; one BIN view is reused by downstream payload readers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The parsed result borrows BIN bytes only during synchronous inspection; JSON objects and view references are call-local.
 * @author Samchon
 */
export const decodeGlb: (
  bytes: Uint8Array,
  vrmExtension: boolean,
) => IParsedContainer = (
  bytes: Uint8Array,
  vrmExtension: boolean,
): IParsedContainer => {
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
};
