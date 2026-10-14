import {
  normalizeProductionH264Mp4,
  probeProductionVideoMp4,
} from "@automovie/render/node";
import { TestValidator } from "@nestia/e2e";
import { BoxParser, createFile } from "mp4box";

import { parseProductionMp4 } from "../internal/productionMedia/parseProductionMp4";

/**
 * Normalization writes the ISO eleven-byte nclx payload through the native
 * box data writer and leaves every resident sample and clock untouched.
 * This container unit establishes no decoded AVC picture quality.
 *
 * Scenarios:
 *
 * 1. Replace a supported adjacent nclx declaration and preserve an unrelated
 *    sample-entry child box through the native writer.
 * 2. Read the independently specified H.273 sRGB fields and exact serialized
 *    nineteen-byte colr box, including its eight-byte ISO header.
 * 3. Preserve the independently authored sample bytes, DTS, CTS and duration.
 *
 * @evidence contracts/testing.md#behavioral-verification Authors an in-memory MP4 with adjacent nclx/pasp boxes and a known sample, probes its original color, runs the real normalizer, then reparses exact normalized color framing, square-pixel child, unchanged sample payload and integer DTS/CTS/duration. Incorrect raw box size or dropped child/sample bytes fail the independent byte arrays.
 * @evidence contracts/testing.md#independent-expectations Literal nclx bytes encode primaries one, transfer thirteen, matrix one and high-bit full range in an eleven-byte payload plus eight-byte ISO header. Independently authored sample [0,0,0,2,0x65,91] and clocks [1,0,0] define transport expectations; relabeling color proves neither color conversion nor valid decoded H.264 pixels.
 * @evidence contracts/testing.md#distinguishing-cases Retains old transfer-one/limited-range color against normalized transfer-thirteen/full-range output, an unrelated explicit-square pasp child and exact sample/clock preservation. Profile refusal, track composition and multi-sample transport belong to other video tests.
 * @evidence contracts/testing.md#execution-ownership The named test_production_video_color_normalization owns portable synchronous MP4Box writer/parser and normalization cases. Its hand-authored NAL bytes are transport input; it launches no encoder/decoder, creates no files and observes no GPU colors.
 */
export function test_production_video_color_normalization(): void {
  const oldColor: InstanceType<typeof BoxParser.box.colr> = new BoxParser.box.colr();
  oldColor.data = Uint8Array.from([
    0x6e, 0x63, 0x6c, 0x78, 0, 1, 0, 1, 0, 1, 0,
  ]);
  const pixelAspect: InstanceType<typeof BoxParser.box.pasp> = new BoxParser.box.pasp();
  pixelAspect.data = Uint8Array.from([0, 0, 0, 1, 0, 0, 0, 1]);
  const file: ReturnType<typeof createFile> = createFile();
  file.init({ brands: ["isom"], timescale: 24, duration: 1 });
  const track: ReturnType<typeof file.addTrack> = file.addTrack({
    type: "avc1",
    hdlr: "vide",
    width: 16,
    height: 16,
    timescale: 24,
    media_duration: 1,
    duration: 1,
    description_boxes: [oldColor, pixelAspect],
  });
  const payload: Uint8Array = Uint8Array.from([0, 0, 0, 2, 0x65, 91]);
  file.addSample(track, payload, {
    duration: 1,
    dts: 0,
    cts: 0,
    is_sync: true,
  });
  const input: Uint8Array = new Uint8Array(file.getBuffer().buffer);
  TestValidator.equals(
    "the authored adjacent input really carries the older color declaration",
    probeProductionVideoMp4(input).color,
    {
      container: {
        kind: "nclx",
        primaries: 1,
        transfer: 1,
        matrix: 1,
        fullRange: false,
      },
      resolved: { kind: "absent" },
    },
  );
  const normalized: Uint8Array = normalizeProductionH264Mp4(input);
  const probe: ReturnType<typeof probeProductionVideoMp4> = probeProductionVideoMp4(normalized);
  const parsed: ReturnType<typeof parseProductionMp4> = parseProductionMp4(normalized);
  const sample: NonNullable<ReturnType<typeof parsed.file.getTrackSamplesInfo>>[number] = parsed.file.getTrackSamplesInfo(
    parsed.movie.videoTracks[0]!.id,
  )[0]!;
  const colorOffset: number = Buffer.from(normalized).indexOf("colr") - 4;
  TestValidator.equals(
    "native color framing, profile and sample transport match independent input laws",
    {
      color: probe.color,
      pixelAspect: probe.pixelAspect,
      colorBox: Array.from(normalized.subarray(colorOffset, colorOffset + 19)),
      sample: Array.from(
        normalized.subarray(sample.offset, sample.offset + sample.size),
      ),
      clocks: [sample.duration, sample.dts, sample.cts],
    },
    {
      color: {
        container: {
          kind: "nclx",
          primaries: 1,
          transfer: 13,
          matrix: 1,
          fullRange: true,
        },
        resolved: { kind: "srgb", source: "container" },
      },
      pixelAspect: { kind: "explicit", hSpacing: 1, vSpacing: 1 },
      colorBox: [0, 0, 0, 19, 0x63, 0x6f, 0x6c, 0x72, 0x6e, 0x63, 0x6c, 0x78,
        0, 1, 0, 13, 0, 1, 0x80],
      sample: [0, 0, 0, 2, 0x65, 91],
      clocks: [1, 0, 0],
    },
  );
}
