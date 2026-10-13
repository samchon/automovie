import { IAutoMovieDesignReferenceContainer } from "./IAutoMovieDesignReferenceContainer";
import { invalidDesignReferenceContainer } from "./invalidDesignReferenceContainer";

/**
 * Frame marker ids admitted by the local JPEG marker-profile inspector.
 */
const JPEG_FRAME_MARKERS: Set<number> = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

/**
 * Close JPEG marker, single-frame, scan-component and restart state against terminal EOI. The caller selects the family by SOI; extent comes from its positive frame header in pixels.
 *
 * @evidence contracts/common.md#principled-implementation Walks bounded marker segments and entropy framing, requiring one supported frame with unique component ids, scans referencing that frame, positive DRI for ordered restart markers and exact terminal EOI.
 * @evidence contracts/common.md#clear-and-simple-design One cursor carries frame/restart/scan state while the shared refusal factory names the exact family stage without another image builder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonzero entropy framing is not Huffman/DCT/arithmetic decoding or complete JPEG-standard semantic validation; no raster is reconstructed, and a frame header cannot bypass required scans/closure.
 * @evidence contracts/common.md#meaningful-documentation Documents SOI ingress premise, pixel extent, single-frame supported marker profile, scan/restart constraints and typed refusals without claiming visual image validity.
 * @evidence contracts/performance.md#efficient-algorithms The cursor advances through B bytes and component tables, using a component-id Set bounded by the one-byte frame count; byte reads and hex diagnostics add fixed field work without allocating a decoded raster.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each supplied marker stream is reread and no completed image result or path-key cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Input bytes stay caller-owned; temporary frame ids/counters and returned scalar extent acquire no file, decoder process, GPU or retained image buffer.
 */
