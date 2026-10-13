import { TestValidator } from "@nestia/e2e";
import { PNG } from "pngjs";
import { stage } from "../internal/designReference/stage";
import { pngChunk } from "../internal/designReference/pngChunk";
import { rebuildPng } from "../internal/designReference/rebuildPng";
import { pngStream } from "../internal/designReference/pngStream";
import { refuses } from "../internal/designReference/refuses";
import { inspectAutoMovieDesignReferenceContainer } from "../../../../packages/production/src/production/designReference/inspectAutoMovieDesignReferenceContainer";

/**
 * PNG framing, every chunk's CRC, payload presence, extent and terminal IEND refusals retain their exact typed parser stages.
 *
 * Scenarios:
 *
 * 1. Admit positive extent with valid standard and unknown ancillary CRCs.
 * 2. Refuse an isolated stored-CRC bit flip while preserving its chunk payload and framing.
 * 3. Refuse truncated framing, missing image payload/closure, a fourteen-byte IHDR and invalid extent at their owning stages.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the product design-reference inspector on real in-memory PNG bytes; valid ancillary chunks preserve the independently authored extent, while stored-CRC corruption must refuse instead of returning metadata.
 * @evidence contracts/testing.md#independent-expectations Fixture pngChunk computes standard PNG polynomial CRC independently of the production Node crc32 call. The negative twin flips one stored checksum bit without changing payload, and the expected 4 by 3 extent comes from the authored image input rather than inspector output.
 * @evidence contracts/testing.md#distinguishing-cases Covers valid/bad sRGB and unknown qWER ancillary twins plus adjacent thirteen/fourteen-byte IHDR, original prefix, known CRC, missing IDAT/IEND, nonempty IEND and zero extent. Other family tests own JPEG/PDF/XML/DXF grammar and this test establishes no rendered-pixel quality.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_production_design_reference_png function exercises portable byte parsing and synchronous codecs through product source; it launches no process, browser, GPU, installation or dynamic case driver.
 */
export function test_production_design_reference_png(): void {
  const image: PNG = new PNG({ width: 4, height: 3 });
  image.data.fill(0xff);
  const png: Buffer = PNG.sync.write(image);
  const badCrc: Buffer = Buffer.from(png);
  badCrc[29] = badCrc[29]! ^ 0x01;
  TestValidator.equals(
    "PNG prefix, bad CRC, missing IDAT and missing IEND are refused",
    [
      refuses("prefix.png", png.subarray(0, 24)),
      refuses("crc.png", badCrc),
      refuses(
        "no-idat.png",
        rebuildPng(png, (chunk: { type: string; data: Uint8Array }): Buffer | null =>
          chunk.type === "IDAT" ? null : pngChunk(chunk.type, chunk.data),
        ),
      ),
      refuses("no-iend.png", png.subarray(0, png.length - 12)),
    ],
    [true, true, true, true],
  );
  TestValidator.equals(
    "native parser stages retain exact family and refusal identity",
    {
      pngNonEmptyIend: stage(
        "iend.png",
        rebuildPng(png, (chunk: { type: string; data: Uint8Array }): Buffer =>
          chunk.type === "IEND"
            ? pngChunk("IEND", new Uint8Array([1]))
            : pngChunk(chunk.type, chunk.data),
        ),
      ),
      pngZeroExtent: stage("extent.png", pngStream(0, 2, true)),
      pngNoIdat: stage("idat.png", pngStream(2, 2, false)),
      pngLongIhdr: stage("long-ihdr.png", rebuildPng(png, (chunk: { type: string; data: Uint8Array }): Buffer => pngChunk(chunk.type, chunk.type === "IHDR" ? Buffer.concat([chunk.data, new Uint8Array([0])]) : chunk.data))),
    },
    {
      pngNonEmptyIend: "PNG:IEND",
      pngZeroExtent: "PNG:IHDR",
      pngNoIdat: "PNG:IDAT",
      pngLongIhdr: "PNG:IHDR",
    },
  );
  for (const family of ["sRGB", "qWER"] as const) {
    const payload: Uint8Array = family === "sRGB" ? new Uint8Array([0]) : new Uint8Array([0x11, 0x23, 0x37]);
    const validChunk: Buffer = pngChunk(family, payload);
    const invalidChunk: Buffer = Buffer.from(validChunk);
    invalidChunk[invalidChunk.length - 1] = invalidChunk[invalidChunk.length - 1]! ^ 0x01;
    const withAncillary: (chunk: Buffer) => Uint8Array = (ancillary: Buffer): Uint8Array => rebuildPng(png, (chunk: { type: string; data: Uint8Array }): Buffer => {
      const original: Buffer = pngChunk(chunk.type, chunk.data);
      return chunk.type === "IHDR" ? Buffer.concat([original, ancillary]) : original;
    });
    TestValidator.equals(`${family} valid CRC preserves authored extent`, inspectAutoMovieDesignReferenceContainer({ path: `${family}.png`, bytes: withAncillary(validChunk) }), { media: "image/png", width: 4, height: 3 });
    TestValidator.predicate(`${family} corrupted ancillary CRC refuses`, refuses(`${family}-bad-crc.png`, withAncillary(invalidChunk)));
  }
}
