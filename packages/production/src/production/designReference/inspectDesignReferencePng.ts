import type { PNG } from "pngjs";
import { residentPngJs } from "../residentCodecs";
import { IAutoMovieDesignReferenceContainer } from "./IAutoMovieDesignReferenceContainer";
import { invalidDesignReferenceContainer } from "./invalidDesignReferenceContainer";

/**
 * Admit a CRC-decoded PNG only after framing, positive extent and terminal IEND agree. The decoder owns raster validity; this owner states the extra container refusals.
 */
export const inspectDesignReferencePng = (props: {
  /** Logical source path named by the PNG framing or decoder refusal. */
  path: string;

  /** Complete signature-selected PNG bytes, retained through native decoding. */
  bytes: Uint8Array;
}): IAutoMovieDesignReferenceContainer => {
  // A well-framed datastream that reaches IEND without an IDAT chunk is
  // refused at the IDAT stage. The decoder would refuse the same bytes as a
  // closure fault, so the framing walk reads the chunk tags first and leaves
  // every other refusal to the decoder.
  const tags = pngChunkTags(props.bytes);
  if (
    tags !== null &&
    tags.some((chunk) => chunk.tag === "IEND") &&
    tags.every((chunk) => chunk.tag !== "IDAT")
  )
    throw invalidDesignReferenceContainer(props.path, "PNG", "IDAT", "no IDAT chunk was found");
  let decoded: PNG;
  try {
    decoded = residentPngJs().PNG.sync.read(Buffer.from(props.bytes), {
      checkCRC: true,
    });
  } catch (error) {
    throw invalidDesignReferenceContainer(props.path, "PNG", "closure", error);
  }
  if (decoded.width <= 0 || decoded.height <= 0)
    throw invalidDesignReferenceContainer(props.path, "PNG", "IHDR", "extent must be positive");
  // The decoder has already refused any byte outside the chunk framing and a
  // first chunk that is not the 13-byte IHDR, so the closing chunk is the one
  // fact it leaves open.
  const iend = tags?.find((chunk) => chunk.tag === "IEND");
  if (iend !== undefined && iend.size !== 0)
    throw invalidDesignReferenceContainer(props.path, "PNG", "IEND", "IEND must be empty");
  return { media: "image/png", width: decoded.width, height: decoded.height };
};

const readU32 = (bytes: Uint8Array, offset: number): number =>
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(
    offset,
    false,
  );

const ascii = (bytes: Uint8Array, offset: number, length: number): string =>
  Buffer.from(bytes.subarray(offset, offset + length)).toString("ascii");

const pngChunkTags = (
  bytes: Uint8Array,
): Array<{ tag: string; size: number }> | null => {
  const chunks: Array<{ tag: string; size: number }> = [];
  for (let cursor = 8; cursor + 8 <= bytes.length; ) {
    const size = readU32(bytes, cursor);
    const tag = ascii(bytes, cursor + 4, 4);
    if (cursor + 12 + size > bytes.length) return null;
    chunks.push({ tag, size });
    if (tag === "IEND") return chunks;
    cursor += 12 + size;
  }
  return null;
};
