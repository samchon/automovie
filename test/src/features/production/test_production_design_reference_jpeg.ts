import { TestValidator } from "@nestia/e2e";
import { segment } from "../internal/designReference/segment";
import { jpeg } from "../internal/designReference/jpeg";
import { stage } from "../internal/designReference/stage";
import { refuses } from "../internal/designReference/refuses";

/**
 * JPEG frame and scan membership, restart order and terminal closure are enforced through actual typed byte inputs.
 *
 * Scenarios:
 *
 * 1. Admit the adjacent supported grammar and independently stated facts.
 * 2. Refuse every malformed family input at its owning native parsing stage.
 */
export const test_production_design_reference_jpeg = (): void => {
  TestValidator.equals(
    "JPEG needs a complete frame, scan and terminal EOI",
    [
      refuses("sof.jpg", jpeg().subarray(0, 13)),
      refuses("no-eoi.jpg", jpeg().subarray(0, jpeg().length - 2)),
      refuses(
        "no-scan.jpg",
        new Uint8Array([...jpeg().subarray(0, 15), 0xff, 0xd9]),
      ),
      refuses(
        "double-frame.jpg",
        new Uint8Array([
          ...jpeg().subarray(0, 15),
          ...jpeg().subarray(2, 15),
          ...jpeg().subarray(15),
        ]),
      ),
      refuses(
        "scan-first.jpg",
        new Uint8Array([
          0xff,
          0xd8,
          ...segment(0xda, [1, 1, 0, 0, 63, 0]),
          0x11,
          0xff,
          0xd9,
        ]),
      ),
      refuses(
        "bad-scan.jpg",
        new Uint8Array([
          ...jpeg().subarray(0, 15),
          ...segment(0xda, [2, 1, 0, 0, 63, 0]),
          0x11,
          0xff,
          0xd9,
        ]),
      ),
      refuses(
        "empty-frame.jpg",
        new Uint8Array([
          0xff,
          0xd8,
          ...segment(0xc0, [8, 0, 3, 0, 4, 0]),
          0xff,
          0xd9,
        ]),
      ),
      refuses(
        "unknown-component.jpg",
        new Uint8Array([
          ...jpeg().subarray(0, 15),
          ...segment(0xda, [1, 2, 0, 0, 63, 0]),
          0x11,
          0xff,
          0xd9,
        ]),
      ),
      refuses("restart-without-dri.jpg", jpeg(0xc0, null)),
      refuses("restart-with-zero-dri.jpg", jpeg(0xc0, 0)),
      refuses(
        "malformed-dri.jpg",
        new Uint8Array([
          0xff,
          0xd8,
          ...segment(0xdd, [1]),
          ...jpeg().subarray(2),
        ]),
      ),
      refuses(
        "empty-restart-scan.jpg",
        new Uint8Array([
          0xff,
          0xd8,
          ...segment(0xc0, [8, 0, 3, 0, 4, 1, 1, 0x11, 0]),
          ...segment(0xdd, [0, 1]),
          ...segment(0xda, [1, 1, 0, 0, 63, 0]),
          0xff,
          0xd0,
          0xff,
          0xd9,
        ]),
      ),
    ],
    [true, true, true, true, true, true, true, true, true, true, true, true],
  );
  const frame = segment(0xc0, [8, 0, 3, 0, 4, 1, 1, 0x11, 0]);
  const scan = segment(0xda, [1, 1, 0, 0, 63, 0]);
  TestValidator.equals(
    "native parser stages retain exact family and refusal identity",
    {
      jpegNoMarker: stage(
        "marker.jpg",
        new Uint8Array([0xff, 0xd8, ...frame, 0x12]),
      ),
      jpegTruncatedMarker: stage("cut.jpg", new Uint8Array([0xff, 0xd8, 0xff])),
      jpegBytesAfterEoi: stage("tail.jpg", new Uint8Array([...jpeg(), 0x00])),
      jpegEoiWithoutFrame: stage(
        "frameless.jpg",
        new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
      ),
      jpegStandaloneMarker: stage(
        "tem.jpg",
        new Uint8Array([0xff, 0xd8, 0xff, 0x01]),
      ),
      jpegReservedMarker: stage(
        "reserved.jpg",
        new Uint8Array([0xff, 0xd8, 0xff, 0x02]),
      ),
      jpegTruncatedSegmentLength: stage(
        "length.jpg",
        new Uint8Array([0xff, 0xd8, 0xff, 0xe0]),
      ),
      jpegShortFrame: stage(
        "short-frame.jpg",
        new Uint8Array([0xff, 0xd8, ...segment(0xc0, [8, 0, 3, 0, 4])]),
      ),
      jpegDuplicateComponent: stage(
        "components.jpg",
        new Uint8Array([
          0xff,
          0xd8,
          ...segment(0xc0, [8, 0, 3, 0, 4, 2, 1, 0x11, 0, 1, 0x11, 0]),
        ]),
      ),
      jpegZeroExtent: stage(
        "zero.jpg",
        new Uint8Array([
          0xff,
          0xd8,
          ...segment(0xc0, [8, 0, 0, 0, 4, 1, 1, 0x11, 0]),
        ]),
      ),
      jpegFillBytes: stage(
        "fill.jpg",
        new Uint8Array([0xff, 0xd8, ...frame, ...scan, 0x11, 0xff, 0xff, 0xd9]),
      ),
      jpegRestartOrder: stage(
        "restart-order.jpg",
        new Uint8Array([
          0xff,
          0xd8,
          ...frame,
          ...segment(0xdd, [0, 1]),
          ...scan,
          0x11,
          0xff,
          0xd1,
          0x22,
          0xff,
          0xd9,
        ]),
      ),
    },
    {
      jpegNoMarker: "JPEG:marker",
      jpegTruncatedMarker: "JPEG:closure",
      jpegBytesAfterEoi: "JPEG:closure",
      jpegEoiWithoutFrame: "JPEG:frame",
      jpegStandaloneMarker: "JPEG:marker",
      jpegReservedMarker: "JPEG:marker",
      jpegTruncatedSegmentLength: "JPEG:segment",
      jpegShortFrame: "JPEG:frame",
      jpegDuplicateComponent: "JPEG:frame",
      jpegZeroExtent: "JPEG:frame",
      jpegFillBytes: JSON.stringify({
        media: "image/jpeg",
        width: 4,
        height: 3,
      }),
      jpegRestartOrder: "JPEG:restart",
    },
  );

};
