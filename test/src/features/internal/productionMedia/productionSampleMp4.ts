import { normalizeProductionH264Mp4 } from "@automovie/render/node";
import { createFile } from "mp4box";

/**
 * Author resident AVC sample-table inputs without running a video encoder.
 *
 * These bytes exercise the actual ISO parser and lossless sample transport.
 * Each payload contains a length-prefixed NAL identity and a caller-independent
 * ordinal; expected order, times and exact byte preservation follow from that
 * authored input. No test using this builder establishes decoded H.264 pixels
 * or decoder interoperability. The real producer has its separate generated
 * consumer observation with a real codec.
 * Callers arrange positive integer raster, frames-per-second and ticks-per-frame
 * inputs. Zero samples remain an authored normalization refusal; other invalid
 * container fields are authored by the separate refusal cases.
 */
export const productionSampleMp4 = (props: {
  width: number;
  height: number;
  fps: number;
  frameCount: number;

  /** Positive integer media ticks per frame; one tick preserves the default clock. */
  ticksPerFrame?: number;
}): Uint8Array => {
  const ticksPerFrame = props.ticksPerFrame ?? 1;
  const timescale = props.fps * ticksPerFrame;
  const duration = props.frameCount * ticksPerFrame;
  const file = createFile();
  file.init({
    brands: ["isom", "iso2", "mp41"],
    timescale,
    duration,
  });
  const track = file.addTrack({
    type: "avc1",
    hdlr: "vide",
    timescale,
    media_duration: duration,
    duration,
    width: props.width,
    height: props.height,
    // ISO AVCDecoderConfigurationRecord: version 1, Baseline profile, Level 1,
    // four-byte NAL lengths and empty parameter-set inventories. This is a
    // parser configuration input, not a decoder-valid picture claim.
    avcDecoderConfigRecord: Uint8Array.from([
      1, 66, 0, 10, 0xff, 0xe0, 0,
    ]).buffer,
  });
  for (let index = 0; index < props.frameCount; ++index)
    file.addSample(track, Uint8Array.from([0, 0, 0, 2, 0x65, index]), {
      duration: ticksPerFrame,
      dts: index * ticksPerFrame,
      cts: index * ticksPerFrame,
      is_sync: true,
    });
  return normalizeProductionH264Mp4(new Uint8Array(file.getBuffer().buffer));
};
