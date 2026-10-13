import { TestValidator } from "@nestia/e2e";

import { jpeg } from "../internal/designReference/jpeg";
import { stage } from "../internal/designReference/stage";
import { segment } from "../internal/designReference/segment";

/**
 * JPEG marker grammar refuses incomplete segment extents before consuming a
 * frame or entropy scan, and recognizes only terminal closure as completion.
 *
 * Scenarios:
 *
 * 1. Admit an adjacent complete frame carrying ignored metadata segments.
 * 2. Refuse short/past-end segment extents and standalone SOI/RST markers.
 * 3. Distinguish absent entropy bytes from a truncated scan at end of input.
 */
export const test_production_design_reference_jpeg_boundaries = (): void => {
  const input = jpeg();
  const metadata = new Uint8Array([
    0xff, 0xd8, ...segment(0xe0, [1, 2]), ...input.subarray(2),
  ]);
  const frame = segment(0xc0, [8, 0, 3, 0, 4, 1, 1, 0x11, 0]);
  const scan = segment(0xda, [1, 1, 0, 0, 63, 0]);
  TestValidator.equals(
    "an ignored metadata segment preserves the independently stated raster",
    stage("metadata.jpg",metadata),
    JSON.stringify({ media: "image/jpeg", width: 4, height: 3 }),
  );
  TestValidator.equals(
    "marker and segment boundaries retain native refusal ownership",
    [
      stage("short.jpg",new Uint8Array([0xff,0xd8,0xff,0xe0,0,1])),
      stage("extent.jpg",new Uint8Array([0xff,0xd8,0xff,0xe0,0,8,1])),
      stage("soi.jpg",new Uint8Array([0xff,0xd8,0xff,0xd8])),
      stage("rst.jpg",new Uint8Array([0xff,0xd8,0xff,0xd0])),
      stage("empty.jpg",new Uint8Array([0xff,0xd8,...frame,...scan,0xff,0xd9])),
      stage("truncated.jpg",new Uint8Array([0xff,0xd8,...frame,...scan,1,0xff])),
    ],
    ["JPEG:segment","JPEG:segment","JPEG:marker","JPEG:marker","JPEG:scan","JPEG:closure"],
  );
};
