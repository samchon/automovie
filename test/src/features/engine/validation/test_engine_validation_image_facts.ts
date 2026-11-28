import { AutoMovieEngineValidation } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../../internal/predicates";

const bytes: (...values: number[]) => Uint8Array = (
  ...values: number[]
): Uint8Array => Uint8Array.from(values);

const beU32: (value: number) => number[] = (value: number): number[] => [
  (value >>> 24) & 0xff,
  (value >>> 16) & 0xff,
  (value >>> 8) & 0xff,
  value & 0xff,
];

const beU16: (value: number) => number[] = (value: number): number[] => [
  (value >>> 8) & 0xff,
  value & 0xff,
];

const leU16: (value: number) => number[] = (value: number): number[] => [
  value & 0xff,
  (value >>> 8) & 0xff,
];

const leU24: (value: number) => number[] = (value: number): number[] => [
  value & 0xff,
  (value >>> 8) & 0xff,
  (value >>> 16) & 0xff,
];

const chars: (text: string) => number[] = (text: string): number[] =>
  [...text].map((character: string): number => character.charCodeAt(0));

const PNG_SIGNATURE: number[] = [
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
];

/** A minimal PNG: signature, IHDR length, IHDR tag, then the two edges. */
const png: (width: number, height: number) => Uint8Array = (
  width: number,
  height: number,
): Uint8Array =>
  bytes(
    ...PNG_SIGNATURE,
    ...beU32(13),
    ...chars("IHDR"),
    ...beU32(width),
    ...beU32(height),
  );

/**
 * A JPEG carrying one preceding segment before its frame header, so the reader
 * must actually walk the segment chain rather than read a fixed offset.
 */
const jpeg: (props: {
  width: number;
  height: number;
  marker?: number;
  lead?: number[];
}) => Uint8Array = (props: {
  width: number;
  height: number;
  marker?: number;
  lead?: number[];
}): Uint8Array =>
  bytes(
    0xff,
    0xd8,
    ...(props.lead ?? [0xff, 0xe0, ...beU16(4), 0x00, 0x00]),
    0xff,
    props.marker ?? 0xc0,
    ...beU16(11),
    0x08,
    ...beU16(props.height),
    ...beU16(props.width),
    0x01,
    0x11,
    0x00,
  );

const webpLossy: (width: number, height: number) => Uint8Array = (
  width: number,
  height: number,
): Uint8Array =>
  bytes(
    ...chars("RIFF"),
    ...beU32(0),
    ...chars("WEBP"),
    ...chars("VP8 "),
    ...beU32(0),
    0x00,
    0x00,
    0x00,
    0x9d,
    0x01,
    0x2a,
    ...leU16(width),
    ...leU16(height),
  );

const webpLossless: (width: number, height: number) => Uint8Array = (
  width: number,
  height: number,
): Uint8Array => {
  const packed: number = (width - 1) | ((height - 1) << 14);
  return bytes(
    ...chars("RIFF"),
    ...beU32(0),
    ...chars("WEBP"),
    ...chars("VP8L"),
    ...beU32(0),
    0x2f,
    packed & 0xff,
    (packed >>> 8) & 0xff,
    (packed >>> 16) & 0xff,
    (packed >>> 24) & 0xff,
    ...new Array<number>(5).fill(0),
  );
};

const webpExtended: (width: number, height: number) => Uint8Array = (
  width: number,
  height: number,
): Uint8Array =>
  bytes(
    ...chars("RIFF"),
    ...beU32(0),
    ...chars("WEBP"),
    ...chars("VP8X"),
    ...beU32(10),
    0x10,
    0x00,
    0x00,
    0x00,
    ...leU24(width - 1),
    ...leU24(height - 1),
  );

const hdr: (props: {
  signature?: string;
  header?: string;
  resolution?: string;
}) => Uint8Array = (props: {
  signature?: string;
  header?: string;
  resolution?: string;
}): Uint8Array =>
  bytes(
    ...chars(
      `${props.signature ?? "#?RADIANCE"}\n${props.header ?? "FORMAT=32-bit_rle_rgbe"}\n\n${props.resolution ?? "-Y 512 +X 1024"}\n`,
    ),
  );

/**
 * Image container headers are read from bytes, never from a file name.
 *
 * Scenarios:
 *
 * 1. Each accepted container reports its exact media type and its two edges: PNG's
 *    IHDR, a JPEG frame header found by walking the segment chain, WebP's
 *    lossy, lossless and extended bodies, and a Radiance HDR resolution line.
 * 2. A JPEG whose dimensions sit behind fill bytes, a declared restart marker, or
 *    a standalone TEM is still located. A restart without positive DRI and a
 *    Huffman table that resembles a frame marker are refused.
 * 3. Every truncation, wrong signature, wrong chunk, wrong start code, missing
 *    blank line and non-standard scanline orientation reports "not an image"
 *    rather than a guessed size.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers supported image headers, JPEG marker traversal, and refusal of malformed or truncated bytes.
 * @evidence contracts/development/testing.md#behavioral-verification Passes authored Uint8Array containers directly to readAutoMovieImageFacts, including fill bytes, restart indicators and invalid format-specific fields.
 * @evidence contracts/development/testing.md#independent-expectations The fixture writes known widths and heights into each container's designated bytes or resolution line. Those literals establish the expected media and dimensions. Malformed marker, signature and orientation variants are listed as rejected inputs.
 */
