import { assertProductionPngPicture } from "../../../../packages/render/src/delivery/assertProductionPngPicture";
import { resolveProductionPngProfile } from "../../../../packages/render/src/delivery/resolveProductionPngProfile";
import { probeProductionPngPicture } from "../../../../packages/render/src/node/probeProductionPngPicture";
import { TestValidator } from "@nestia/e2e";
import zlib from "node:zlib";
import { PNG } from "pngjs";
import { pngChunk } from "../internal/designReference/pngChunk";

function refused(closure: () => unknown, message: string): boolean {
  try {
    closure();
    return false;
  } catch (error) {
    return error instanceof Error && error.message.includes(message);
  }
}

function picture(props: {
  width?: number;
  height?: number;
  colorType?: 0 | 2 | 4 | 6;
  gamma?: number;
}): Uint8Array {
  const image: PNG = new PNG({
    width: props.width ?? 2,
    height: props.height ?? 1,
    colorType: props.colorType ?? 6,
    inputColorType: props.colorType ?? 6,
  });
  image.data.fill(127);
  image.gamma = props.gamma ?? 0;
  return PNG.sync.write(image, {
    colorType: props.colorType ?? 6,
    inputColorType: props.colorType ?? 6,
  });
}

/** One CRC-carrying chunk, so the decoder accepts the datastream framing. */
function chunk(type: string, data: Uint8Array | number[]): Buffer {
  return pngChunk(type, Uint8Array.from(data));
}
const SIGNATURE: Buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
/** A 2x2 RGBA datastream with the given ancillary chunks before IDAT. */
function withChunks(...ancillary: Buffer[]): Uint8Array {
  const header: Buffer = Buffer.alloc(13);
  header.writeUInt32BE(2, 0);
  header.writeUInt32BE(2, 4);
  header.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([
    SIGNATURE,
    chunk("IHDR", header),
    ...ancillary,
    chunk("IDAT", zlib.deflateSync(Buffer.alloc(2 * (1 + 2 * 4)))),
    chunk("IEND", new Uint8Array()),
  ]);
}
function gammaChunk(value: number): Buffer {
  const data: Buffer = Buffer.alloc(4);
  data.writeUInt32BE(value);
  return chunk("gAMA", data);
}
/** A cHRM chunk of white point then red, green and blue x/y terms, times 100000. */
function chromaticityChunk(terms: number[]): Buffer {
  const data: Buffer = Buffer.alloc(32);
  terms.forEach((term: number, index: number): void => { data.writeUInt32BE(term, index * 4); });
  return chunk("cHRM", data);
}
function physicalChunk(x: number, y: number, unit: number): Buffer {
  const data: Buffer = Buffer.alloc(9);
  data.writeUInt32BE(x, 0);
  data.writeUInt32BE(y, 4);
  data[8] = unit;
  return chunk("pHYs", data);
}
function message(task: () => unknown): string {
  try {
    task();
    return "accepted";
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

/**
 * Validate complete PNG picture facts and role-specific profiles.
 *
 * Scenarios:
 * 1. An 8-bit RGBA image with the canonical sRGB gamma reports every exact
 *    IHDR, alpha, color, aspect, and orientation fact and passes its role.
 * 2. RGB, grayscale, grayscale-alpha, missing color identity, non-sRGB gamma,
 *    dimensions, and the fixed audio-picture roles remain distinguishable.
 * 3. Invalid role rasters, malformed bytes, and fieldwise profile substitutions
 *    fail without being hidden by a matching filename or digest.
 * 4. Color, aspect, and orientation chunks are read as facts: sRGB, iCCP, the
 *    canonical gAMA alone or with sRGB cHRM primaries, the canonical gAMA
 *    with other cHRM primaries as plain gamma, an explicit pHYs, an eXIf
 *    marker, and Adam7 interlace each surface in the picture, while a
 *    malformed sRGB, gAMA, cHRM, iCCP, or pHYs chunk, contradictory color
 *    declarations, a repeated chunk, a chunk type with high-bit bytes, and
 *    the listed datastream framing defects are refused by name.
 * 5. A one-bit CRC change refuses both observed sRGB metadata and an unknown
 *    ancillary chunk, while their unmodified adjacent inputs still admit.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual byte probing and PNG profile admission run against encoded and independently authored chunks; exact picture facts, fieldwise refusals and corrupted ancillary CRC cases catch false metadata admission without relying on a filename or digest.
 * @evidence contracts/testing.md#independent-expectations Literal IHDR, color and profile values come from the authored stream and role contract. The existing bitwise CRC fixture producer is independent of the product's native CRC API; flipping one recorded CRC bit must invalidate the unchanged tag and payload. No hardware-rendered appearance is asserted.
 * @evidence contracts/testing.md#distinguishing-cases Valid color models, gamma states, interlace, aspect and orientation contrast with malformed/repeated chunks, wrong profiles and framing boundaries. Both interpreted and unknown ancillary CRC corruption refuse beside valid unchanged inputs; other delivery-container formats belong to their owning units.
 * @evidence contracts/testing.md#execution-ownership The discoverable unit owns all assertions and runs resident in-memory PNG encoding, decoding and product validation without launching an encoder process, browser, GPU or installed consumer.
 */
export function test_production_png_picture_probe(): void {
  for (const type of ["sRGB", "qWER"]) {
    const valid: Buffer = chunk(type, type === "sRGB" ? [0] : [7]);
    const corrupted: Buffer = Buffer.from(valid);
    corrupted[corrupted.length - 1] = corrupted[corrupted.length - 1]! ^ 1;
    TestValidator.equals("valid ancillary CRC remains admitted", message((): unknown => probeProductionPngPicture(withChunks(valid))), "accepted");
    TestValidator.predicate("one-bit ancillary CRC corruption refuses", refused((): unknown => probeProductionPngPicture(withChunks(corrupted)), "CRC"));
  }
  const rgba: ReturnType<typeof probeProductionPngPicture> = probeProductionPngPicture(picture({ gamma: 0.45455 }));
  const profile: ReturnType<typeof resolveProductionPngProfile> = resolveProductionPngProfile({
    role: "preview",
    width: 2,
    height: 1,
  });
  assertProductionPngPicture({ profile, actual: rgba });
  TestValidator.equals(
    "the supported PNG reports complete parser-observed picture facts",
    rgba,
    {
      width: 2,
      height: 1,
      bitDepth: 8,
      color: "rgba",
      alpha: "straight",
      interlace: "none",
      colorSpace: "srgb",
      pixelAspect: { kind: "square" },
      orientation: "upright",
    },
  );
  const rgb: ReturnType<typeof probeProductionPngPicture> = probeProductionPngPicture(
    picture({ colorType: 2, gamma: 0.45455 }),
  );
  const grayscale: ReturnType<typeof probeProductionPngPicture> = probeProductionPngPicture(
    picture({ colorType: 0, gamma: 0.45455 }),
  );
  const grayscaleAlpha: ReturnType<typeof probeProductionPngPicture> = probeProductionPngPicture(
    picture({ colorType: 4, gamma: 0.45455 }),
  );
  const unknown: ReturnType<typeof probeProductionPngPicture> = probeProductionPngPicture(picture({}));
  const otherGamma: ReturnType<typeof probeProductionPngPicture> = probeProductionPngPicture(picture({ gamma: 1 }));
  TestValidator.equals(
    "channel, alpha and color identities do not collapse by raster",
    {
      rgb: [rgb.color, rgb.alpha],
      grayscale: [grayscale.color, grayscale.alpha],
      grayscaleAlpha: [grayscaleAlpha.color, grayscaleAlpha.alpha],
      unknown: unknown.colorSpace,
      otherGamma: otherGamma.colorSpace,
    },
    {
      rgb: ["rgb", "none"],
      grayscale: ["gray", "none"],
      grayscaleAlpha: ["gray-alpha", "straight"],
      unknown: "unidentified",
      otherGamma: "gamma",
    },
  );
  TestValidator.equals(
    "audio visualization roles have fixed nonexchangeable rasters",
    {
      waveform: resolveProductionPngProfile({ role: "waveform" }),
      spectrogram: resolveProductionPngProfile({ role: "spectrogram" }),
    },
    {
      waveform: { ...profile, role: "waveform", width: 960, height: 240 },
      spectrogram: {
        ...profile,
        role: "spectrogram",
        width: 512,
        height: 192,
      },
    },
  );
  TestValidator.equals(
    "invalid and substituted PNG profiles fail at the exact field",
    {
      missingRaster: refused(
        (): unknown => resolveProductionPngProfile({ role: "guide-frame" }),
        "positive safe-integer raster",
      ),
      wrongWidth: refused(
        (): unknown =>
          assertProductionPngPicture({
            profile: { ...profile, width: 3 },
            actual: rgba,
          }),
        "width",
      ),
      wrongHeight: refused(
        (): unknown =>
          assertProductionPngPicture({
            profile: { ...profile, height: 2 },
            actual: rgba,
          }),
        "height",
      ),
      rgbInsteadOfRgba: refused(
        (): unknown => assertProductionPngPicture({ profile, actual: rgb }),
        "color",
      ),
      unknownColor: refused(
        (): unknown => assertProductionPngPicture({ profile, actual: unknown }),
        "colorSpace",
      ),
      malformed: refused(
        (): unknown => probeProductionPngPicture(new Uint8Array([1, 2, 3])),
        "PNG",
      ),
    },
    {
      missingRaster: true,
      wrongWidth: true,
      wrongHeight: true,
      rgbInsteadOfRgba: true,
      unknownColor: true,
      malformed: true,
    },
  );
  const profileSubstitutions: readonly (readonly [string, ReturnType<typeof probeProductionPngPicture>])[] = [
    ["bitDepth", { ...rgba, bitDepth: 16 }],
    ["alpha", { ...rgba, alpha: "none" as const }],
    ["interlace", { ...rgba, interlace: "adam7" as const }],
    ["colorSpace", { ...rgba, colorSpace: "icc" as const }],
    [
      "pixelAspect",
      {
        ...rgba,
        pixelAspect: {
          kind: "explicit" as const,
          x: 2,
          y: 1,
          unit: 0 as const,
        },
      },
    ],
    ["orientation", { ...rgba, orientation: "metadata-present" as const }],
  ] as const;
  TestValidator.predicate(
    "every planned picture fact has an independent refusing twin",
    profileSubstitutions.every(([field, actual]: readonly [string, ReturnType<typeof probeProductionPngPicture>]): boolean =>
      refused((): unknown => assertProductionPngPicture({ profile, actual }), field),
    ),
  );

  const facts: (bytes: Uint8Array) => unknown = (bytes: Uint8Array): unknown => {
    const observed: ReturnType<typeof probeProductionPngPicture> = probeProductionPngPicture(bytes);
    return {
      colorSpace: observed.colorSpace,
      interlace: observed.interlace,
      pixelAspect: observed.pixelAspect,
      orientation: observed.orientation,
    };
  };
  const interlacedHeader: Buffer = Buffer.alloc(13);
  interlacedHeader.writeUInt32BE(1, 0);
  interlacedHeader.writeUInt32BE(1, 4);
  interlacedHeader.set([8, 6, 0, 0, 1], 8);
  const adam7: Buffer = Buffer.concat([
    SIGNATURE,
    chunk("IHDR", interlacedHeader),
    chunk("IDAT", zlib.deflateSync(Buffer.alloc(5))),
    chunk("IEND", new Uint8Array()),
  ]);
  TestValidator.equals(
    "color, aspect, orientation, and interlace chunks are read as facts",
    {
      srgb: facts(withChunks(chunk("sRGB", [0]))),
      srgbWithCanonicalGamma: facts(
        withChunks(chunk("sRGB", [3]), gammaChunk(45_455)),
      ),
      icc: facts(withChunks(chunk("iCCP", Buffer.from("name\0\0x", "latin1")))),
      canonicalGamma: facts(withChunks(gammaChunk(45_455))),
      canonicalGammaSrgbPrimaries: facts(
        withChunks(
          gammaChunk(45_455),
          chromaticityChunk([
            31_270, 32_900, 64_000, 33_000, 30_000, 60_000, 15_000, 6_000,
          ]),
        ),
      ),
      canonicalGammaWidePrimaries: facts(
        withChunks(
          gammaChunk(45_455),
          chromaticityChunk([
            31_270, 32_900, 68_000, 32_000, 26_500, 69_000, 15_000, 6_000,
          ]),
        ),
      ),
      aspect: facts(withChunks(physicalChunk(300, 200, 1))),
      exif: facts(withChunks(chunk("eXIf", [1, 2]))),
      adam7: facts(adam7),
    },
    {
      srgb: {
        colorSpace: "srgb",
        interlace: "none",
        pixelAspect: { kind: "square" },
        orientation: "upright",
      },
      srgbWithCanonicalGamma: {
        colorSpace: "srgb",
        interlace: "none",
        pixelAspect: { kind: "square" },
        orientation: "upright",
      },
      icc: {
        colorSpace: "icc",
        interlace: "none",
        pixelAspect: { kind: "square" },
        orientation: "upright",
      },
      canonicalGamma: {
        colorSpace: "srgb",
        interlace: "none",
        pixelAspect: { kind: "square" },
        orientation: "upright",
      },
      canonicalGammaSrgbPrimaries: {
        colorSpace: "srgb",
        interlace: "none",
        pixelAspect: { kind: "square" },
        orientation: "upright",
      },
      canonicalGammaWidePrimaries: {
        colorSpace: "gamma",
        interlace: "none",
        pixelAspect: { kind: "square" },
        orientation: "upright",
      },
      aspect: {
        colorSpace: "unidentified",
        interlace: "none",
        pixelAspect: { kind: "explicit", x: 300, y: 200, unit: 1 },
        orientation: "upright",
      },
      exif: {
        colorSpace: "unidentified",
        interlace: "none",
        pixelAspect: { kind: "square" },
        orientation: "metadata-present",
      },
      adam7: {
        colorSpace: "unidentified",
        interlace: "adam7",
        pixelAspect: { kind: "square" },
        orientation: "upright",
      },
    },
  );
  const base: Uint8Array = withChunks();
  TestValidator.equals(
    "malformed chunks and framing defects are refused by name",
    {
      srgbLength: message((): unknown =>
        probeProductionPngPicture(withChunks(chunk("sRGB", [0, 0]))),
      ),
      srgbIntent: message((): unknown =>
        probeProductionPngPicture(withChunks(chunk("sRGB", [4]))),
      ),
      gammaLength: message((): unknown =>
        probeProductionPngPicture(withChunks(chunk("gAMA", [0, 0, 0, 0, 1]))),
      ),
      srgbGammaConflict: message((): unknown =>
        probeProductionPngPicture(
          withChunks(chunk("sRGB", [0]), gammaChunk(50_000)),
        ),
      ),
      srgbWithIcc: message((): unknown =>
        probeProductionPngPicture(
          withChunks(
            chunk("sRGB", [0]),
            chunk("iCCP", Buffer.from("name\0\0x", "latin1")),
          ),
        ),
      ),
      iccName: message((): unknown =>
        probeProductionPngPicture(
          withChunks(chunk("iCCP", Buffer.from("\0\0x", "latin1"))),
        ),
      ),
      iccCompression: message((): unknown =>
        probeProductionPngPicture(
          withChunks(chunk("iCCP", Buffer.from("name\0x", "latin1"))),
        ),
      ),
      physicalLength: message((): unknown =>
        probeProductionPngPicture(withChunks(chunk("pHYs", [1, 2, 3]))),
      ),
      physicalZero: message((): unknown =>
        probeProductionPngPicture(withChunks(physicalChunk(0, 1, 1))),
      ),
      physicalUnit: message((): unknown =>
        probeProductionPngPicture(withChunks(physicalChunk(1, 1, 2))),
      ),
      repeatedChunk: message((): unknown =>
        probeProductionPngPicture(
          withChunks(chunk("sRGB", [0]), chunk("sRGB", [0])),
        ),
      ),
      headerCut: message((): unknown =>
        probeProductionPngPicture(
          Buffer.concat([
            base.subarray(0, 33),
            Buffer.from([0, 0, 0, 5, 0x49]),
          ]),
        ),
      ),
      payloadCut: message((): unknown =>
        probeProductionPngPicture(
          Buffer.concat([
            base.subarray(0, 33),
            Buffer.from([0, 0, 0, 9, 0x49, 0x44, 0x41, 0x54, 0, 0, 0, 0]),
          ]),
        ),
      ),
      typeLetters: message((): unknown =>
        probeProductionPngPicture(
          Buffer.concat([
            base.subarray(0, 33),
            chunk("ID4T", [0]),
            base.subarray(33),
          ]),
        ),
      ),
      highBitType: message((): unknown =>
        probeProductionPngPicture(
          Buffer.concat([
            base.subarray(0, 33),
            chunk("\u00e1\u00e2\u00e3\u00e4", [0]),
            base.subarray(33),
          ]),
        ),
      ),
      chromaticityLength: message((): unknown =>
        probeProductionPngPicture(withChunks(chunk("cHRM", [0, 0, 0, 1]))),
      ),
      trailingBytes: message((): unknown =>
        probeProductionPngPicture(Buffer.concat([base, Buffer.from([1])])),
      ),
      missingIend: message((): unknown =>
        probeProductionPngPicture(base.subarray(0, base.length - 12)),
      ),
    },
    {
      srgbLength: "PNG sRGB chunk must contain one rendering-intent byte.",
      srgbIntent: "PNG sRGB rendering intent must be between zero and three.",
      gammaLength: "PNG gAMA chunk must contain one unsigned gamma integer.",
      srgbGammaConflict:
        "PNG sRGB and gAMA chunks conflict: sRGB requires gAMA 45455, not 50000.",
      srgbWithIcc:
        "PNG sRGB and iCCP color declarations are mutually exclusive.",
      iccName:
        "PNG iCCP chunk has an invalid profile name or compression method.",
      iccCompression:
        "PNG iCCP chunk has an invalid profile name or compression method.",
      physicalLength: "PNG pHYs chunk must contain nine bytes.",
      physicalZero: "PNG pHYs density terms must both be positive.",
      physicalUnit: "PNG pHYs unit specifier must be zero or one.",
      repeatedChunk: "PNG datastream contains 2 sRGB chunks.",
      headerCut: "PNG datastream ends inside a chunk header.",
      payloadCut: "PNG datastream ends inside a declared chunk payload.",
      typeLetters: 'PNG chunk type "ID4T" is not four ASCII letters.',
      highBitType:
        'PNG chunk type "\u00e1\u00e2\u00e3\u00e4" is not four ASCII letters.',
      chromaticityLength:
        "PNG cHRM chunk must contain eight chromaticity integers.",
      trailingBytes: "PNG datastream does not end at one terminal IEND chunk.",
      missingIend: "PNG datastream does not end at one terminal IEND chunk.",
    },
  );
}
