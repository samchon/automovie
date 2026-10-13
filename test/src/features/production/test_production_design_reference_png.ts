import { TestValidator } from "@nestia/e2e";
import { PNG } from "pngjs";
import { stage } from "../internal/designReference/stage";
import { pngChunk } from "../internal/designReference/pngChunk";
import { rebuildPng } from "../internal/designReference/rebuildPng";
import { pngStream } from "../internal/designReference/pngStream";
import { refuses } from "../internal/designReference/refuses";

/**
 * PNG framing, CRC, payload presence, extent and terminal IEND refusals retain their exact native parser stages.
 *
 * Scenarios:
 *
 * 1. Admit the adjacent supported grammar and independently stated facts.
 * 2. Refuse every malformed family input at its owning native parsing stage.
 */
export const test_production_design_reference_png = (): void => {
  const image = new PNG({ width: 4, height: 3 });
  image.data.fill(0xff);
  const png = PNG.sync.write(image);
  const badCrc = Buffer.from(png);
  badCrc[29] = badCrc[29]! ^ 0x01;
  TestValidator.equals(
    "PNG prefix, bad CRC, missing IDAT and missing IEND are refused",
    [
      refuses("prefix.png", png.subarray(0, 24)),
      refuses("crc.png", badCrc),
      refuses(
        "no-idat.png",
        rebuildPng(png, (chunk) =>
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
        rebuildPng(png, (chunk) =>
          chunk.type === "IEND"
            ? pngChunk("IEND", new Uint8Array([1]))
            : pngChunk(chunk.type, chunk.data),
        ),
      ),
      pngZeroExtent: stage("extent.png", pngStream(0, 2, true)),
      pngNoIdat: stage("idat.png", pngStream(2, 2, false)),
    },
    {
      pngNonEmptyIend: "PNG:IEND",
      pngZeroExtent: "PNG:IHDR",
      pngNoIdat: "PNG:IDAT",
    },
  );

};
