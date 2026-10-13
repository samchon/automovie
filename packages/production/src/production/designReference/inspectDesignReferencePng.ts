import type { PNG } from "pngjs";
import { crc32 } from "node:zlib";
import { residentPngJs } from "../residentCodecs";
import { IAutoMovieDesignReferenceContainer } from "./IAutoMovieDesignReferenceContainer";
import { invalidDesignReferenceContainer } from "./invalidDesignReferenceContainer";

/**
 * Inspect a signature-selected PNG through complete chunk checksums, a thirteen-byte IHDR, native raster decoding, positive extent and empty terminal IEND.
 *
 * @evidence contracts/common.md#principled-implementation The existing chunk walk bounds each payload before Node22 public crc32 compares type-plus-payload against its stored checksum; pngjs sync decoding then establishes decoded extent and rejects unfinished/trailing framing. Exact IHDR size and empty IEND remain explicit owner checks.
 * @evidence contracts/common.md#clear-and-simple-design One ingress combines owned framing/checksum facts with the cached codec module's actual per-input decoding, returning metadata without another PNG producer or public CRC wrapper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts pngjs7 skips unknown ancillary CRCs, so checkCRC alone cannot certify every chunk. The owner checks those bytes directly; it does not validate every ancillary schema or all PNG-standard semantic combinations and supplies no rendered-image proof.
 * @evidence contracts/common.md#meaningful-documentation States signature-selection premise, integer pixel extent, all-chunk CRC, exact IHDR/IEND rules and typed source/family/stage refusals without claiming full standard or visual conformance.
 * @evidence contracts/performance.md#efficient-algorithms Framing/CRC scans B compressed bytes and retains C tag/size records; native decoding additionally inflates raster data and allocates pixel/filter buffers according to width, height, channels and bit depth, without a byte/pixel quota here.
 * @evidence contracts/performance.md#reuse-equivalent-work residentPngJs shares codec module loading, not an earlier asset's parsed answer; every byte population is independently framed, checksummed and decoded.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller owns input bytes; temporary tag records, copied decoder input and inflated/decoded buffers live through this synchronous call, and only scalar metadata escapes without a file, process or GPU handle.
 */
export function inspectDesignReferencePng(props: {
  /** Logical source path named by the PNG framing or decoder refusal. */
  path: string;

  /** Complete signature-selected PNG bytes, retained through native decoding. */
  bytes: Uint8Array;
}): IAutoMovieDesignReferenceContainer {
  // Check framing and every chunk CRC before decoding. A closed datastream
  // without IDAT retains the more specific IDAT refusal stage.
  const tags: Array<{ tag: string; size: number }> | null = pngChunkTags(props.path, props.bytes);
  if (tags?.[0]?.tag === "IHDR" && tags[0].size !== 13)
    throw invalidDesignReferenceContainer(props.path, "PNG", "IHDR", "IHDR must carry exactly thirteen bytes");
  if (
    tags !== null &&
    tags.some((chunk: { tag: string; size: number }): boolean => chunk.tag === "IEND") &&
    tags.every((chunk: { tag: string; size: number }): boolean => chunk.tag !== "IDAT")
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
  // Native sync reading rejects trailing bytes; empty IEND remains this owner's check.
  const iend: { tag: string; size: number } | undefined = tags?.find((chunk: { tag: string; size: number }): boolean => chunk.tag === "IEND");
  if (iend !== undefined && iend.size !== 0)
    throw invalidDesignReferenceContainer(props.path, "PNG", "IEND", "IEND must be empty");
  return { media: "image/png", width: decoded.width, height: decoded.height };
}

/** Read the caller-bounded unsigned big-endian field from the actual byte view, including its byteOffset. */
function readU32(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(
    offset,
    false,
  );
}

/** Decode a selected chunk label for diagnostics; native decoding owns actual supported chunk interpretation. */
function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return Buffer.from(bytes.subarray(offset, offset + length)).toString("ascii");
}

/** Walk complete chunks through IEND, checking every stored type-plus-payload CRC; null leaves incomplete framing to the native decoder. */
function pngChunkTags(
  path: string,
  bytes: Uint8Array,
): Array<{ tag: string; size: number }> | null {
  const chunks: Array<{ tag: string; size: number }> = [];
  for (let cursor: number = 8; cursor + 8 <= bytes.length; ) {
    const size: number = readU32(bytes, cursor);
    const tag: string = ascii(bytes, cursor + 4, 4);
    if (cursor + 12 + size > bytes.length) return null;
    // pngjs skips unknown ancillary chunks without checking their stored CRC.
    if (crc32(bytes.subarray(cursor + 4, cursor + 8 + size)) !== readU32(bytes, cursor + 8 + size))
      throw invalidDesignReferenceContainer(path, "PNG", "closure", `chunk ${tag} checksum mismatch`);
    chunks.push({ tag, size });
    if (tag === "IEND") return chunks;
    cursor += 12 + size;
  }
  return null;
}