export function inspectDesignReferenceJpeg(props: {
  /** Logical source path named by the exact JPEG grammar stage. */
  path: string;

  /** Complete SOI-selected marker stream in its authored byte order. */
  bytes: Uint8Array;
}): IAutoMovieDesignReferenceContainer {
  const bytes: Uint8Array = props.bytes;
  let cursor: number = 2;
  let width: number | undefined;
  let height: number | undefined;
  let frameComponents: Set<number> | undefined;
  let restartInterval: number = 0;
  let scans: number = 0;
  let entropyBytes: number = 0;
  while (cursor < bytes.length) {
    if (bytes[cursor] !== 0xff)
      throw invalidDesignReferenceContainer(
        props.path,
        "JPEG",
        "marker",
        `expected a marker at byte ${cursor}`,
      );
    while (bytes[cursor] === 0xff) cursor += 1;
    const marker: number | undefined = bytes[cursor++];
    if (marker === undefined)
      throw invalidDesignReferenceContainer(
        props.path,
        "JPEG",
        "closure",
        "truncated marker at end of input",
      );
    if (marker === 0xd9) {
      if (cursor !== bytes.length)
        throw invalidDesignReferenceContainer(
          props.path,
          "JPEG",
          "closure",
          "bytes follow terminal EOI",
        );
      if (width === undefined || height === undefined)
        throw invalidDesignReferenceContainer(
          props.path,
          "JPEG",
          "frame",
          "no supported frame was found",
        );
      if (scans === 0 || entropyBytes === 0)
        throw invalidDesignReferenceContainer(
          props.path,
          "JPEG",
          "scan",
          "no complete entropy scan was found",
        );
      return { media: "image/jpeg", width, height };
    }
    if (
      marker === 0xd8 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    )
      throw invalidDesignReferenceContainer(
        props.path,
        "JPEG",
        "marker",
        `unexpected standalone marker 0x${hex(marker)}`,
      );
    // 0x00 is byte stuffing that exists only inside entropy-coded data, and
    // 0x02..0xBF are reserved codes with no defined segment structure.
    if (marker <= 0xbf)
      throw invalidDesignReferenceContainer(
        props.path,
        "JPEG",
        "marker",
        `reserved marker 0x${hex(marker)} has no segment structure`,
      );
    if (cursor + 2 > bytes.length)
      throw invalidDesignReferenceContainer(props.path, "JPEG", "segment", "truncated segment length");
    const size: number = readU16(bytes, cursor);
    if (size < 2 || cursor + size > bytes.length)
      throw invalidDesignReferenceContainer(
        props.path,
        "JPEG",
        "segment",
        `invalid segment length ${size}`,
      );
    const payload: number = cursor + 2;
    if (marker === 0xdd) {
      if (size !== 4)
        throw invalidDesignReferenceContainer(
          props.path,
          "JPEG",
          "restart",
          "DRI must carry one two-byte restart interval",
        );
      restartInterval = readU16(bytes, payload);
    }
    if (JPEG_FRAME_MARKERS.has(marker)) {
      if (width !== undefined || height !== undefined)
        throw invalidDesignReferenceContainer(
          props.path,
          "JPEG",
          "frame",
          "multiple frame headers are not in the admitted profile",
        );
      if (size < 8)
        throw invalidDesignReferenceContainer(props.path, "JPEG", "frame", "frame header is too small");
      const components: number = bytes[payload + 5]!;
      if (components === 0 || size !== 8 + 3 * components)
        throw invalidDesignReferenceContainer(
          props.path,
          "JPEG",
          "frame",
          "frame component table is truncated",
        );
      frameComponents = new Set<number>();
      for (let index: number = 0; index < components; ++index) {
        const identifier: number = bytes[payload + 6 + 3 * index]!;
        if (frameComponents.has(identifier))
          throw invalidDesignReferenceContainer(
            props.path,
            "JPEG",
            "frame",
            "frame component identifiers must be unique",
          );
        frameComponents.add(identifier);
      }
      height = readU16(bytes, payload + 1);
      width = readU16(bytes, payload + 3);
      if (width === 0 || height === 0)
        throw invalidDesignReferenceContainer(props.path, "JPEG", "frame", "extent must be positive");
    }
    cursor += size;
    if (marker === 0xda) {
      if (width === undefined || height === undefined)
        throw invalidDesignReferenceContainer(
          props.path,
          "JPEG",
          "scan",
          "scan precedes the supported frame header",
        );
      const components: number = bytes[payload]!;
      if (components === 0 || size !== 6 + 2 * components)
        throw invalidDesignReferenceContainer(
          props.path,
          "JPEG",
          "scan",
          "scan component table is truncated",
        );
      for (let index: number = 0; index < components; ++index)
        if (!frameComponents!.has(bytes[payload + 1 + 2 * index]!))
          throw invalidDesignReferenceContainer(
            props.path,
            "JPEG",
            "scan",
            "scan references a component absent from the frame",
          );
      scans += 1;
      let nextRestart: number = 0;
      while (cursor < bytes.length) {
        if (bytes[cursor] !== 0xff) {
          entropyBytes += 1;
          cursor += 1;
          continue;
        }
        const next: number | undefined = bytes[cursor + 1];
        if (next === 0x00) {
          entropyBytes += 1;
          cursor += 2;
          continue;
        }
        if (next === 0xff) {
          cursor += 1;
          continue;
        }
        if (next !== undefined && next >= 0xd0 && next <= 0xd7) {
          if (restartInterval === 0)
            throw invalidDesignReferenceContainer(
              props.path,
              "JPEG",
              "restart",
              "restart markers require a positive DRI interval",
            );
          if (next - 0xd0 !== nextRestart)
            throw invalidDesignReferenceContainer(
              props.path,
              "JPEG",
              "restart",
              `expected RST${nextRestart} but found RST${next - 0xd0}`,
            );
          nextRestart = (nextRestart + 1) % 8;
          cursor += 2;
          continue;
        }
        break;
      }
    }
  }
  throw invalidDesignReferenceContainer(props.path, "JPEG", "closure", "missing terminal EOI");
}

/** Read a caller-bounded two-byte big-endian marker field from the supplied byte view. */
function readU16(bytes: Uint8Array, offset: number): number { return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint16(
    offset,
    false,
  ); }

/** Format the observed marker byte for its actual refusal message. */
function hex(value: number): string { return value.toString(16).padStart(2, "0"); }
