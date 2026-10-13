import { TestValidator } from "@nestia/e2e";
import { PNG } from "pngjs";
import { jpeg } from "../internal/designReference/jpeg";
import { inspect } from "../internal/designReference/inspect";
import { refuses } from "../internal/designReference/refuses";
import { utf8 } from "../internal/designReference/utf8";

/**
 * Container selection reads actual positive PNG and baseline/progressive/restart JPEG facts from independently authored input extents.
 *
 * Scenarios:
 *
 * 1. Decode the independently authored four by three PNG extent.
 * 2. Read baseline, progressive and restart JPEG grammar at the same extent.
 */
export const test_production_design_reference_container = (): void => {
  const image = new PNG({ width: 4, height: 3 });
  image.data.fill(0xff);
  const png = PNG.sync.write(image);
  TestValidator.predicate(
    "the adjacent supported raster does not raise a container refusal",
    refuses("supported.png", png) === false,
  );
  TestValidator.equals(
    "UTF-8 and container failures remain distinct typed classes",
    [
      refuses("bad.png", png.subarray(0, 24), "encoding"),
      refuses("bad.svg",new Uint8Array([0x80]), "container"),
      inspect("plain.txt",utf8("plain document")),
    ],
    [false, false, null],
  );
  TestValidator.equals(
    "complete PNG and baseline/progressive JPEG expose their parsed extent",
    [
      inspect("plan.png", png),
      inspect("scan.jpg", jpeg()),
      inspect("scan-progressive.jpg", jpeg(0xc2)),
      inspect("scan-restarted.jpg", jpeg(0xc0, 4)),
    ],
    [
      { media: "image/png", width: 4, height: 3 },
      { media: "image/jpeg", width: 4, height: 3 },
      { media: "image/jpeg", width: 4, height: 3 },
      { media: "image/jpeg", width: 4, height: 3 },
    ],
  );

};
