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
 *
 * @evidence contracts/testing.md#behavioral-verification Inspects complete JPEG with ignored metadata and malformed marker/segment/scan boundaries, asserting integer frame metadata or exact typed refusal stages; length overreads and prefix-only completion fail.
 * @evidence contracts/testing.md#independent-expectations Authored segment lengths, 4-by-3 frame fields, required entropy bytes and terminal EOI define the expected marker-profile facts independently of parser output. A complete marker stream is not proof of decoded pixels or visual validity.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts ignored APP metadata with short/past-end segments, standalone SOI/RST and empty versus truncated scans; component membership and restart ordering belong to the JPEG unit.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit owns all assertions and passes in-memory authored bytes to production inspection through existing helpers, without host effects or dynamically registered cases.
 */
export function test_production_design_reference_jpeg_boundaries(): void {
  const input: Uint8Array = jpeg();
  const metadata: Uint8Array = new Uint8Array([
    0xff, 0xd8, ...segment(0xe0, [1, 2]), ...input.subarray(2),
  ]);
  const frame: number[] = segment(0xc0, [8, 0, 3, 0, 4, 1, 1, 0x11, 0]);
  const scan: number[] = segment(0xda, [1, 1, 0, 0, 63, 0]);
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
}