export function test_engine_validation_image_facts(): void {
  TestValidator.equals(
    "every accepted container reports its own media type and size",
    [
      AutoMovieEngineValidation.readAutoMovieImageFacts(png(1024, 512)),
      AutoMovieEngineValidation.readAutoMovieImageFacts(jpeg({ width: 640, height: 480 })),
      AutoMovieEngineValidation.readAutoMovieImageFacts(webpLossy(300, 200)),
      AutoMovieEngineValidation.readAutoMovieImageFacts(webpLossless(300, 200)),
      AutoMovieEngineValidation.readAutoMovieImageFacts(webpExtended(4000, 3000)),
      AutoMovieEngineValidation.readAutoMovieImageFacts(hdr({})),
      AutoMovieEngineValidation.readAutoMovieImageFacts(
        hdr({ signature: "#?RGBE", resolution: "-Y 16 +X 32" }),
      ),
    ],
    [
      { mediaType: "image/png", width: 1024, height: 512 },
      { mediaType: "image/jpeg", width: 640, height: 480 },
      { mediaType: "image/webp", width: 300, height: 200 },
      { mediaType: "image/webp", width: 300, height: 200 },
      { mediaType: "image/webp", width: 4000, height: 3000 },
      { mediaType: "image/vnd.radiance", width: 1024, height: 512 },
      { mediaType: "image/vnd.radiance", width: 32, height: 16 },
    ],
  );

  TestValidator.equals(
    "a JPEG frame header is found through fill bytes and declared standalone markers",
    [
      AutoMovieEngineValidation.readAutoMovieImageFacts(
        jpeg({ width: 8, height: 4, lead: [0xff, 0xff, 0x01] }),
      ),
      AutoMovieEngineValidation.readAutoMovieImageFacts(
        jpeg({
          width: 8,
          height: 4,
          lead: [0xff, 0xdd, 0x00, 0x04, 0x00, 0x01, 0xff, 0xd0],
        }),
      ),
      AutoMovieEngineValidation.readAutoMovieImageFacts(
        jpeg({ width: 8, height: 4, lead: [0xff, 0xd8] }),
      ),
      AutoMovieEngineValidation.readAutoMovieImageFacts(jpeg({ width: 8, height: 4, marker: 0xc2 })),
      AutoMovieEngineValidation.readAutoMovieImageFacts(jpeg({ width: 8, height: 4, marker: 0xcf })),
    ],
    new Array(5).fill({ mediaType: "image/jpeg", width: 8, height: 4 }),
  );

  TestValidator.equals(
    "malformed and non-image bytes are reported rather than guessed",
    namedFacts([
      ["nullBytes", (): boolean => AutoMovieEngineValidation.readAutoMovieImageFacts(null) === null],
      [
        "undefinedBytes",
        (): boolean => AutoMovieEngineValidation.readAutoMovieImageFacts(undefined) === null,
      ],
      ["empty", (): boolean => AutoMovieEngineValidation.readAutoMovieImageFacts(bytes()) === null],
      [
        "pngShort",
        (): boolean =>
          AutoMovieEngineValidation.readAutoMovieImageFacts(png(4, 4).subarray(0, 23)) === null,
      ],
      [
        "pngSignature",
        (): boolean => {
          const broken: Uint8Array = png(4, 4);
          broken[1] = 0x00;
          return AutoMovieEngineValidation.readAutoMovieImageFacts(broken) === null;
        },
      ],
      [
        "pngChunk",
        (): boolean => {
          const broken: Uint8Array = png(4, 4);
          broken[12] = 0x49 + 1;
          return AutoMovieEngineValidation.readAutoMovieImageFacts(broken) === null;
        },
      ],
      [
        "jpegSoiOnly",
        (): boolean =>
          AutoMovieEngineValidation.readAutoMovieImageFacts(bytes(0xff, 0xd8, 0x00, 0x00)) === null,
      ],
      [
        "jpegUnterminatedFill",
        (): boolean =>
          AutoMovieEngineValidation.readAutoMovieImageFacts(bytes(0xff, 0xd8, 0xff, 0xff)) === null,
      ],
      [
        "jpegNoLengthWord",
        (): boolean =>
          AutoMovieEngineValidation.readAutoMovieImageFacts(bytes(0xff, 0xd8, 0xff, 0xe0)) === null,
      ],
      [
        "jpegShortLength",
        (): boolean =>
          AutoMovieEngineValidation.readAutoMovieImageFacts(bytes(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x01)) ===
          null,
      ],
      [
        "jpegTruncatedFrame",
        (): boolean =>
          AutoMovieEngineValidation.readAutoMovieImageFacts(
            bytes(0xff, 0xd8, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00),
          ) === null,
      ],
      [
        "jpegHuffmanIsNotAFrame",
        (): boolean =>
          AutoMovieEngineValidation.readAutoMovieImageFacts(
            bytes(0xff, 0xd8, 0xff, 0xc4, 0x00, 0x04, 0x00, 0x00),
          ) === null,
      ],
      [
        "jpegRestartWithoutDri",
        (): boolean =>
          AutoMovieEngineValidation.readAutoMovieImageFacts(
            jpeg({ width: 8, height: 4, lead: [0xff, 0xd0] }),
          ) === null,
      ],
      [
        "jpegRestartWithZeroDri",
        (): boolean =>
          AutoMovieEngineValidation.readAutoMovieImageFacts(
            jpeg({
              width: 8,
              height: 4,
              lead: [0xff, 0xdd, 0x00, 0x04, 0x00, 0x00, 0xff, 0xd0],
            }),
          ) === null,
      ],
      [
        "jpegMalformedDri",
        (): boolean =>
          AutoMovieEngineValidation.readAutoMovieImageFacts(
            jpeg({
              width: 8,
              height: 4,
              lead: [0xff, 0xdd, 0x00, 0x03, 0x01],
            }),
          ) === null,
      ],
      [
        "jpegEndOfImage",
        (): boolean =>
          AutoMovieEngineValidation.readAutoMovieImageFacts(bytes(0xff, 0xd8, 0xff, 0xd9)) === null,
      ],
      [
        "webpShort",
        (): boolean =>
          AutoMovieEngineValidation.readAutoMovieImageFacts(webpLossy(4, 4).subarray(0, 29)) === null,
      ],
      [
        "webpRiff",
        (): boolean => {
          const broken: Uint8Array = webpLossy(4, 4);
          broken[0] = 0x00;
          return AutoMovieEngineValidation.readAutoMovieImageFacts(broken) === null;
        },
      ],
      [
        "webpForm",
        (): boolean => {
          const broken: Uint8Array = webpLossy(4, 4);
          broken[8] = 0x00;
          return AutoMovieEngineValidation.readAutoMovieImageFacts(broken) === null;
        },
      ],
      [
        "webpChunk",
        (): boolean => {
          const broken: Uint8Array = webpLossy(4, 4);
          broken[12] = chars("X")[0]!;
          return AutoMovieEngineValidation.readAutoMovieImageFacts(broken) === null;
        },
      ],
      [
        "webpStartCode",
        (): boolean => {
          const broken: Uint8Array = webpLossy(4, 4);
          broken[23] = 0x00;
          return AutoMovieEngineValidation.readAutoMovieImageFacts(broken) === null;
        },
      ],
      [
        "webpLosslessSignature",
        (): boolean => {
          const broken: Uint8Array = webpLossless(4, 4);
          broken[20] = 0x00;
          return AutoMovieEngineValidation.readAutoMovieImageFacts(broken) === null;
        },
      ],
      [
        "hdrSignature",
        (): boolean =>
          AutoMovieEngineValidation.readAutoMovieImageFacts(hdr({ signature: "#?HDR" })) === null,
      ],
      [
        "hdrNoBlankLine",
        (): boolean =>
          AutoMovieEngineValidation.readAutoMovieImageFacts(
            bytes(...chars("#?RADIANCE\nFORMAT=32-bit_rle_rgbe")),
          ) === null,
      ],
      [
        "hdrTruncatedAtBlankLine",
        (): boolean =>
          AutoMovieEngineValidation.readAutoMovieImageFacts(
            bytes(...chars("#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n")),
          ) === null,
      ],
      [
        "hdrEmptyResolutionLine",
        (): boolean =>
          AutoMovieEngineValidation.readAutoMovieImageFacts(
            bytes(...chars("#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n")),
          ) === null,
      ],
      [
        "hdrFlippedScanlines",
        (): boolean =>
          AutoMovieEngineValidation.readAutoMovieImageFacts(hdr({ resolution: "+Y 512 +X 1024" })) ===
          null,
      ],
    ]),
    {
      nullBytes: true,
      undefinedBytes: true,
      empty: true,
      pngShort: true,
      pngSignature: true,
      pngChunk: true,
      jpegSoiOnly: true,
      jpegUnterminatedFill: true,
      jpegNoLengthWord: true,
      jpegShortLength: true,
      jpegTruncatedFrame: true,
      jpegHuffmanIsNotAFrame: true,
      jpegRestartWithoutDri: true,
      jpegRestartWithZeroDri: true,
      jpegMalformedDri: true,
      jpegEndOfImage: true,
      webpShort: true,
      webpRiff: true,
      webpForm: true,
      webpChunk: true,
      webpStartCode: true,
      webpLosslessSignature: true,
      hdrSignature: true,
      hdrNoBlankLine: true,
      hdrTruncatedAtBlankLine: true,
      hdrEmptyResolutionLine: true,
      hdrFlippedScanlines: true,
    },
  );
}
