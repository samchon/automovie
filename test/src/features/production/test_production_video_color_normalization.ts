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
 */
export const test_production_video_color_normalization = (): void => {
  const oldColor = new BoxParser.box.colr();
  oldColor.data = Uint8Array.from([
    0x6e, 0x63, 0x6c, 0x78, 0, 1, 0, 1, 0, 1, 0,
  ]);
  const pixelAspect = new BoxParser.box.pasp();
  pixelAspect.data = Uint8Array.from([0, 0, 0, 1, 0, 0, 0, 1]);
  const file = createFile();
  file.init({ brands: ["isom"], timescale: 24, duration: 1 });
  const track = file.addTrack({
    type: "avc1",
    hdlr: "vide",
    width: 16,
    height: 16,
    timescale: 24,
    media_duration: 1,
    duration: 1,
    description_boxes: [oldColor, pixelAspect],
  });
  const payload = Uint8Array.from([0, 0, 0, 2, 0x65, 91]);
  file.addSample(track, payload, {
    duration: 1,
    dts: 0,
    cts: 0,
    is_sync: true,
  });
  const input = new Uint8Array(file.getBuffer().buffer);
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
  const normalized = normalizeProductionH264Mp4(input);
  const probe = probeProductionVideoMp4(normalized);
  const parsed = parseProductionMp4(normalized);
  const sample = parsed.file.getTrackSamplesInfo(
    parsed.movie.videoTracks[0]!.id,
  )[0]!;
  const colorOffset = Buffer.from(normalized).indexOf("colr") - 4;
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
};
